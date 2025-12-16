# services/fraud/engine.py
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Type

from app.services.ai_fraud_detector import AIFraudDetector

from .rules.ai_detection import AIDetectionAlert, detect_ai_fraud
from .rules.mirror_transaction import MirrorTransactionAlert, detect_mirror_transactions
from .rules.round_trip import RoundTripAlert, detect_round_trip_transactions
from .rules.shell_company import ShellCompanyAlert, detect_shell_companies
from .rules.structuring import StructuringAlert, detect_structuring

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class FraudAlert:
    """Base alert class for all fraud detection alerts"""

    alert_id: str
    rule_name: str
    severity: AlertSeverity
    confidence: float  # 0.0 to 1.0
    risk_score: float  # 0.0 to 100.0
    description: str
    detected_at: datetime
    case_id: Optional[str] = None
    transaction_ids: List[str] = field(default_factory=list)
    entities: List[str] = field(
        default_factory=list
    )  # customer IDs, merchant names, etc.
    metadata: Dict[str, Any] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)


class FraudRule(ABC):
    """Abstract base class for fraud detection rules"""

    def __init__(self, name: str, severity: AlertSeverity, enabled: bool = True):
        self.name = name
        self.severity = severity
        self.enabled = enabled
        self.last_run = None

    @abstractmethod
    def execute(
        self, transactions: List[Dict[str, Any]], context: Dict[str, Any] = None
    ) -> List[FraudAlert]:
        """Execute the rule and return alerts"""
        pass

    @abstractmethod
    def get_config_schema(self) -> Dict[str, Any]:
        """Return configuration schema for this rule"""
        pass


class RuleEngine:
    """Main fraud detection rule engine"""

    def __init__(self):
        self.rules: Dict[str, FraudRule] = {}
        self.rule_registry: Dict[str, Type[FraudRule]] = {}
        self.execution_history: List[Dict[str, Any]] = []
        self._register_builtin_rules()

    def _register_builtin_rules(self):
        """Register built-in fraud detection rules"""
        self.register_rule(MirrorTransactionRule())
        self.register_rule(ShellCompanyRule())
        self.register_rule(StructuringRule())
        self.register_rule(RoundTripRule())
        self.register_rule(AIDetectionRule())

    def register_rule(self, rule: FraudRule):
        """Register a fraud detection rule"""
        self.rules[rule.name] = rule
        logger.info(f"Registered fraud rule: {rule.name}")

    def unregister_rule(self, rule_name: str):
        """Unregister a fraud detection rule"""
        if rule_name in self.rules:
            del self.rules[rule_name]
            logger.info(f"Unregistered fraud rule: {rule_name}")

    def enable_rule(self, rule_name: str):
        """Enable a specific rule"""
        if rule_name in self.rules:
            self.rules[rule_name].enabled = True
            logger.info(f"Enabled fraud rule: {rule_name}")

    def disable_rule(self, rule_name: str):
        """Disable a specific rule"""
        if rule_name in self.rules:
            self.rules[rule_name].enabled = False
            logger.info(f"Disabled fraud rule: {rule_name}")

    def execute_rules(
        self, transactions: List[Dict[str, Any]], context: Dict[str, Any] = None
    ) -> List[FraudAlert]:
        """Execute all enabled rules and return combined alerts"""
        if context is None:
            context = {}

        all_alerts = []
        execution_start = datetime.now(timezone.utc)

        logger.info(
            f"Executing {len([r for r in self.rules.values() if r.enabled])} rules on {len(transactions)} transactions"
        )

        for rule in self.rules.values():
            if not rule.enabled:
                continue

            try:
                rule_start = datetime.now(timezone.utc)
                rule_alerts = rule.execute(transactions, context)
                rule_end = datetime.now(timezone.utc)

                # Update rule execution stats
                rule.last_run = rule_end
                all_alerts.extend(rule_alerts)

                # Record execution history
                self.execution_history.append(
                    {
                        "rule_name": rule.name,
                        "executed_at": rule_start,
                        "duration_ms": (rule_end - rule_start).total_seconds() * 1000,
                        "alerts_generated": len(rule_alerts),
                        "transactions_processed": len(transactions),
                    }
                )

                logger.debug(
                    f"Rule {rule.name} generated {len(rule_alerts)} alerts in {(rule_end - rule_start).total_seconds():.3f}s"
                )

            except Exception as e:
                logger.error(f"Error executing rule {rule.name}: {str(e)}")
                # Continue with other rules even if one fails
                continue

        execution_end = datetime.now(timezone.utc)

        # Sort alerts by risk score (highest first)
        all_alerts.sort(key=lambda x: x.risk_score, reverse=True)

        # Log execution summary
        self.execution_history.append(
            {
                "rule_name": "ENGINE_TOTAL",
                "executed_at": execution_start,
                "duration_ms": (execution_end - execution_start).total_seconds() * 1000,
                "alerts_generated": len(all_alerts),
                "transactions_processed": len(transactions),
                "rules_executed": len([r for r in self.rules.values() if r.enabled]),
            }
        )

        logger.info(
            f"Rule engine execution completed in {(execution_end - execution_start).total_seconds():.3f}s, generated {len(all_alerts)} alerts"
        )

        return all_alerts

    def get_rule_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all registered rules"""
        status = {}
        for name, rule in self.rules.items():
            status[name] = {
                "enabled": rule.enabled,
                "severity": rule.severity.value,
                "last_run": rule.last_run.isoformat() if rule.last_run else None,
                "config_schema": rule.get_config_schema(),
            }
        return status

    def get_execution_stats(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent execution statistics"""
        return self.execution_history[-limit:] if self.execution_history else []


