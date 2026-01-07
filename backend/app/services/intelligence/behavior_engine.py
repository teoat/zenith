import logging
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class BehaviorBaselineService:
    """
    Advanced Behavior Analytics for detecting deviations from "normal" patterns.
    Ref: 2025 Forensic Trends (Proactive Monitoring)
    """

    def __init__(self, db_session):
        self.db = db_session

    async def get_account_baseline(self, account_id: str) -> dict[str, Any]:
        """
        Calculates a statistical baseline for an account.
        """
        logger.info(f"Calculating behavior baseline for account {account_id}")

        # Real implementation would run statistical aggregates over the last 90 days
        # Mocking the baseline results
        return {
            "account_id": account_id,
            "avg_transaction_value": 1250.0,
            "volatility_index": 0.15,
            "geographic_footprint": ["USA", "UK"],
            "peak_activity_hours": [9, 10, 11, 14, 15],
            "merchant_categories": ["GROCERY", "UTILITIES", "TECHNOLOGY"],
            "last_calculated": datetime.utcnow().isoformat(),
        }

    async def detect_anomalies(self, account_id: str, current_transactions: list[dict]) -> list[dict]:
        """
        Compares current transactions against the baseline.
        """
        baseline = await self.get_account_baseline(account_id)
        anomalies = []

        for tx in current_transactions:
            tx_value = tx.get("amount", 0)
            # Simple threshold check
            if tx_value > (baseline["avg_transaction_value"] * 5):
                anomalies.append(
                    {
                        "transaction_id": tx.get("id"),
                        "type": "VALUE_SPIKE",
                        "severity": "HIGH",
                        "reason": f"Value {tx_value} is 5x higher than baseline average.",
                    }
                )

            # Simple Geo check
            if tx.get("location") not in baseline["geographic_footprint"]:
                anomalies.append(
                    {
                        "transaction_id": tx.get("id"),
                        "type": "GEO_ANOMALY",
                        "severity": "MEDIUM",
                        "reason": f"Transaction from {tx.get('location')} is outside typical footprint.",
                    }
                )

        return anomalies

    async def track_comingling_ratio(
        self,
        account_id: str,
        transactions: list[dict[str, Any]],
        initial_personal_buffer: float = 1000.0,
    ) -> dict[str, Any]:
        """
        Implementation of the LIBR Engine (Lowest Intermediate Balance Rule).
        Tracks co-mingled personal/business funds to identify illicit source dependency.
        """
        logger.info(f"Applying LIBR analysis for account {account_id}")

        # 1. Classify transactions
        # (Simplified classification for simulation)
        buffer = initial_personal_buffer
        illicit_dependency = 0.0
        business_survival_total = 0.0
        points = []

        sorted_txs = sorted(
            transactions,
            key=lambda x: x.get("timestamp") or x.get("date") or datetime.now(),
        )

        for tx in sorted_txs:
            amount = abs(tx.get("amount", 0))
            is_credit = tx.get("transaction_type") == "CREDIT"

            # Simplified heuristic for personal vs business
            desc = tx.get("description", "").upper()
            is_personal = any(term in desc for term in ["GROCERY", "CINEMA", "REST", "PHARMACY", "RENT"])
            is_business = any(term in desc for term in ["PAYROLL", "SUPPLY", "INVOICE", "VENDOR"])

            if is_credit:
                if is_personal:
                    buffer += amount
                else:
                    # Business income - does not count towards LIBR "Personal Buffer"
                    pass
            else:  # DEBIT
                if is_business:
                    business_survival_total += amount
                    if buffer >= amount:
                        # Business expense covered by personal float (Co-mingling)
                        buffer -= amount
                    else:
                        # Buffer exhausted! Illicit/Business funds must be filling the gap
                        shortfall = amount - buffer
                        illicit_dependency += shortfall
                        buffer = 0
                else:  # Personal expense
                    buffer = max(0, buffer - amount)

            points.append(
                {
                    "date": tx.get("date"),
                    "buffer": buffer,
                    "dependency_ratio": (illicit_dependency / business_survival_total) if business_survival_total > 0 else 0,
                }
            )

        ratio = (illicit_dependency / business_survival_total) if business_survival_total > 0 else 0

        return {
            "account_id": account_id,
            "comingling_ratio": ratio,
            "total_illicit_infusion": illicit_dependency,
            "status": "CRITICAL_DEPENDENCY" if ratio > 0.5 else "HIGH_CO_MINGLING" if ratio > 0.1 else "HEALTHY",
            "heatmap_data": points,
            "libr_verdict": f"Business survived on {ratio:.1%} illicit/external float after personal buffer exhaustion.",
        }


def get_behavior_service(db):
    return BehaviorBaselineService(db)
