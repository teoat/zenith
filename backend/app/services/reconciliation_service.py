import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from core.database import Transaction, FraudAlert
from app.services.fraud_rules_engine import FraudRulesEngine

logger = logging.getLogger(__name__)

class ReconciliationService:
    def __init__(self, db: Session):
        self.db = db

    def reconcile_cash_float(self, entity_name: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Reconciles cash float for a specific entity (e.g., 'Petty Cash', 'Site Manager').
        Compares 'TRANSFER' to the entity vs. 'EXPENSE' reported by the entity.
        
        Formula: 
        Float Balance = (Sum of Transfers TO entity) - (Sum of Expenses BY entity)
        """
        # 1. Get total transfers TO the entity
        transfers = self.db.query(func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == 'TRANSFER',
            Transaction.description.ilike(f"%Transfer to {entity_name}%"),
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).scalar() or 0.0

        # 2. Get total expenses BY the entity
        # Assuming expenses are tagged with the entity in merchant_name or description, 
        # or grouped by a 'wallet' tag in metadata. 
        # For MVP, we search description or metadata 'spender'.
        expenses = self.db.query(func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == 'DEBIT',
            Transaction.description.ilike(f"%{entity_name}%"), # Broad match for MVP
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).scalar() or 0.0

        variance = transfers - expenses

        return {
            "entity": entity_name,
            "period": {"start": start_date, "end": end_date},
            "total_transferred_in": transfers,
            "total_spent_out": expenses,
            "float_balance": variance,
            "status": "BALANCED" if abs(variance) < 0.01 else "VARIANCE"
        }

    def find_batch_matches(self, withdrawal_id: str, tolerance: float = 0.05) -> Dict[str, Any]:
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
        
        potential_expenses = self.db.query(Transaction).filter(
            Transaction.transaction_type == 'DEBIT',
            Transaction.date >= withdrawal.date,
            Transaction.date <= end_date,
            Transaction.amount > 0 # Expenses
        ).all()

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
                "date": withdrawal.date
            },
            "matched_expenses_count": len(matches),
            "matched_expenses_sum": current_sum,
            "variance": variance,
            "is_fully_reconciled": abs(variance) <= tolerance,
            "matches": [{"id": m.id, "amount": m.amount, "desc": m.description} for m in matches]
        }

    def save_batch_match(self, withdrawal_id: str, expense_ids: List[str]) -> Dict[str, Any]:
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
        meta['batch_id'] = batch_id
        meta['batch_role'] = 'funding_source'
        withdrawal.transaction_metadata = meta
        
        # 2. Update Expenses
        expenses = self.db.query(Transaction).filter(Transaction.id.in_(expense_ids)).all()
        
        for expense in expenses:
            ex_meta = dict(expense.transaction_metadata or {})
            ex_meta['batch_id'] = batch_id
            ex_meta['batch_role'] = 'expense'
            ex_meta['funding_source_id'] = withdrawal_id
            expense.transaction_metadata = ex_meta
            
        self.db.commit()
        
        return {
            "batch_id": batch_id,
            "withdrawal_id": withdrawal_id,
            "expense_ids": [e.id for e in expenses],
            "status": "success"
        }
