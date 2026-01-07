# services/fraud/engine.py
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

import asyncio

from core.plugin_system.registry import plugin_registry_service

# Imports for deleted rules removed


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
    case_id: str | None = None
    transaction_ids: list[str] = field(default_factory=list)
    entities: list[str] = field(default_factory=list)  # customer IDs, merchant names, etc.
    metadata: dict[str, Any] = field(default_factory=dict)
    recommendations: list[str] = field(default_factory=list)


class FraudRule(ABC):
    """Abstract base class for fraud detection rules"""

    def __init__(self, name: str, severity: AlertSeverity, enabled: bool = True):
        self.name = name
        self.severity = severity
        self.enabled = enabled
        self.last_run = None

    @abstractmethod
    async def execute(self, transactions: list[dict[str, Any]], context: dict[str, Any] | None = None) -> list[FraudAlert]:
        """Execute the rule and return alerts"""

    @abstractmethod
    def get_config_schema(self) -> dict[str, Any]:
        """Return configuration schema for this rule"""


class PluginAdapterRule(FraudRule):
    """Adapter to make Plugins look like FraudRules"""

    def __init__(self, plugin_instance):
        metadata = plugin_instance.metadata
        super().__init__(metadata.name, AlertSeverity.HIGH)  # Default severity
        self.plugin = plugin_instance
        self.namespace = metadata.namespace

    async def execute(self, transactions: list[dict[str, Any]], context: dict[str, Any] | None = None) -> list[FraudAlert]:
        # Plugins usually take a specific input format
        # We need to bridge the gap. Most of our plugins expect {"transactions": [...]}
        input_data = {"transactions": transactions, "context": context}

        try:
            # Execute plugin (async native)
            result = await self.plugin.execute(input_data)

            alerts = []
            if result and "alerts" in result:
                for plugin_alert in result["alerts"]:
                    # Dynamic Severity Mapping from centralized settings
                    from core.config import settings

                    risk_score = plugin_alert.get("risk_score", 0.0)
                    if risk_score >= settings.FRAUD_SCORE_CRITICAL:
                        severity = AlertSeverity.CRITICAL
                    elif risk_score >= settings.FRAUD_SCORE_HIGH:
                        severity = AlertSeverity.HIGH
                    elif risk_score >= settings.FRAUD_SCORE_MEDIUM:
                        severity = AlertSeverity.MEDIUM
                    else:
                        severity = AlertSeverity.LOW

                    # Convert plugin alert dict to FraudAlert object
                    alert = FraudAlert(
                        alert_id=f"PL_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                        rule_name=self.name,
                        severity=severity,
                        confidence=plugin_alert.get("confidence", 0.8),
                        risk_score=risk_score,
                        description=plugin_alert.get("reason", "Plugin detected fraud"),
                        detected_at=datetime.now(UTC),
                        metadata=plugin_alert.get("details", {}),
                        recommendations=["Review plugin findings"],
                    )
                    alerts.append(alert)
            return alerts

        except Exception as e:
            logger.error(f"Error executing plugin {self.name}: {e}")
            return []

    def get_config_schema(self) -> dict[str, Any]:
        return self.plugin.metadata.config_schema if hasattr(self.plugin.metadata, "config_schema") else {}


class RuleEngine:
    """Main fraud detection rule engine"""

    def __init__(self):
        self.rules: dict[str, FraudRule] = {}
        self.rule_registry: dict[str, type[FraudRule]] = {}
        self.execution_history: list[dict[str, Any]] = []
        self._register_builtin_rules()
        # Plugins loaded via async initialize() call

    def _register_builtin_rules(self):
        """Register built-in fraud detection rules (Legacy)"""
        # We keeping these for backward compatibility / shadow mode if needed,
        # but User asked to delete unused files.
        # We will remove them from here if implementation is now fully plugin-based.
        # But for safety, we might mistakenly successfully run plugins that are NOT yet fully working.
        # However, plan says "Move to plugins".
        # Let's rely on _load_plugin_rules primarily.

    async def initialize(self):
        """Async initialization to load plugin rules"""
        await self._load_plugin_rules()

    async def _load_plugin_rules(self):
        """Load rules from PluginRegistry"""
        # In a synchronous init, we can't await.
        # We might need a start() method or similar.
        # Or just run loop here for init.
        try:
            # Helper to fetch active detection plugins
            from core.database import SessionLocal
            from core.plugin_system.models import PluginRegistry as PluginRegistryModel

            db = SessionLocal()
            plugin_instances = []
            try:
                # Fetch all active plugins
                db_plugins = db.query(PluginRegistryModel).filter(PluginRegistryModel.status == "active").all()

                for p in db_plugins:
                    if "fraud_detection" in p.metadata_json.get("capabilities", []):
                        # Load instance
                        instance = await plugin_registry_service.get_plugin(p.plugin_id, db)
                        plugin_instances.append(instance)
            except Exception as e:
                logger.error(f"Failed to load plugins from DB: {e}")
            finally:
                db.close()

            for p in plugin_instances:
                adapter = PluginAdapterRule(p)
                self.register_rule(adapter)

        except Exception as e:
            logger.error(f"Failed to load plugin rules: {e}")

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

    async def execute_rules(self, transactions: list[dict[str, Any]], context: dict[str, Any] | None = None) -> list[FraudAlert]:
        """Execute all enabled rules and return combined alerts"""
        # Ensure initialized
        if not hasattr(self, "_initialized") or not self._initialized:
            await self.initialize()
            self._initialized = True

        if context is None:
            context = {}

        all_alerts = []
        execution_start = datetime.now(UTC)

        logger.info(f"Executing {len([r for r in self.rules.values() if r.enabled])} rules on {len(transactions)} transactions")

        for rule in self.rules.values():
            if not rule.enabled:
                continue

            try:
                rule_start = datetime.now(UTC)
                if asyncio.iscoroutinefunction(rule.execute):
                    rule_alerts = await rule.execute(transactions, context)
                else:
                    rule_alerts = rule.execute(transactions, context)
                rule_end = datetime.now(UTC)

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

                logger.debug(f"Rule {rule.name} generated {len(rule_alerts)} alerts in {(rule_end - rule_start).total_seconds():.3f}s")

            except Exception as e:
                logger.error(f"Error executing rule {rule.name}: {e!s}")
                # Continue with other rules even if one fails
                continue

        execution_end = datetime.now(UTC)

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

    def get_rule_status(self) -> dict[str, dict[str, Any]]:
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

    def get_execution_stats(self, limit: int = 100) -> list[dict[str, Any]]:
        """Get recent execution statistics"""
        return self.execution_history[-limit:] if self.execution_history else []


# Legacy built-in rules removed. Logic migrated to plugins.


# Global shared instance
rule_engine = RuleEngine()
