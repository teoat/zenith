"""
Automated Case Resolution Engine
AI-powered automated case resolution for clear-cut fraud scenarios with
rule-based automation and ML-assisted decision making.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ResolutionConfidence(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CERTAIN = "certain"


class ResolutionAction(Enum):
    APPROVE = "approve"
    DENY = "deny"
    ESCALATE = "escalate"
    INVESTIGATE = "investigate"
    MONITOR = "monitor"


class CaseComplexity(Enum):
    SIMPLE = "simple"  # Clear-cut cases that can be auto-resolved
    MODERATE = "moderate"  # Requires some investigation but can be automated
    COMPLEX = "complex"  # Requires human investigation
    CRITICAL = "critical"  # High-value or high-risk cases requiring senior review


@dataclass
class ResolutionRule:
    """Rule for automated case resolution"""

    rule_id: str
    name: str
    description: str
    conditions: list[dict[str, Any]]  # List of condition dictionaries
    action: ResolutionAction
    confidence_threshold: float = 0.8
    complexity_limit: CaseComplexity = CaseComplexity.SIMPLE
    priority: int = 1
    enabled: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    success_rate: float = 0.0
    execution_count: int = 0


@dataclass
class ResolutionAttempt:
    """Record of an automated resolution attempt"""

    attempt_id: str
    case_id: str
    rule_id: str
    action_taken: ResolutionAction
    confidence_score: float
    reasoning: list[str]
    automated: bool = True
    approved: bool = False
    executed_at: datetime = field(default_factory=datetime.now)
    execution_duration_ms: int | None = None
    success: bool = False
    error_message: str | None = None


@dataclass
class CaseResolutionContext:
    """Context information for case resolution"""

    case_id: str
    case_data: dict[str, Any]
    transactions: list[dict[str, Any]]
    entities: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    risk_score: float
    case_type: str
    amount_involved: float
    time_since_creation: timedelta
    investigation_history: list[dict[str, Any]]


class AutomatedCaseResolutionEngine:
    """AI-powered automated case resolution system"""

    def __init__(self):
        self.resolution_rules: dict[str, ResolutionRule] = {}
        self.resolution_history: list[ResolutionAttempt] = []
        self.ml_model = None  # Would load pre-trained ML model for complex decisions

        # Initialize default resolution rules
        self._initialize_default_rules()

    def _initialize_default_rules(self):
        """Initialize default automated resolution rules"""
        default_rules = [
            ResolutionRule(
                rule_id="low_amount_clear_fraud",
                name="Low Amount Clear Fraud",
                description="Automatically deny cases with clear fraud indicators and low amounts",
                conditions=[
                    {"field": "risk_score", "operator": ">", "value": 0.8},
                    {"field": "amount_involved", "operator": "<", "value": 1000},
                    {
                        "field": "fraud_indicators",
                        "operator": "contains",
                        "value": ["stolen_card", "unusual_location"],
                    },
                    {
                        "field": "time_since_creation",
                        "operator": "<",
                        "value": timedelta(hours=24),
                    },
                ],
                action=ResolutionAction.DENY,
                confidence_threshold=0.9,
                complexity_limit=CaseComplexity.SIMPLE,
                priority=1,
            ),
            ResolutionRule(
                rule_id="high_amount_escallation",
                name="High Amount Automatic Escalation",
                description="Automatically escalate high-value cases for senior review",
                conditions=[
                    {"field": "amount_involved", "operator": ">", "value": 50000},
                    {"field": "risk_score", "operator": ">", "value": 0.6},
                ],
                action=ResolutionAction.ESCALATE,
                confidence_threshold=0.95,
                complexity_limit=CaseComplexity.CRITICAL,
                priority=10,
            ),
            ResolutionRule(
                rule_id="legitimate_transaction_approval",
                name="Legitimate Transaction Auto-Approval",
                description="Automatically approve cases with strong legitimacy indicators",
                conditions=[
                    {"field": "risk_score", "operator": "<", "value": 0.3},
                    {"field": "customer_history_score", "operator": ">", "value": 0.8},
                    {
                        "field": "transaction_pattern_match",
                        "operator": ">",
                        "value": 0.9,
                    },
                    {"field": "amount_involved", "operator": "<", "value": 10000},
                ],
                action=ResolutionAction.APPROVE,
                confidence_threshold=0.85,
                complexity_limit=CaseComplexity.SIMPLE,
                priority=2,
            ),
            ResolutionRule(
                rule_id="suspicious_pattern_investigation",
                name="Suspicious Pattern Investigation",
                description="Flag cases with suspicious patterns for investigation",
                conditions=[
                    {
                        "field": "suspicious_patterns",
                        "operator": "contains_any",
                        "value": ["structuring", "mule_account", "round_trip"],
                    },
                    {"field": "entity_connections", "operator": ">", "value": 3},
                ],
                action=ResolutionAction.INVESTIGATE,
                confidence_threshold=0.75,
                complexity_limit=CaseComplexity.MODERATE,
                priority=5,
            ),
            ResolutionRule(
                rule_id="velocity_anomaly_monitoring",
                name="Velocity Anomaly Monitoring",
                description="Monitor cases with unusual transaction velocity",
                conditions=[
                    {"field": "transaction_velocity", "operator": ">", "value": 10},
                    {"field": "time_window_hours", "operator": "<", "value": 24},
                    {"field": "risk_score", "operator": ">", "value": 0.4},
                ],
                action=ResolutionAction.MONITOR,
                confidence_threshold=0.7,
                complexity_limit=CaseComplexity.MODERATE,
                priority=3,
            ),
        ]

        for rule in default_rules:
            self.resolution_rules[rule.rule_id] = rule

    async def evaluate_case_for_resolution(self, case_context: CaseResolutionContext) -> ResolutionAttempt | None:
        """
        Evaluate a case for automated resolution

        Args:
            case_context: Complete case context information

        Returns:
            Resolution attempt if automation is possible, None otherwise
        """
        # Assess case complexity
        complexity = self._assess_case_complexity(case_context)

        # Only attempt automation for simple and moderate cases
        if complexity in [CaseComplexity.COMPLEX, CaseComplexity.CRITICAL]:
            logger.info(f"Case {case_context.case_id} too complex for automation (complexity: {complexity.value})")
            return None

        # Find applicable rules
        applicable_rules = await self._find_applicable_rules(case_context)

        if not applicable_rules:
            logger.info(f"No applicable automation rules for case {case_context.case_id}")
            return None

        # Select best rule
        best_rule = self._select_best_rule(applicable_rules, case_context)

        if not best_rule:
            return None

        # Evaluate rule conditions
        condition_results = await self._evaluate_rule_conditions(best_rule, case_context)

        if not condition_results["all_met"]:
            logger.info(f"Rule conditions not met for case {case_context.case_id}, rule: {best_rule.rule_id}")
            return None

        # Calculate confidence score
        confidence_score = self._calculate_resolution_confidence(best_rule, condition_results, case_context)

        if confidence_score < best_rule.confidence_threshold:
            logger.info(f"Confidence too low for automated resolution: {confidence_score:.2f} < {best_rule.confidence_threshold}")
            return None

        # Create resolution attempt
        attempt_id = f"resolution_{case_context.case_id}_{int(datetime.now().timestamp())}"

        resolution_attempt = ResolutionAttempt(
            attempt_id=attempt_id,
            case_id=case_context.case_id,
            rule_id=best_rule.rule_id,
            action_taken=best_rule.action,
            confidence_score=confidence_score,
            reasoning=self._generate_resolution_reasoning(best_rule, condition_results, case_context),
            automated=True,
        )

        # Store in history
        self.resolution_history.append(resolution_attempt)

        # Update rule statistics
        best_rule.execution_count += 1

        return resolution_attempt

    async def execute_resolution(self, resolution_attempt: ResolutionAttempt) -> bool:
        """
        Execute an approved resolution attempt

        Args:
            resolution_attempt: The resolution attempt to execute

        Returns:
            Success status
        """
        start_time = datetime.now()

        try:
            # Mark as approved
            resolution_attempt.approved = True

            # Execute the resolution action
            success = await self._execute_resolution_action(resolution_attempt)

            # Record execution details
            resolution_attempt.success = success
            resolution_attempt.execution_duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            # Update rule success rate
            rule = self.resolution_rules.get(resolution_attempt.rule_id)
            if rule:
                total_attempts = rule.execution_count
                if total_attempts > 0:
                    # Simplified success rate calculation
                    rule.success_rate = (rule.success_rate * (total_attempts - 1) + (1 if success else 0)) / total_attempts

            logger.info(f"Resolution executed: {resolution_attempt.attempt_id}, success: {success}")
            return success

        except Exception as e:
            resolution_attempt.success = False
            resolution_attempt.error_message = str(e)
            resolution_attempt.execution_duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            logger.error(f"Resolution execution failed: {resolution_attempt.attempt_id} - {e}")
            return False

    def _assess_case_complexity(self, case_context: CaseResolutionContext) -> CaseComplexity:
        """Assess the complexity of a case for automation potential"""
        # High amount cases are more complex
        if case_context.amount_involved > 100000:
            return CaseComplexity.CRITICAL
        elif case_context.amount_involved > 25000:
            return CaseComplexity.COMPLEX

        # High risk cases are more complex
        if case_context.risk_score > 0.8:
            if case_context.amount_involved > 5000:
                return CaseComplexity.COMPLEX
            else:
                return CaseComplexity.MODERATE

        # Cases with many transactions are more complex
        if len(case_context.transactions) > 20:
            return CaseComplexity.MODERATE

        # Cases with multiple entities are more complex
        if len(case_context.entities) > 3:
            return CaseComplexity.MODERATE

        # Cases that have been open for a while are more complex
        if case_context.time_since_creation > timedelta(days=7):
            return CaseComplexity.MODERATE

        return CaseComplexity.SIMPLE

    async def _find_applicable_rules(self, case_context: CaseResolutionContext) -> list[ResolutionRule]:
        """Find rules that could apply to this case"""
        applicable_rules = []

        for rule in self.resolution_rules.values():
            if not rule.enabled:
                continue

            # Check if case complexity is within rule limits
            if self._assess_case_complexity(case_context).value > rule.complexity_limit.value:
                continue

            # Quick check if rule conditions could potentially match
            if await self._rule_could_apply(rule, case_context):
                applicable_rules.append(rule)

        return applicable_rules

    async def _rule_could_apply(self, rule: ResolutionRule, case_context: CaseResolutionContext) -> bool:
        """Quick check if a rule could potentially apply to the case"""
        # This is a simplified check - in practice, would do more detailed analysis
        for condition in rule.conditions:
            field = condition.get("field")
            if field in case_context.case_data or hasattr(case_context, field):
                return True

        return False

    def _select_best_rule(
        self,
        applicable_rules: list[ResolutionRule],
        case_context: CaseResolutionContext,
    ) -> ResolutionRule | None:
        """Select the best rule from applicable rules"""
        if not applicable_rules:
            return None

        # Sort by priority (higher priority first), then by success rate
        sorted_rules = sorted(applicable_rules, key=lambda r: (r.priority, r.success_rate), reverse=True)

        return sorted_rules[0]

    async def _evaluate_rule_conditions(self, rule: ResolutionRule, case_context: CaseResolutionContext) -> dict[str, Any]:
        """Evaluate all conditions for a rule"""
        results = {
            "all_met": True,
            "met_conditions": [],
            "failed_conditions": [],
            "condition_details": [],
        }

        for condition in rule.conditions:
            condition_met, details = await self._evaluate_condition(condition, case_context)

            results["condition_details"].append({"condition": condition, "met": condition_met, "details": details})

            if condition_met:
                results["met_conditions"].append(condition)
            else:
                results["failed_conditions"].append(condition)
                results["all_met"] = False

        return results

    async def _evaluate_condition(self, condition: dict[str, Any], case_context: CaseResolutionContext) -> tuple[bool, str]:
        """Evaluate a single condition"""
        field = condition.get("field")
        operator = condition.get("operator")
        expected_value = condition.get("value")

        # Get actual value from case context
        actual_value = self._get_field_value(case_context, field)

        # Evaluate based on operator
        if operator == ">":
            result = actual_value > expected_value
        elif operator == "<":
            result = actual_value < expected_value
        elif operator == ">=":
            result = actual_value >= expected_value
        elif operator == "<=":
            result = actual_value <= expected_value
        elif operator == "==":
            result = actual_value == expected_value
        elif operator == "!=":
            result = actual_value != expected_value
        elif operator == "contains":
            result = expected_value in actual_value if isinstance(actual_value, (list, str)) else False
        elif operator == "contains_any":
            result = any(item in actual_value for item in expected_value) if isinstance(actual_value, (list, str)) else False
        else:
            result = False

        details = f"Field '{field}': {actual_value} {operator} {expected_value} = {result}"
        return result, details

    def _get_field_value(self, case_context: CaseResolutionContext, field: str) -> Any:
        """Get field value from case context"""
        # Direct case data fields
        if hasattr(case_context, field):
            return getattr(case_context, field)

        if field in case_context.case_data:
            return case_context.case_data[field]

        # Special computed fields
        if field == "fraud_indicators":
            return self._extract_fraud_indicators(case_context)
        elif field == "customer_history_score":
            return self._calculate_customer_history_score(case_context)
        elif field == "transaction_pattern_match":
            return self._calculate_pattern_match_score(case_context)
        elif field == "suspicious_patterns":
            return self._detect_suspicious_patterns(case_context)
        elif field == "entity_connections":
            return len(case_context.entities)
        elif field == "transaction_velocity":
            return self._calculate_transaction_velocity(case_context)

        # Default fallback
        return None

    def _extract_fraud_indicators(self, case_context: CaseResolutionContext) -> list[str]:
        """Extract fraud indicators from case data"""
        indicators = []

        for tx in case_context.transactions:
            if tx.get("location_anomaly"):
                indicators.append("unusual_location")
            if tx.get("amount_anomaly"):
                indicators.append("unusual_amount")
            if tx.get("time_anomaly"):
                indicators.append("unusual_timing")

        return list(set(indicators))

    def _calculate_customer_history_score(self, case_context: CaseResolutionContext) -> float:
        """Calculate customer history score (simplified)"""
        # In practice, this would query customer history database
        return 0.7  # Mock score

    def _calculate_pattern_match_score(self, case_context: CaseResolutionContext) -> float:
        """Calculate how well transactions match customer's normal patterns"""
        # Simplified pattern matching
        return 0.8  # Mock score

    def _detect_suspicious_patterns(self, case_context: CaseResolutionContext) -> list[str]:
        """Detect suspicious patterns in case data"""
        patterns = []

        # Check for structuring (multiple similar small amounts)
        amounts = [tx.get("amount", 0) for tx in case_context.transactions]
        if len(amounts) > 3:
            avg_amount = sum(amounts) / len(amounts)
            similar_amounts = sum(1 for amt in amounts if abs(amt - avg_amount) / avg_amount < 0.1)
            if similar_amounts / len(amounts) > 0.6:
                patterns.append("structuring")

        # Check for round-trip patterns
        if self._has_round_trip_pattern(case_context.transactions):
            patterns.append("round_trip")

        return patterns

    def _has_round_trip_pattern(self, transactions: list[dict[str, Any]]) -> bool:
        """Check for round-trip transaction patterns"""
        # Simplified check for A->B->A patterns
        entities = set()
        for tx in transactions:
            entities.add(tx.get("from_entity"))
            entities.add(tx.get("to_entity"))

        return len(entities) == 2 and len(transactions) >= 3

    def _calculate_transaction_velocity(self, case_context: CaseResolutionContext) -> int:
        """Calculate transaction velocity (transactions per hour)"""
        if not case_context.transactions:
            return 0

        # Find time span of transactions
        timestamps = []
        for tx in case_context.transactions:
            # Simplified timestamp extraction
            if "timestamp" in tx:
                timestamps.append(tx["timestamp"])

        if len(timestamps) < 2:
            return len(case_context.transactions)  # Fallback

        # Calculate hours between first and last transaction
        # In practice, would parse actual timestamps
        hours_span = max(1, len(timestamps) // 2)  # Simplified

        return len(case_context.transactions) // hours_span

    def _calculate_resolution_confidence(
        self,
        rule: ResolutionRule,
        condition_results: dict[str, Any],
        case_context: CaseResolutionContext,
    ) -> float:
        """Calculate confidence score for the resolution"""
        base_confidence = 0.5

        # Boost confidence based on met conditions
        met_conditions = len(condition_results["met_conditions"])
        total_conditions = len(rule.conditions)

        if total_conditions > 0:
            condition_confidence = met_conditions / total_conditions
            base_confidence += condition_confidence * 0.4

        # Boost confidence based on rule success rate
        base_confidence += rule.success_rate * 0.1

        # Reduce confidence for high-value cases
        if case_context.amount_involved > 10000:
            base_confidence *= 0.9

        return min(1.0, base_confidence)

    def _generate_resolution_reasoning(
        self,
        rule: ResolutionRule,
        condition_results: dict[str, Any],
        case_context: CaseResolutionContext,
    ) -> list[str]:
        """Generate human-readable reasoning for the resolution"""
        reasoning = [
            f"Applied rule: {rule.name}",
            f"Action: {rule.action.value.title()}",
            f"Confidence: {rule.confidence_threshold:.1%} threshold met",
        ]

        # Add condition details
        met_count = len(condition_results["met_conditions"])
        total_count = len(rule.conditions)
        reasoning.append(f"Conditions met: {met_count}/{total_count}")

        # Add case-specific insights
        if case_context.risk_score > 0.7:
            reasoning.append("High-risk case requiring immediate action")
        elif case_context.risk_score < 0.3:
            reasoning.append("Low-risk case with strong legitimacy indicators")

        return reasoning

    async def _execute_resolution_action(self, resolution_attempt: ResolutionAttempt) -> bool:
        """Execute the resolution action"""
        # This would integrate with the actual case management system
        # For now, simulate successful execution

        action = resolution_attempt.action_taken

        if action == ResolutionAction.APPROVE:
            # Mark case as approved and closed
            logger.info(f"Auto-approving case {resolution_attempt.case_id}")
        elif action == ResolutionAction.DENY:
            # Mark case as denied and blocked
            logger.info(f"Auto-denying case {resolution_attempt.case_id}")
        elif action == ResolutionAction.ESCALATE:
            # Escalate to senior investigator
            logger.info(f"Auto-escalating case {resolution_attempt.case_id}")
        elif action == ResolutionAction.INVESTIGATE:
            # Flag for investigation
            logger.info(f"Flagging case {resolution_attempt.case_id} for investigation")
        elif action == ResolutionAction.MONITOR:
            # Set up monitoring
            logger.info(f"Setting up monitoring for case {resolution_attempt.case_id}")

        # Simulating resolution processing
        logger.info(f"Processing resolution action {action} for attempt {resolution_attempt.attempt_id}")
        # For now, perform immediate resolution - real implementation would process the resolution

        return True

    def get_resolution_statistics(self) -> dict[str, Any]:
        """Get statistics about automated resolutions"""
        total_attempts = len(self.resolution_history)
        successful_attempts = len([a for a in self.resolution_history if a.success])

        success_rate = (successful_attempts / total_attempts * 100) if total_attempts > 0 else 0

        # Calculate automation rate by action type
        action_counts = {}
        for attempt in self.resolution_history:
            action = attempt.action_taken.value
            action_counts[action] = action_counts.get(action, 0) + 1

        # Calculate average confidence
        confidences = [a.confidence_score for a in self.resolution_history]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        return {
            "total_automated_resolutions": total_attempts,
            "successful_resolutions": successful_attempts,
            "success_rate": success_rate,
            "average_confidence": avg_confidence,
            "resolutions_by_action": action_counts,
            "rules_performance": self._get_rule_performance_stats(),
        }

    def _get_rule_performance_stats(self) -> dict[str, Any]:
        """Get performance statistics for each rule"""
        stats = {}

        for rule_id, rule in self.resolution_rules.items():
            if rule.execution_count > 0:
                stats[rule_id] = {
                    "name": rule.name,
                    "executions": rule.execution_count,
                    "success_rate": rule.success_rate,
                    "enabled": rule.enabled,
                }

        return stats

    def add_custom_rule(self, rule: ResolutionRule) -> bool:
        """Add a custom resolution rule"""
        if rule.rule_id in self.resolution_rules:
            return False

        self.resolution_rules[rule.rule_id] = rule
        logger.info(f"Added custom resolution rule: {rule.name}")
        return True

    def update_rule(self, rule_id: str, updates: dict[str, Any]) -> bool:
        """Update an existing resolution rule"""
        if rule_id not in self.resolution_rules:
            return False

        rule = self.resolution_rules[rule_id]
        for key, value in updates.items():
            if hasattr(rule, key):
                setattr(rule, key, value)

        logger.info(f"Updated resolution rule: {rule_id}")
        return True

    def disable_rule(self, rule_id: str) -> bool:
        """Disable a resolution rule"""
        if rule_id not in self.resolution_rules:
            return False

        self.resolution_rules[rule_id].enabled = False
        logger.info(f"Disabled resolution rule: {rule_id}")
        return True


# Global instance
automated_resolution_engine = AutomatedCaseResolutionEngine()