# Built-in rule implementations
class MirrorTransactionRule(FraudRule):
    """Detect mirror transactions (A->B followed by B->A)"""

    def __init__(self):
        super().__init__("mirror_transaction", AlertSeverity.HIGH)

    def execute(
        self, transactions: List[Dict[str, Any]], context: Dict[str, Any] = None
    ) -> List[FraudAlert]:
        alerts = []
        raw_alerts = detect_mirror_transactions(transactions)

        for raw_alert in raw_alerts:
            alert = FraudAlert(
                alert_id=f"MT_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                rule_name=self.name,
                severity=self.severity,
                confidence=raw_alert.confidence,
                risk_score=raw_alert.confidence * 80,  # Scale to 0-100
                description=f"Mirror transaction detected: {raw_alert.amount} in {raw_alert.time_diff_seconds:.0f}s",
                detected_at=datetime.now(timezone.utc),
                transaction_ids=raw_alert.transaction_ids,
                metadata={
                    "amount": raw_alert.amount,
                    "time_diff_seconds": raw_alert.time_diff_seconds,
                },
                recommendations=[
                    "Review transaction sequence",
                    "Check for money laundering patterns",
                ],
            )
            alerts.append(alert)

        return alerts

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "time_window_minutes": {
                "type": "integer",
                "default": 60,
                "description": "Time window for mirror detection",
            },
            "amount_tolerance": {
                "type": "float",
                "default": 0.01,
                "description": "Amount tolerance for matching",
            },
        }


class ShellCompanyRule(FraudRule):
    """Detect potential shell companies"""

    def __init__(self):
        super().__init__("shell_company", AlertSeverity.MEDIUM)

    def execute(
        self, transactions: List[Dict[str, Any]], context: Dict[str, Any] = None
    ) -> List[FraudAlert]:
        alerts = []
        raw_alerts = detect_shell_companies(transactions)

        for raw_alert in raw_alerts:
            alert = FraudAlert(
                alert_id=f"SC_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                rule_name=self.name,
                severity=self.severity,
                confidence=0.8,
                risk_score=raw_alert.risk_score,
                description=f"Shell company suspected: {raw_alert.merchant_name}",
                detected_at=datetime.now(timezone.utc),
                entities=[raw_alert.merchant_name],
                metadata={"indicators": raw_alert.indicators},
                recommendations=[
                    "Conduct enhanced due diligence",
                    "Review business registration documents",
                ],
            )
            alerts.append(alert)

        return alerts

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "min_transaction_volume": {
                "type": "float",
                "default": 1000,
                "description": "Minimum volume to analyze",
            },
            "pass_through_threshold": {
                "type": "float",
                "default": 0.05,
                "description": "Pass-through detection threshold",
            },
        }


