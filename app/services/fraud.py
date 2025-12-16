from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime


class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class FraudAlert:
    alert_id: str
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


class RuleEngine:
    """Lightweight rule engine compatibility shim used by tests.
    Tests can monkeypatch `execute_rules` on this class if needed.
    """
    def __init__(self):
        self.rules = {}

    def execute_rules(self, transactions: List[Dict[str, Any]], context: Optional[Dict[str, Any]] = None):
        # Default: no rules triggered
        return []

    def get_execution_stats(self, limit: int = 50):
        return {
            "total": 0,
            "triggered": 0
        }

    def get_rule_status(self):
        return {
            "total_rules": len(self.rules),
            "enabled": len([r for r in self.rules.values() if getattr(r, 'enabled', True)])
        }
