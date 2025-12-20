from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List
import logging
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class MirrorConfig:
    time_window_minutes: int
    amount_tolerance: float

@dataclass
class MirrorTransactionAlert:
    transaction_ids: List[str]
    amount: float
    time_diff_seconds: float
    confidence: float

def detect_mirror_transactions(
    transactions: List[Dict[str, Any]],
    time_window_minutes: int = 60,
    amount_tolerance: float = 0.01,
) -> List[MirrorTransactionAlert]:
    """
    Detects mirror transactions: A -> B followed by B -> A (or similar flow reversing)
    within a short time window with similar amounts.
    """
    alerts = []
    if not transactions:
        return alerts
        
    sorted_tx = sorted(transactions, key=lambda x: x.get("date", ""))

    for i in range(len(sorted_tx)):
        tx1 = sorted_tx[i]

        # Parse date safely (assuming ISO strings or datetime objects)
        date1 = tx1.get("date")
        if isinstance(date1, str):
            try:
                date1 = datetime.fromisoformat(date1.replace("Z", "+00:00"))
            except ValueError:
                continue
        if not isinstance(date1, datetime):
            continue

        for j in range(i + 1, len(sorted_tx)):
            tx2 = sorted_tx[j]
            date2 = tx2.get("date")
            if isinstance(date2, str):
                try:
                    date2 = datetime.fromisoformat(date2.replace("Z", "+00:00"))
                except ValueError:
                    continue
            if not isinstance(date2, datetime):
                continue

            # Check time window
            time_diff = (date2 - date1).total_seconds()
            if time_diff > time_window_minutes * 60:
                break  # Sorted, so we can stop

            # Check amount similarity
            amt1 = float(tx1.get("amount", 0))
            amt2 = float(tx2.get("amount", 0))

            if amt1 == 0:
                continue

            amount_diff_percent = abs(amt1 - amt2) / amt1
            if amount_diff_percent > amount_tolerance:
                continue

            # Check for reversal pattern (simplified for single ledger view: Credit vs Debit)
            type1 = tx1.get("type")
            type2 = tx2.get("type")

            if type1 and type2 and type1 != type2:
                alerts.append(
                    MirrorTransactionAlert(
                        transaction_ids=[tx1.get("id"), tx2.get("id")],
                        amount=amt1,
                        time_diff_seconds=time_diff,
                        confidence=0.9 - (amount_diff_percent * 10),
                    )
                )

    return alerts

class MirrorTransactionPlugin(PluginInterface):
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="mirror_transaction",
            version="1.0.0",
            namespace="zenith/detection/fraud/mirror_transaction",
            author="Zenith Team",
            description="Detects mirror transactions (A->B, B->A)",
            dependencies={},
            capabilities=["fraud_detection"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        config_dict = context.config if context.config else {
            "time_window_minutes": 60,
            "amount_tolerance": 0.01
        }
        self.config = MirrorConfig(**config_dict)
        return True
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expects {"transactions": [...]}
        """
        transactions = inputs.get("transactions", [])
        if not transactions:
             # Try single transaction wrapping (less effective for mirror but for interface consistency)
             tx = inputs.get("transaction")
             if tx:
                 transactions = [tx]
             else:
                 return {"alerts": []}
        
        alerts = detect_mirror_transactions(
            transactions, 
            time_window_minutes=self.config.time_window_minutes,
            amount_tolerance=self.config.amount_tolerance
        )
        
        results = []
        for alert in alerts:
            results.append({
                "transaction_ids": alert.transaction_ids,
                "risk_score": 80.0, # Fixed score for this rule
                "confidence": alert.confidence,
                "is_fraud": True,
                "reason": f"Mirror transaction (Amount: {alert.amount:.2f}, Time diff: {alert.time_diff_seconds:.0f}s)",
                "details": {
                    "amount": alert.amount,
                    "time_diff_seconds": alert.time_diff_seconds
                }
            })
            
        return {"alerts": results}

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        return []
