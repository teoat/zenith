import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import Transaction

logger = logging.getLogger(__name__)


class ReconciliationService:
    def __init__(self, db: Session):
        self.db = db

    def reconcile_cash_float(self, entity_name: str, start_date: datetime, end_date: datetime) -> dict[str, Any]:
        """
        Reconciles cash float for a specific entity (e.g., 'Petty Cash', 'Site Manager').
        Compares 'TRANSFER' to the entity vs. 'EXPENSE' reported by the entity.

        Formula:
        Float Balance = (Sum of Transfers TO entity) - (Sum of Expenses BY entity)
        """
        # 1. Get total transfers TO the entity
        transfers = (
            self.db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.transaction_type == "TRANSFER",
                Transaction.description.ilike(f"%Transfer to {entity_name}%"),
                Transaction.date >= start_date,
                Transaction.date <= end_date,
            )
            .scalar()
            or 0.0
        )

        # 2. Get total expenses BY the entity
        # Assuming expenses are tagged with the entity in merchant_name or description,
        # or grouped by a 'wallet' tag in metadata.
        # For MVP, we search description or metadata 'spender'.
        expenses = (
            self.db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.transaction_type == "DEBIT",
                Transaction.description.ilike(f"%{entity_name}%"),  # Broad match for MVP
                Transaction.date >= start_date,
                Transaction.date <= end_date,
            )
            .scalar()
            or 0.0
        )

        variance = transfers - expenses

        return {
            "entity": entity_name,
            "period": {"start": start_date, "end": end_date},
            "total_transferred_in": transfers,
            "total_spent_out": expenses,
            "float_balance": variance,
            "status": "BALANCED" if abs(variance) < 0.01 else "VARIANCE",
        }

    def find_batch_matches(self, withdrawal_id: str, tolerance: float = 0.05) -> dict[str, Any]:
        """
        Attempts to find a set of expenses that sum up to a specific withdrawal amount.
        Useful for reconciling a 'Cash Withdrawal' against a batch of receipts.
        """
        withdrawal = self.db.query(Transaction).filter(Transaction.id == withdrawal_id).first()
        if not withdrawal:
            return {"error": "Withdrawal transaction not found"}

        target_amount = abs(withdrawal.amount)

        # Look for expenses in the 30 days FOLLOWING the withdrawal
        lookahead_days = 30
        end_date = withdrawal.date + timedelta(days=lookahead_days)

        potential_expenses = (
            self.db.query(Transaction)
            .filter(
                Transaction.transaction_type == "DEBIT",
                Transaction.date >= withdrawal.date,
                Transaction.date <= end_date,
                Transaction.amount > 0,  # Expenses
            )
            .all()
        )

        # Simple greedy variation of Subset Sum Problem for MVP
        # In production, use dynamic programming or a specialized solver for exact matches
        matches = []
        current_sum = 0.0
        remaining_expenses = []

        # Naive approach: take expenses that fit
        for expense in potential_expenses:
            if current_sum + expense.amount <= target_amount + tolerance:
                matches.append(expense)
                current_sum += expense.amount
            else:
                remaining_expenses.append(expense)

        variance = target_amount - current_sum

        return {
            "withdrawal": {
                "id": withdrawal.id,
                "amount": target_amount,
                "date": withdrawal.date,
            },
            "matched_expenses_count": len(matches),
            "matched_expenses_sum": current_sum,
            "variance": variance,
            "is_fully_reconciled": abs(variance) <= tolerance,
            "matches": [{"id": m.id, "amount": m.amount, "desc": m.description} for m in matches],
        }

    def save_batch_match(self, withdrawal_id: str, expense_ids: list[str]) -> dict[str, Any]:
        """
        Link a withdrawal to multiple expenses by assigning them a common batch_id.
        """
        import uuid

        batch_id = str(uuid.uuid4())

        # 1. Update Withdrawal
        withdrawal = self.db.query(Transaction).filter(Transaction.id == withdrawal_id).first()
        if not withdrawal:
            return {"error": "Withdrawal transaction not found"}

        # Update metadata safely
        meta = dict(withdrawal.transaction_metadata or {})
        meta["batch_id"] = batch_id
        meta["batch_role"] = "funding_source"
        withdrawal.transaction_metadata = meta

        # 2. Update Expenses
        expenses = self.db.query(Transaction).filter(Transaction.id.in_(expense_ids)).all()

        for expense in expenses:
            ex_meta = dict(expense.transaction_metadata or {})
            ex_meta["batch_id"] = batch_id
            ex_meta["batch_role"] = "expense"
            ex_meta["funding_source_id"] = withdrawal_id
            expense.transaction_metadata = ex_meta

        self.db.commit()

        return {
            "batch_id": batch_id,
            "withdrawal_id": withdrawal_id,
            "expense_ids": [e.id for e in expenses],
            "status": "success",
        }

    def detect_mirror_transfers(self, case_id: str, window_hours: int = 48) -> list[dict[str, Any]]:
        """
        Implementation of the Temporal Pair Matcher (Mirror Detection).
        Scans for $X outflow from Account A -> $X inflow to Account B within 48 hours.
        Identifies "Wash" transactions that should be collapsed in the UI.
        """
        logger.info(f"Scanning for mirror transfers in case {case_id}")

        # 1. Get all transactions for the case
        transactions = self.db.query(Transaction).filter(Transaction.case_id == case_id).order_by(Transaction.date.asc()).all()

        if not transactions:
            return []

        mirror_pairs = []
        visited_ids = set()

        # 2. Nested loop to find temporal pairs with matching amounts
        for i, tx_out in enumerate(transactions):
            if tx_out.id in visited_ids:
                continue

            # Only consider outflows (DEBIT) for the source
            if tx_out.transaction_type != "DEBIT":
                continue

            for j in range(i + 1, len(transactions)):
                tx_in = transactions[j]

                if tx_in.id in visited_ids:
                    continue

                # Only consider inflows (CREDIT) for the target
                if tx_in.transaction_type != "CREDIT":
                    continue

                # Check if amounts match (within 0.01 tolerance)
                if abs(abs(tx_out.amount) - abs(tx_in.amount)) > 0.01:
                    continue

                # Check time window
                time_diff = (tx_in.date - tx_out.date).days * 24  # Simplified date diff
                if time_diff > window_hours:
                    break  # Sorted by date, so no more matches possible

                # 3. Calculate "Wash Score"
                # In a real system, we'd check if accounts share the same UBO from Entity/Relationship tables
                # For now, we simulate this by checking metadata 'shared_owner_id' or checking descriptions
                wash_score = 0.5  # Base score for amount + time match

                # Check for description similarities or metadata links
                out_meta = tx_out.transaction_metadata or {}
                in_meta = tx_in.transaction_metadata or {}

                if out_meta.get("owner_id") == in_meta.get("owner_id") and out_meta.get("owner_id"):
                    wash_score = 1.0
                elif tx_out.merchant_name == tx_in.merchant_name:  # Simple string match fallback
                    wash_score = 0.8

                if wash_score >= 0.5:
                    mirror_pairs.append(
                        {
                            "pair_id": f"mirror_{tx_out.id}_{tx_in.id}",
                            "source_tx": tx_out.id,
                            "target_tx": tx_in.id,
                            "amount": abs(tx_out.amount),
                            "wash_score": wash_score,
                            "suggested_action": "COLLAPSE",
                            "reason": f"Symmetric transfer detected within {time_diff}h between related endpoints.",
                        }
                    )
                    visited_ids.add(tx_out.id)
                    visited_ids.add(tx_in.id)
                    break

        return mirror_pairs