class StructuringRule(FraudRule):
    """Detect transaction structuring (just below reporting limits)"""

    def __init__(self):
        super().__init__("structuring", AlertSeverity.HIGH)

    def execute(
        self, transactions: List[Dict[str, Any]], context: Dict[str, Any] = None
    ) -> List[FraudAlert]:
        alerts = []
        raw_alerts = detect_structuring(transactions)

        for raw_alert in raw_alerts:
            alert = FraudAlert(
                alert_id=f"ST_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                rule_name=self.name,
                severity=self.severity,
                confidence=raw_alert.confidence,
                risk_score=raw_alert.confidence * 85,
                description=f"Transaction structuring detected for entity: {raw_alert.entity_name}",
                detected_at=datetime.now(timezone.utc),
                transaction_ids=raw_alert.transaction_ids,
                entities=[raw_alert.entity_name],
                metadata={
                    "total_amount": raw_alert.total_amount,
                    "transaction_count": raw_alert.transaction_count,
                    "pattern_type": raw_alert.pattern_type,
                },
                recommendations=[
                    "File SAR if applicable",
                    "Review transaction history",
                    "Consider account monitoring",
                ],
            )
            alerts.append(alert)

        return alerts

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "reporting_limit": {
                "type": "float",
                "default": 10000,
                "description": "Reporting threshold amount",
            },
            "structuring_threshold": {
                "type": "float",
                "default": 0.9,
                "description": "Threshold for structuring detection",
            },
        }


class RoundTripRule(FraudRule):
    """Detect round-trip transactions (funds that return to origin)"""

    def __init__(self):
        super().__init__("round_trip", AlertSeverity.CRITICAL)

    def execute(
        self, transactions: List[Dict[str, Any]], context: Dict[str, Any] = None
    ) -> List[FraudAlert]:
        alerts = []
        raw_alerts = detect_round_trip_transactions(transactions)

        for raw_alert in raw_alerts:
            alert = FraudAlert(
                alert_id=f"RT_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                rule_name=self.name,
                severity=self.severity,
                confidence=raw_alert.confidence,
                risk_score=raw_alert.confidence * 90,
                description=f"Round-trip transaction detected: {raw_alert.path_description}",
                detected_at=datetime.now(timezone.utc),
                transaction_ids=raw_alert.transaction_ids,
                entities=raw_alert.entities,
                metadata={
                    "path_length": raw_alert.path_length,
                    "total_time_hours": raw_alert.total_time_hours,
                    "amount": raw_alert.amount,
                },
                recommendations=[
                    "Immediate investigation required",
                    "Check for money laundering",
                    "Review all parties involved",
                ],
            )
            alerts.append(alert)

        return alerts

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "max_path_length": {
                "type": "integer",
                "default": 5,
                "description": "Maximum path length to analyze",
            },
            "time_window_hours": {
                "type": "float",
                "default": 24,
                "description": "Time window for round-trip detection",
            },
        }


class AIDetectionRule(FraudRule):
    """AI-powered fraud detection using Isolation Forest"""

    def __init__(self):
        super().__init__("ai_detection", AlertSeverity.HIGH)
        self.ai_detector = AIFraudDetector()

    def execute(
        self, transactions: List[Dict[str, Any]], context: Dict[str, Any] = None
    ) -> List[FraudAlert]:
        alerts = []

        # Skip if AI model not trained
        if not self.ai_detector.is_trained:
            logger.warning("AI model not trained, skipping AI detection")
            return alerts

        raw_alerts = detect_ai_fraud(transactions, self.ai_detector)

        for raw_alert in raw_alerts:
            # Determine severity based on fraud score
            if raw_alert.fraud_score >= 80:
                severity = AlertSeverity.CRITICAL
            elif raw_alert.fraud_score >= 60:
                severity = AlertSeverity.HIGH
            elif raw_alert.fraud_score >= 40:
                severity = AlertSeverity.MEDIUM
            else:
                severity = AlertSeverity.LOW

            alert = FraudAlert(
                alert_id=f"AI_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                rule_name=self.name,
                severity=severity,
                confidence=raw_alert.confidence,
                risk_score=raw_alert.fraud_score,
                description=f"AI-detected fraud: {raw_alert.explanation}",
                detected_at=datetime.now(timezone.utc),
                transaction_ids=[raw_alert.transaction_id],
                metadata={
                    "anomaly_score": raw_alert.anomaly_score,
                    "is_fraud": raw_alert.is_fraud,
                    "ai_explanation": raw_alert.explanation,
                },
                recommendations=[
                    "Review AI-generated explanation",
                    "Consider transaction context",
                    "Verify with rule-based detection results",
                ],
            )
            alerts.append(alert)

        return alerts

    def get_config_schema(self) -> Dict[str, Any]:
        return {
            "score_threshold": {
                "type": "float",
                "default": 60.0,
                "description": "Minimum fraud score to generate alert",
            },
            "model_path": {
                "type": "string",
                "default": "models/isolation_forest.pkl",
                "description": "Path to trained AI model",
            },
            "contamination": {
                "type": "float",
                "default": 0.1,
                "description": "Expected proportion of anomalies in training data",
            },
        }
