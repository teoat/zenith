from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid


class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class FraudAlert:
    rule_name: str
    severity: AlertSeverity
    confidence: float = 0.0
    risk_score: float = 0.0
    description: str = ""
    transaction_ids: List[str] = field(default_factory=list)
    entities: List[str] = field(default_factory=list)
    alert_metadata: Dict[str, Any] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    detected_at: datetime = field(default_factory=datetime.utcnow)
    alert_id: str = field(default_factory=lambda: str(uuid.uuid4()))


class RuleEngine:
    def __init__(self):
        self.rules = {}

    def execute_rules(self, transactions: List[Dict[str, Any]], context: Optional[Dict[str, Any]] = None):
        return []

    def get_execution_stats(self, limit: int = 50):
        return {"total": 0, "triggered": 0}

    def get_rule_status(self):
        return {"total_rules": len(self.rules), "enabled": len(self.rules)}


__all__ = ["AlertSeverity", "FraudAlert", "RuleEngine"]
