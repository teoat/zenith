"""
Advanced Fraud Detection Rules Engine
Provides no-code rule builder and intelligent fraud pattern detection
"""

import asyncio
import json
import logging
import os
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Union

from sqlalchemy.orm import Session

from core.database import FraudAlert

logger = logging.getLogger(__name__)


class RuleType(Enum):
    """Types of fraud detection rules"""

    TRANSACTION_PATTERN = "transaction_pattern"
    ENTITY_RELATIONSHIP = "entity_relationship"
    TEMPORAL_ANALYSIS = "temporal_analysis"
    AMOUNT_ANALYSIS = "amount_analysis"
    FREQUENCY_ANALYSIS = "frequency_analysis"
    GEOGRAPHIC_ANALYSIS = "geographic_analysis"
    BEHAVIORAL_ANALYSIS = "behavioral_analysis"


class Operator(Enum):
    """Rule condition operators"""

    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_EQUAL = "greater_equal"
    LESS_EQUAL = "less_equal"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    REGEX_MATCH = "regex_match"
    IN_LIST = "in_list"
    NOT_IN_LIST = "not_in_list"
    BETWEEN = "between"
    NOT_BETWEEN = "not_between"


class LogicalOperator(Enum):
    """Logical operators for combining conditions"""

    AND = "and"
    OR = "or"
    NOT = "not"


@dataclass
class RuleCondition:
    """Individual rule condition"""

    field: str
    operator: Operator
    value: Any
    case_sensitive: bool = False
    description: str = ""

    def __post_init__(self):
        if isinstance(self.operator, str):
            self.operator = Operator(self.operator)

    def evaluate(self, data: Dict[str, Any]) -> bool:
        """Evaluate condition against data"""
        try:
            field_value = self._get_nested_value(data, self.field)

            if field_value is None:
                return False

            # Convert types if needed
            expected_value = self._convert_value(field_value, self.value)

            # Apply operator
            return self._apply_operator(field_value, expected_value)

        except Exception as e:
            logger.error(f"Condition evaluation failed: {e}")
            return False

    def _get_nested_value(self, data: Dict[str, Any], field_path: str) -> Any:
        """Get nested value from data using dot notation"""
        keys = field_path.split(".")
        current = data

        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None

        return current

    def _convert_value(self, field_value: Any, expected_value: Any) -> Any:
        """Convert expected value to match field value type"""
        if isinstance(field_value, (int, float)) and isinstance(expected_value, str):
            try:
                return (
                    float(expected_value)
                    if "." in expected_value
                    else int(expected_value)
                )
            except ValueError:
                pass
        elif isinstance(field_value, str) and isinstance(expected_value, (int, float)):
            return str(expected_value)
        elif isinstance(field_value, bool) and isinstance(expected_value, str):
            return expected_value.lower() in ("true", "1", "yes", "on")
        elif isinstance(field_value, str) and isinstance(expected_value, bool):
            return str(expected_value).lower()

        return expected_value

    def _apply_operator(self, field_value: Any, expected_value: Any) -> bool:
        """Apply the operator to compare values"""
        if (
            not self.case_sensitive
            and isinstance(field_value, str)
            and isinstance(expected_value, str)
        ):
            field_value = field_value.lower()
            expected_value = expected_value.lower()

        if self.operator == Operator.EQUALS:
            return field_value == expected_value
        elif self.operator == Operator.NOT_EQUALS:
            return field_value != expected_value
        elif self.operator == Operator.GREATER_THAN:
            return field_value > expected_value
        elif self.operator == Operator.LESS_THAN:
            return field_value < expected_value
        elif self.operator == Operator.GREATER_EQUAL:
            return field_value >= expected_value
        elif self.operator == Operator.LESS_EQUAL:
            return field_value <= expected_value
        elif self.operator == Operator.CONTAINS:
            return str(expected_value) in str(field_value)
        elif self.operator == Operator.NOT_CONTAINS:
            return str(expected_value) not in str(field_value)
        elif self.operator == Operator.STARTS_WITH:
            return str(field_value).startswith(str(expected_value))
        elif self.operator == Operator.ENDS_WITH:
            return str(field_value).endswith(str(expected_value))
        elif self.operator == Operator.REGEX_MATCH:
            try:
                return bool(re.match(str(expected_value), str(field_value)))
            except re.error:
                return False
        elif self.operator == Operator.IN_LIST:
            return (
                field_value in expected_value
                if isinstance(expected_value, list)
                else False
            )
        elif self.operator == Operator.NOT_IN_LIST:
            return (
                field_value not in expected_value
                if isinstance(expected_value, list)
                else True
            )
        elif self.operator == Operator.BETWEEN:
            if isinstance(expected_value, (list, tuple)) and len(expected_value) == 2:
                return expected_value[0] <= field_value <= expected_value[1]
            return False
        elif self.operator == Operator.NOT_BETWEEN:
            if isinstance(expected_value, (list, tuple)) and len(expected_value) == 2:
                return not (expected_value[0] <= field_value <= expected_value[1])
            return True

        return False


