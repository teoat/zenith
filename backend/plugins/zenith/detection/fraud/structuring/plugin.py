from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List
import logging
from dataclasses import dataclass
from collections import defaultdict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class StructuringConfig:
    reporting_limit: float
    structuring_threshold: float
    time_window_days: int

@dataclass
class StructuringAlert:
    entity_name: str
    confidence: float
    pattern_type: str
    transaction_count: int
    total_amount: float
    transaction_ids: List[str]

def detect_structuring(
    transactions: List[Dict[str, Any]],
    reporting_limit: float = 10000.0,
    structuring_threshold: float = 0.9,
    time_window_days: int = 30
) -> List[StructuringAlert]:
    """
    Detects structuring (smurfing): multiple transactions just below reporting limit.
    """
    alerts = []
    # Group by customer
    customer_txs = defaultdict(list)
    for tx in transactions:
        cust = tx.get("customer_id")
        if cust:
            customer_txs[cust].append(tx)
            
    lower_bound = reporting_limit * (1.0 - structuring_threshold) # e.g. 10% below = 9000
    # Actually usually it means just below, e.g. 9000-9999. 
    # structuring_threshold 0.9 means we care about tx > 90% of limit?
    # Or strict just-below? Let's assume txs in range [Limit * Threshold, Limit)
    
    threshold_val = reporting_limit * structuring_threshold
    
    for customer, txs in customer_txs.items():
        # Filter for "just below" transactions
        suspicious_txs = []
        for tx in txs:
            amt = float(tx.get("amount", 0))
            if threshold_val <= amt < reporting_limit:
                suspicious_txs.append(tx)
        
        # If multiple suspicious txs found
        if len(suspicious_txs) >= 2:
            # Check time window (simplified: max-min date < window)
            dates = []
            for t in suspicious_txs:
                d = t.get("date")
                if isinstance(d, str):
                    try:
                        d = datetime.fromisoformat(d.replace("Z", "+00:00"))
                        dates.append(d)
                    except: pass
            
            if dates:
                dates.sort()
                window = (dates[-1] - dates[0]).days
                if window <= time_window_days:
                    total_amt = sum(float(t.get("amount",0)) for t in suspicious_txs)
                    
                    # If total exceeds limit, it's classic structuring to avoid reporting
                    if total_amt > reporting_limit:
                        alerts.append(StructuringAlert(
                            entity_name=customer,
                            confidence=0.85 + (0.05 * len(suspicious_txs)),
                            pattern_type="smurfing_just_below_limit",
                            transaction_count=len(suspicious_txs),
                            total_amount=total_amt,
                            transaction_ids=[t.get("id") for t in suspicious_txs]
                        ))
                        
    return alerts

class StructuringPlugin(PluginInterface):
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="structuring",
            version="1.0.0",
            namespace="zenith/detection/fraud/structuring",
            author="Zenith Team",
            description="Detects transaction structuring (smurfing)",
            dependencies={},
            capabilities=["fraud_detection"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        config_dict = context.config if context.config else {
            "reporting_limit": 10000.0,
            "structuring_threshold": 0.85, # Look for txs > 8500
            "time_window_days": 7
        }
        self.config = StructuringConfig(**config_dict)
        return True
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        transactions = inputs.get("transactions", [])
        
        alerts = detect_structuring(
            transactions,
            reporting_limit=self.config.reporting_limit,
            structuring_threshold=self.config.structuring_threshold,
            time_window_days=self.config.time_window_days
        )
        
        results = []
        for alert in alerts:
            results.append({
                "entity_name": alert.entity_name,
                "is_fraud": True,
                "risk_score": 85.0,
                "confidence": alert.confidence,
                "reason": f"Structuring detected ({alert.pattern_type}). {alert.transaction_count} transactions totaling {alert.total_amount}",
                "details": {
                    "total_amount": alert.total_amount,
                    "count": alert.transaction_count,
                    "pattern": alert.pattern_type
                }
            })
            
        return {"alerts": results}

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        return []
