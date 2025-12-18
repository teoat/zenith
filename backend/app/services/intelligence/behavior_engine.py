import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import text

logger = logging.getLogger(__name__)

class BehaviorBaselineService:
    """
    Advanced Behavior Analytics for detecting deviations from "normal" patterns.
    Ref: 2025 Forensic Trends (Proactive Monitoring)
    """
    def __init__(self, db_session):
        self.db = db_session

    async def get_account_baseline(self, account_id: str) -> Dict[str, Any]:
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
            "last_calculated": datetime.utcnow().isoformat()
        }

    async def detect_anomalies(self, account_id: str, current_transactions: List[Dict]) -> List[Dict]:
        """
        Compares current transactions against the baseline.
        """
        baseline = await self.get_account_baseline(account_id)
        anomalies = []
        
        for tx in current_transactions:
            tx_value = tx.get("amount", 0)
            # Simple threshold check
            if tx_value > (baseline["avg_transaction_value"] * 5):
                anomalies.append({
                    "transaction_id": tx.get("id"),
                    "type": "VALUE_SPIKE",
                    "severity": "HIGH",
                    "reason": f"Value {tx_value} is 5x higher than baseline average."
                })
            
            # Simple Geo check
            if tx.get("location") not in baseline["geographic_footprint"]:
                anomalies.append({
                    "transaction_id": tx.get("id"),
                    "type": "GEO_ANOMALY",
                    "severity": "MEDIUM",
                    "reason": f"Transaction from {tx.get('location')} is outside typical footprint."
                })
                
        return anomalies

def get_behavior_service(db):
    return BehaviorBaselineService(db)