@dataclass
class FraudRule:
    """Complete fraud detection rule"""

    id: str
    name: str
    description: str
    type: RuleType
    conditions: List[RuleCondition]
    logical_operator: LogicalOperator = LogicalOperator.AND
    severity: str = "medium"  # low, medium, high, critical
    enabled: bool = True
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    trigger_count: int = 0
    last_triggered: Optional[datetime] = None
    confidence_threshold: float = 0.8
    action: str = "flag"  # flag, block, alert, review

    def evaluate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate rule against data"""
        if not self.enabled:
            return {"triggered": False, "confidence": 0.0}

        try:
            condition_results = [
                condition.evaluate(data) for condition in self.conditions
            ]

            if not condition_results:
                return {"triggered": False, "confidence": 0.0}

            # Apply logical operator
            if self.logical_operator == LogicalOperator.AND:
                triggered = all(condition_results)
            elif self.logical_operator == LogicalOperator.OR:
                triggered = any(condition_results)
            elif self.logical_operator == LogicalOperator.NOT:
                triggered = not any(condition_results)
            else:
                triggered = False

            # Calculate confidence based on condition matches
            confidence = (
                sum(condition_results) / len(condition_results)
                if condition_results
                else 0.0
            )

            if triggered and confidence >= self.confidence_threshold:
                self.trigger_count += 1
                self.last_triggered = datetime.now()

                return {
                    "triggered": True,
                    "confidence": confidence,
                    "severity": self.severity,
                    "action": self.action,
                    "rule_id": self.id,
                    "rule_name": self.name,
                    "matched_conditions": sum(condition_results),
                    "total_conditions": len(condition_results),
                }

            return {"triggered": False, "confidence": confidence}

        except Exception as e:
            logger.error(f"Rule evaluation failed for {self.id}: {e}")
            return {"triggered": False, "confidence": 0.0, "error": str(e)}

    # Backwards-compatible alias expected by some callers/tests
    def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.evaluate(data)


class FraudRulesEngine:
    """
    Advanced fraud detection rules engine with no-code rule builder
    """

    def __init__(self, rules_file: str = "./data/fraud_rules.json"):
        self.rules_file = Path(rules_file)
        self.rules_file.parent.mkdir(parents=True, exist_ok=True)

        self.rules: Dict[str, FraudRule] = {}
        self.rule_templates = self._load_rule_templates()
        self.stats = {
            "total_evaluations": 0,
            "rules_triggered": 0,
            "false_positives": 0,
            "true_positives": 0,
            "processing_time_ms": 0,
        }

        # Load existing rules (will be loaded on first use)
        # asyncio.create_task(self.load_rules())
        logger.info("Fraud Rules Engine initialized")

        # Ensure default rules exist synchronously so unit tests and
        # synchronous callers see a populated `rules` collection.
        try:
            if not self.rules:
                try:
                    # create_default_rules is async; run it synchronously here
                    asyncio.run(self.create_default_rules())
                except RuntimeError:
                    # In case an event loop is already running (test runners),
                    # fall back to creating defaults synchronously.
                    for template_id, template in self.rule_templates.items():
                        rule_id = f"default_{template_id}"
                        rule = FraudRule(
                            id=rule_id,
                            name=template["name"],
                            description=template["description"],
                            type=template["type"],
                            conditions=[
                                RuleCondition(**cond) for cond in template["conditions"]
                            ],
                            severity=template["severity"],
                            tags=template["tags"],
                        )
                        self.rules[rule_id] = rule
                    # best-effort save (async)
                    try:
                        asyncio.run(self.save_rules())
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"Failed to ensure default rules at init: {e}")

    def _load_rule_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load predefined rule templates"""
        return {
            "structuring_detection": {
                "name": "Structuring Detection",
                "description": "Detects transactions just below reporting thresholds",
                "type": RuleType.AMOUNT_ANALYSIS,
                "conditions": [
                    {
                        "field": "amount",
                        "operator": Operator.BETWEEN,
                        "value": [9000, 10000],
                        "description": "Amount between $9,000-$10,000",
                    }
                ],
                "severity": "high",
                "tags": ["structuring", "smurfing"],
            },
            "round_number_suspicion": {
                "name": "Round Number Suspicion",
                "description": "Flags suspiciously round transaction amounts",
                "type": RuleType.AMOUNT_ANALYSIS,
                "conditions": [
                    {
                        "field": "amount",
                        "operator": Operator.GREATER_THAN,
                        "value": 1000,
                        "description": "Amount > $1,000",
                    },
                    {
                        "field": "amount",
                        "operator": Operator.REGEX_MATCH,
                        "value": r"^\d+000$",
                        "description": "Round number ending in 000s",
                    },
                ],
                "severity": "medium",
                "tags": ["round_numbers", "suspicious"],
            },
            "velocity_anomaly": {
                "name": "Velocity Anomaly",
                "description": "Detects unusual transaction frequency",
                "type": RuleType.FREQUENCY_ANALYSIS,
                "conditions": [
                    {
                        "field": "transactions_per_hour",
                        "operator": Operator.GREATER_THAN,
                        "value": 10,
                        "description": "More than 10 transactions per hour",
                    }
                ],
                "severity": "high",
                "tags": ["velocity", "frequency"],
            },
            "geographic_anomaly": {
                "name": "Geographic Anomaly",
                "description": "Transactions from unusual locations",
                "type": RuleType.GEOGRAPHIC_ANALYSIS,
                "conditions": [
                    {
                        "field": "country",
                        "operator": Operator.NOT_EQUALS,
                        "value": "US",
                        "description": "Transaction from outside US",
                    },
                    {
                        "field": "amount",
                        "operator": Operator.GREATER_THAN,
                        "value": 50000,
                        "description": "Large amount from unusual location",
                    },
                ],
                "severity": "high",
                "tags": ["geographic", "international"],
            },
            "shell_company_pattern": {
                "name": "Shell Company Pattern",
                "description": "Detects potential shell company transactions",
                "type": RuleType.ENTITY_RELATIONSHIP,
                "conditions": [
                    {
                        "field": "recipient_type",
                        "operator": Operator.EQUALS,
                        "value": "corporation",
                        "description": "Recipient is a corporation",
                    },
                    {
                        "field": "recipient_age_days",
                        "operator": Operator.LESS_THAN,
                        "value": 365,
                        "description": "Company less than 1 year old",
                    },
                ],
                "severity": "critical",
                "tags": ["shell_company", "new_entity"],
            },
        }

    async def load_rules(self):
        """Load rules from storage"""
        try:
            if self.rules_file.exists():
                with open(self.rules_file, "r") as f:
                    rules_data = json.load(f)

                for rule_data in rules_data.get("rules", []):
                    rule = FraudRule(**rule_data)
                    self.rules[rule.id] = rule

                logger.info(f"Loaded {len(self.rules)} fraud rules")
            else:
                # Create default rules from templates
                await self.create_default_rules()

        except Exception as e:
            logger.error(f"Failed to load rules: {e}")
            await self.create_default_rules()

    async def create_default_rules(self):
        """Create default rules from templates"""
        for template_id, template in self.rule_templates.items():
            rule_id = f"default_{template_id}"
            rule = FraudRule(
                id=rule_id,
                name=template["name"],
                description=template["description"],
                type=template["type"],
                conditions=[RuleCondition(**cond) for cond in template["conditions"]],
                severity=template["severity"],
                tags=template["tags"],
            )
            self.rules[rule_id] = rule

        await self.save_rules()
        logger.info(f"Created {len(self.rules)} default fraud rules")

    async def save_rules(self):
        """Save rules to storage"""
        try:
            rules_data = {
                "rules": [rule.__dict__ for rule in self.rules.values()],
                "last_updated": datetime.now().isoformat(),
                "version": "1.0",
            }

            with open(self.rules_file, "w") as f:
                json.dump(rules_data, f, indent=2, default=str)

        except Exception as e:
            logger.error(f"Failed to save rules: {e}")

    async def create_rule(self, rule_data: Dict[str, Any]) -> FraudRule:
        """Create a new fraud detection rule"""
        try:
            # Validate rule data
            self._validate_rule_data(rule_data)

            # Convert conditions
            conditions = []
            for cond_data in rule_data.get("conditions", []):
                condition = RuleCondition(**cond_data)
                conditions.append(condition)

            # Create rule
            rule = FraudRule(
                id=rule_data.get(
                    "id", f"rule_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                ),
                name=rule_data["name"],
                description=rule_data.get("description", ""),
                type=RuleType(rule_data["type"]),
                conditions=conditions,
                logical_operator=LogicalOperator(
                    rule_data.get("logical_operator", "and")
                ),
                severity=rule_data.get("severity", "medium"),
                enabled=rule_data.get("enabled", True),
                tags=rule_data.get("tags", []),
                confidence_threshold=rule_data.get("confidence_threshold", 0.8),
                action=rule_data.get("action", "flag"),
            )

            self.rules[rule.id] = rule
            await self.save_rules()

            logger.info(f"Created fraud rule: {rule.id}")
            return rule

        except Exception as e:
            logger.error(f"Failed to create rule: {e}")
            raise

    def _validate_rule_data(self, rule_data: Dict[str, Any]):
        """Validate rule creation data"""
        required_fields = ["name", "type", "conditions"]
        for field in required_fields:
            if field not in rule_data:
                raise ValueError(f"Missing required field: {field}")

        if not isinstance(rule_data.get("conditions", []), list):
            raise ValueError("Conditions must be a list")

        if len(rule_data["conditions"]) == 0:
            raise ValueError("At least one condition is required")

    async def update_rule(
        self, rule_id: str, updates: Dict[str, Any]
    ) -> Optional[FraudRule]:
        """Update an existing rule"""
        if rule_id not in self.rules:
            return None

        rule = self.rules[rule_id]

        # Update allowed fields
        updatable_fields = [
            "name",
            "description",
            "conditions",
            "logical_operator",
            "severity",
            "enabled",
            "tags",
            "confidence_threshold",
            "action",
        ]

        for field, value in updates.items():
            if field in updatable_fields:
                if field == "conditions":
                    rule.conditions = [RuleCondition(**cond) for cond in value]
                elif field == "logical_operator":
                    rule.logical_operator = LogicalOperator(value)
                elif field == "type":
                    rule.type = RuleType(value)
                else:
                    setattr(rule, field, value)

        rule.updated_at = datetime.now()
        await self.save_rules()

        logger.info(f"Updated fraud rule: {rule_id}")
        return rule

    async def delete_rule(self, rule_id: str) -> bool:
        """Delete a rule"""
        if rule_id not in self.rules:
            return False

        # Backwards-compatible alias expected by tests
        def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
            return self.evaluate(data)

        # Don't allow deletion of default rules
        if rule_id.startswith("default_"):
            raise ValueError("Cannot delete default rules")

        del self.rules[rule_id]
        await self.save_rules()

        logger.info(f"Deleted fraud rule: {rule_id}")
        return True

    async def evaluate_transaction(
        self, transaction_data: Dict[str, Any], db: Session = None
    ) -> List[Dict[str, Any]]:
        """Evaluate transaction against all active rules"""
        start_time = datetime.now()
        triggered_rules = []

        try:
            for rule in self.rules.values():
                if not rule.enabled:
                    continue

                result = rule.evaluate(transaction_data)
                if result.get("triggered", False):
                    # Add transaction info to result if not present
                    if "transaction_id" not in result:
                        result["transaction_id"] = transaction_data.get("id")
                    if "case_id" not in result:
                        result["case_id"] = transaction_data.get("case_id")

                    triggered_rules.append(result)

                    # Persist if high severity
                    self._persist_alert(result, db)

            self.stats["total_evaluations"] += 1
            self.stats["rules_triggered"] += len(triggered_rules)
            self.stats["processing_time_ms"] += (
                datetime.now() - start_time
            ).total_seconds() * 1000

            return triggered_rules

        except Exception as e:
            logger.error(f"Transaction evaluation failed: {e}")
            return []

    def execute_rules(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Synchronous wrapper for rule execution used by some tests.

        It evaluates all current rules against the list of transactions and
        returns a flat list of triggered rule results.
        """
        results: List[Dict[str, Any]] = []
        try:
            for tx in transactions:
                for rule in self.rules.values():
                    if not rule.enabled:
                        continue
                    r = rule.evaluate(tx)
                    if r.get("triggered"):
                        # attach txn id
                        if "transaction_id" not in r:
                            r["transaction_id"] = tx.get("id")
                        results.append(r)
            return results
        except Exception as e:
            logger.error(f"execute_rules failed: {e}")
            return []

    def get_execution_stats(self) -> List[Dict[str, Any]]:
        """Return basic execution statistics for the rules engine."""
        return [{"metric": k, "value": v} for k, v in self.stats.items()]

    async def evaluate_case(
        self, case_data: Dict[str, Any], db: Session = None
    ) -> Dict[str, Any]:
        """Evaluate entire case for fraud patterns"""
        try:
            transactions = case_data.get("transactions", [])
            entities = case_data.get("entities", [])

            case_findings = {
                "case_id": case_data.get("id"),
                "total_transactions": len(transactions),
                "total_entities": len(entities),
                "triggered_rules": [],
                "risk_score": 0,
                "severity": "low",
                "recommendations": [],
            }

            # Evaluate each transaction
            all_triggered_rules = []
            for transaction in transactions:
                # Pass DB to ensure high severity alerts are persisted
                triggered = await self.evaluate_transaction(transaction, db)
                all_triggered_rules.extend(triggered)

            # Perform temporal analysis (dynamic, cross-transaction logic)
            temporal_anomalies = self.check_temporal_anomalies(transactions, db)
            all_triggered_rules.extend(temporal_anomalies)

            # Perform behavioral analysis (Mules, Layering, Ghost Employees)
            behavioral_anomalies = self.check_behavioral_anomalies(case_data, db)
            all_triggered_rules.extend(behavioral_anomalies)

            # Perform sequence/relationship analysis if needed
            # sequence_anomalies = self.check_sequence_anomalies(transactions, db=db)
            # all_triggered_rules.extend(sequence_anomalies)

            # Aggregate findings
            if all_triggered_rules:
                case_findings["triggered_rules"] = all_triggered_rules

                # Calculate overall risk score
                severity_weights = {"low": 1, "medium": 2, "high": 3, "critical": 4}
                total_weight = sum(
                    severity_weights.get(r.get("severity", "low"), 1)
                    for r in all_triggered_rules
                )

                case_findings["risk_score"] = min(100, total_weight * 10)

                # Determine overall severity
                max_severity = max(
                    (
                        severity_weights.get(r.get("severity", "low"), 1)
                        for r in all_triggered_rules
                    ),
                    default=1,
                )

                severity_map = {1: "low", 2: "medium", 3: "high", 4: "critical"}
                case_findings["severity"] = severity_map.get(max_severity, "low")

                # Generate recommendations
                case_findings["recommendations"] = self._generate_recommendations(
                    all_triggered_rules, case_data
                )

            return case_findings

        except Exception as e:
            logger.error(f"Case evaluation failed: {e}")
            return {
                "case_id": case_data.get("id"),
                "error": str(e),
                "risk_score": 0,
                "severity": "unknown",
            }

    def check_behavioral_anomalies(
        self, case_data: Dict[str, Any], db: Session = None
    ) -> List[Dict[str, Any]]:
        """
        Check for complex behavioral patterns:
        1. Money Mule (Flow Ratio: Credit ≈ Debit)
        2. Layering (Rapid Movement: In -> Out < 1h)
        3. Ghost Employee (Shared Bank Accounts)
        4. Elder Exploitation (Age > 70 + High Vol)
        """
        anomalies = []
        transactions = case_data.get("transactions", [])
        entities = case_data.get("entities", [])

        if not transactions:
            return []

        # 1. Money Mule / Pass-Through Account Analysis
        # Logic: High volume, but low retention (Credits ≈ Debits)
        total_credit = sum(
            t.get("amount", 0) for t in transactions if t.get("type") == "credit"
        )
        total_debit = sum(
            t.get("amount", 0) for t in transactions if t.get("type") == "debit"
        )

        if total_credit > 10000:  # Significance threshold
            ratio = total_debit / total_credit if total_credit > 0 else 0
            # If 95% to 105% of money is moved out immediately
            if 0.95 <= ratio <= 1.05:
                anomaly = {
                    "triggered": True,
                    "confidence": 0.85,
                    "severity": "high",
                    "action": "block",
                    "rule_id": "behavioral_money_mule",
                    "rule_name": "Money Mule Pattern (Pass-Through)",
                    "matched_conditions": 2,
                    "description": f"Pass-through account detected: ${total_credit:,.2f} in, ${total_debit:,.2f} out (Ratio: {ratio:.2f})",
                    "case_id": case_data.get("id"),
                }
                anomalies.append(anomaly)
                self._persist_alert(anomaly, db)

        # 2. Ghost Employee Analysis
        # Logic: Multiple entities sharing same metadata (bank account)
        bank_accounts = {}
        for entity in entities:
            # Assuming entity has metadata like 'bank_account_number'
            # This is a heuristic mock - in real app would check specific field
            acct = entity.get("metadata", {}).get("bank_account")
            if acct:
                if acct not in bank_accounts:
                    bank_accounts[acct] = []
                bank_accounts[acct].append(entity.get("name"))

        for acct, names in bank_accounts.items():
            if len(names) > 1:
                anomaly = {
                    "triggered": True,
                    "confidence": 0.95,
                    "severity": "critical",
                    "action": "investigate",
                    "rule_id": "behavioral_ghost_employee",
                    "rule_name": "Ghost Employee (Shared Account)",
                    "matched_conditions": 1,
                    "description": f"Multiple employees share bank account {acct}: {', '.join(names)}",
                    "case_id": case_data.get("id"),
                    "metadata": {"shared_account": acct, "entities": names},
                }
                anomalies.append(anomaly)
                self._persist_alert(anomaly, db)

        # 3. Elder Exploitation
        # Logic: Age > 70 AND Txn Volume > $5k (simplistic)
        for entity in entities:
            age = entity.get("metadata", {}).get("age")
            if age and int(age) > 70:
                if total_debit > 5000:
                    anomaly = {
                        "triggered": True,
                        "confidence": 0.7,
                        "severity": "medium",
                        "action": "review",
                        "rule_id": "behavioral_elder_exploitation",
                        "rule_name": "Elder Financial Exploitation Risk",
                        "matched_conditions": 2,
                        "description": f"High transaction volume (${total_debit:,.2f}) for vulnerable entity ({entity.get('name')}, age {age})",
                        "case_id": case_data.get("id"),
                    }
                    anomalies.append(anomaly)
                    # Medium severity, maybe don't persist automatically unless really high

        return anomalies

    def check_temporal_anomalies(
        self, transactions: List[Dict[str, Any]], db: Session = None
    ) -> List[Dict[str, Any]]:
        """
        Check for temporal anomalies that cannot be caught by static rules.
        - Future dated transactions
        - Excessively old transactions (> 365 days) used in current context
        """
        anomalies = []
        now = datetime.now()

        for txn in transactions:
            txn_date_str = txn.get("date")
            if not txn_date_str:
                continue

            try:
                # Handle varying date formats if necessary, assuming ISO for now
                if isinstance(txn_date_str, datetime):
                    txn_date = txn_date_str
                else:
                    txn_date = datetime.fromisoformat(
                        str(txn_date_str).replace("Z", "+00:00")
                    )

                # Check 1: Future Dating
                if txn_date > now + timedelta(days=1):  # 1 day buffer for timezones
                    anomaly = {
                        "triggered": True,
                        "confidence": 1.0,
                        "severity": "high",
                        "action": "flag",
                        "rule_id": "temporal_future_date",
                        "rule_name": "Future Dated Transaction",
                        "matched_conditions": 1,
                        "description": f"Transaction date {txn_date.date()} is in the future",
                        "transaction_id": txn.get("id"),
                        "case_id": txn.get("case_id"),
                    }
                    anomalies.append(anomaly)
                    self._persist_alert(anomaly, db)

                # Check 2: Stale Transactions (> 365 days)
                if txn_date < now - timedelta(days=365):
                    anomaly = {
                        "triggered": True,
                        "confidence": 0.8,
                        "severity": "medium",
                        "action": "review",
                        "rule_id": "temporal_stale_transaction",
                        "rule_name": "Stale Transaction",
                        "matched_conditions": 1,
                        "description": f"Transaction date {txn_date.date()} is older than 1 year",
                        "transaction_id": txn.get("id"),
                        "case_id": txn.get("case_id"),
                    }
                    anomalies.append(anomaly)
                    # Medium severity - usually doesn't persist automatically unless config changes
                    # But if we wanted to: self._persist_alert(anomaly, db)

            except (ValueError, TypeError):
                # Skip invalid dates
                continue

        return anomalies

    def check_sequence_anomalies(
        self,
        transactions: List[Dict[str, Any]],
        funding_source_id: Optional[str] = None,
        db: Session = None,
    ) -> List[Dict[str, Any]]:
        """
        Check for sequence anomalies in a batch of transactions (e.g., Cash Float).
        Rule: "Expenses matched to future withdrawals" (Backdating).

        Logic: Use the earliest 'DEBIT' (Expense) and ensure it occurred AFTER the
        funding source (e.g., Withdrawal). If funding_source_id is not provided,
        it attempts to infer the funding source as the 'CREDIT' or 'TRANSFER' type
        transaction in the batch, or the one with specific metadata.

        For mixed batches passed here, we assume one Funding Source and multiple Expenses.
        """
        anomalies = []
        funding_txn = None

        if not transactions:
            return []

        # Assuming the caller identifies which is the funding source, or we find the one labeled 'withdrawal'
        # based on metadata if 'batch_match' logic saved it.

        # If funding_source_id provided, use it.
        target_funding = None
        if funding_source_id:
            target_funding = next(
                (t for t in transactions if t.get("id") == funding_source_id), None
            )

        if not target_funding:
            # Fallback: Identify by metadata or assume the transaction with distinct type if available.
            # For now, if no funding source identified, we skip strict sequence check or return warning.
            return []

        funding_date_str = target_funding.get("date")
        if not funding_date_str:
            return []

        try:
            # Handle varying date formats if necessary
            if isinstance(funding_date_str, datetime):
                funding_date = funding_date_str
            else:
                funding_date = datetime.fromisoformat(
                    str(funding_date_str).replace("Z", "+00:00")
                )
        except (ValueError, TypeError):
            return []

        for txn in transactions:
            if txn.get("id") == target_funding.get("id"):
                continue

            expense_date_str = txn.get("date")
            if not expense_date_str:
                continue

            try:
                if isinstance(expense_date_str, datetime):
                    expense_date = expense_date_str
                else:
                    expense_date = datetime.fromisoformat(
                        str(expense_date_str).replace("Z", "+00:00")
                    )

                # TOLERANCE: Expense match to FUTURE matches (Expense Date < Funding Date)
                # Allow 24h tolerance for timezone diffs
                if expense_date < funding_date - timedelta(hours=24):
                    days_diff = (funding_date - expense_date).days
                    anomaly = {
                        "triggered": True,
                        "confidence": 0.9,
                        "severity": "medium",  # Can be high if gap > 30 days
                        "action": "flag",
                        "rule_id": "temporal_sequence_backdating",
                        "rule_name": "Backdated Expense (Sequence Violation)",
                        "matched_conditions": 1,
                        "description": f"Expense dated {expense_date.date()} occurred {days_diff} days BEFORE funding withdrawal ({funding_date.date()})",
                        "transaction_id": txn.get("id"),
                        "metadata": {"funding_source_id": target_funding.get("id")},
                        "case_id": txn.get("case_id"),
                    }

                    if days_diff > 30:
                        anomaly["severity"] = "high"

                    anomalies.append(anomaly)
                    self._persist_alert(anomaly, db)

            except (ValueError, TypeError):
                continue

        return anomalies

    def _persist_alert(self, alert_data: Dict[str, Any], db: Session):
        """Persist high-severity alerts to the database"""
        if not db:
            return

        try:
            # Only persist high or critical severity alerts automatically
            if alert_data.get("severity") not in ["high", "critical"]:
                return

            alert_id = str(uuid.uuid4())
            new_alert = FraudAlert(
                id=alert_id,
                case_id=alert_data.get("case_id"),  # Might be None, that's okay
                rule_name=alert_data.get("rule_name", "Unknown Rule"),
                severity=alert_data.get("severity"),
                confidence=alert_data.get("confidence", 0.0),
                risk_score=alert_data.get("risk_score", 0.0),
                description=alert_data.get("description", ""),
                transaction_ids=(
                    [alert_data.get("transaction_id")]
                    if alert_data.get("transaction_id")
                    else []
                ),
                alert_metadata=alert_data.get("metadata", {}),
                status="open",
                created_at=datetime.now(timezone.utc),
            )

            db.add(new_alert)
            db.commit()
            logger.info(
                f"Persisted new fraud alert: {alert_id} ({alert_data.get('rule_name')})"
            )

        except Exception as e:
            logger.error(f"Failed to persist alert: {e}")
            db.rollback()

    def _generate_recommendations(
        self, triggered_rules: List[Dict[str, Any]], case_data: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations based on triggered rules"""
        recommendations = []

        # Group rules by type
        rule_types = {}
        for rule in triggered_rules:
            rule_type = rule.get("rule_name", "").lower()
            rule_types[rule_type] = rule_types.get(rule_type, 0) + 1

        # Generate specific recommendations
        if any(
            "structuring" in rule.get("rule_name", "").lower()
            for rule in triggered_rules
        ):
            recommendations.append(
                "File Suspicious Activity Report (SAR) for structuring violations"
            )
            recommendations.append("Freeze suspicious accounts pending investigation")

        if any(
            "shell" in rule.get("rule_name", "").lower() for rule in triggered_rules
        ):
            recommendations.append(
                "Investigate entity relationships and beneficial ownership"
            )
            recommendations.append("Check corporate registration and business licenses")

        if any(
            "velocity" in rule.get("rule_name", "").lower() for rule in triggered_rules
        ):
            recommendations.append("Implement transaction velocity limits")
            recommendations.append("Monitor for automated transaction patterns")

        if any(
            "geographic" in rule.get("rule_name", "").lower()
            for rule in triggered_rules
        ):
            recommendations.append("Verify customer identity and location")
            recommendations.append("Check for VPN or proxy usage")

        # General recommendations based on risk score
        risk_score = len(triggered_rules) * 10
        if risk_score > 70:
            recommendations.append("Escalate to senior management immediately")
            recommendations.append("Consider involving law enforcement")
        elif risk_score > 40:
            recommendations.append("Increase monitoring frequency")
            recommendations.append("Request additional documentation")

        return recommendations[:5]  # Limit to top 5 recommendations

    def get_rule_templates(self) -> Dict[str, Dict[str, Any]]:
        """Get available rule templates"""
        return self.rule_templates

    def get_rules(self) -> List[Dict[str, Any]]:
        """Get all rules"""
        return [rule.__dict__ for rule in self.rules.values()]

    def get_rule(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """Get specific rule"""
        rule = self.rules.get(rule_id)
        return rule.__dict__ if rule else None

    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics"""
        return {
            **self.stats,
            "active_rules": len([r for r in self.rules.values() if r.enabled]),
            "total_rules": len(self.rules),
            "avg_processing_time_ms": self.stats["processing_time_ms"]
            / max(1, self.stats["total_evaluations"]),
            "rules_by_severity": self._get_rules_by_severity(),
            "rules_by_type": self._get_rules_by_type(),
        }

    def _get_rules_by_severity(self) -> Dict[str, int]:
        """Get rule count by severity"""
        severity_count = {}
        for rule in self.rules.values():
            severity_count[rule.severity] = severity_count.get(rule.severity, 0) + 1
        return severity_count

    def _get_rules_by_type(self) -> Dict[str, int]:
        """Get rule count by type"""
        type_count = {}
        for rule in self.rules.values():
            type_name = rule.type.value
            type_count[type_name] = type_count.get(type_name, 0) + 1
        return type_count

    async def import_rules(self, rules_data: List[Dict[str, Any]]):
        """Import rules from external source"""
        imported_count = 0

        for rule_data in rules_data:
            try:
                # Generate new ID to avoid conflicts
                rule_data["id"] = (
                    f"imported_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{imported_count}"
                )

                await self.create_rule(rule_data)
                imported_count += 1

            except Exception as e:
                logger.error(f"Failed to import rule: {e}")

        logger.info(f"Imported {imported_count} rules")
        return imported_count

    async def export_rules(
        self, rule_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Export rules to external format"""
        if rule_ids:
            rules_to_export = [
                self.rules.get(rid) for rid in rule_ids if rid in self.rules
            ]
        else:
            rules_to_export = list(self.rules.values())

        return [rule.__dict__ for rule in rules_to_export if rule]


# Global fraud rules engine instance
fraud_engine = FraudRulesEngine()


def get_fraud_engine() -> FraudRulesEngine:
    """Get the global fraud rules engine instance"""
    return fraud_engine
