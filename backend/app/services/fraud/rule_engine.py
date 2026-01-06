"""
Rule-Based Fraud Detection Engine
Core engine for configurable fraud detection rules
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Any


class RuleType(Enum):
    """Types of fraud detection rules"""

    VELOCITY = "velocity"  # Transaction frequency
    AMOUNT = "amount"  # Transaction amount thresholds
    PATTERN = "pattern"  # Behavioral patterns
    GEOGRAPHIC = "geographic"  # Location-based rules
    TIME = "time"  # Time-based rules
    ACCOUNT = "account"  # Account-based rules


class RiskLevel(Enum):
    """Risk levels for flagged transactions"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudRule:
    """Base class for fraud detection rules"""

    def __init__(
        self,
        rule_id: str,
        name: str,
        description: str,
        rule_type: RuleType,
        risk_level: RiskLevel,
        enabled: bool = True,
    ):
        self.rule_id = rule_id
        self.name = name
        self.description = description
        self.rule_type = rule_type
        self.risk_level = risk_level
        self.enabled = enabled
        self.created_at = datetime.utcnow()
        self.triggered_count = 0

    def evaluate(
        self, transaction: dict[str, Any], context: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Evaluate if transaction triggers this rule

        Returns:
        {
            "triggered": bool,
            "risk_score": int (0-100),
            "reason": str,
            "details": dict
        }
        """
        raise NotImplementedError("Subclasses must implement evaluate()")


class VelocityRule(FraudRule):
    """Check transaction velocity (frequency) patterns"""

    def __init__(
        self,
        rule_id: str,
        max_transactions: int,
        time_window_minutes: int,
        risk_level: RiskLevel = RiskLevel.MEDIUM,
    ):
        super().__init__(
            rule_id=rule_id,
            name=f"Velocity Check: {max_transactions} transactions in {time_window_minutes} minutes",
            description=f"Flags if more than {max_transactions} transactions occur within {time_window_minutes} minutes",
            rule_type=RuleType.VELOCITY,
            risk_level=risk_level,
        )
        self.max_transactions = max_transactions
        self.time_window_minutes = time_window_minutes

    def evaluate(
        self, transaction: dict[str, Any], context: dict[str, Any]
    ) -> dict[str, Any]:
        """Check if velocity threshold exceeded"""
        account_id = transaction.get("account_id")
        timestamp = datetime.fromisoformat(
            transaction.get("timestamp", datetime.utcnow().isoformat())
        )

        # Get recent transactions from context
        recent_transactions = context.get("recent_transactions", [])

        # Filter transactions within time window
        cutoff_time = timestamp - timedelta(minutes=self.time_window_minutes)
        transactions_in_window = [
            t
            for t in recent_transactions
            if datetime.fromisoformat(t.get("timestamp", "")) > cutoff_time
            and t.get("account_id") == account_id
        ]

        count = len(transactions_in_window) + 1  # +1 for current transaction
        triggered = count > self.max_transactions

        if triggered:
            self.triggered_count += 1

        risk_score = (
            min(100, int((count / self.max_transactions) * 50)) if triggered else 0
        )

        return {
            "triggered": triggered,
            "risk_score": risk_score,
            "reason": f"Velocity exceeded: {count} transactions in {self.time_window_minutes} minutes (limit: {self.max_transactions})",
            "details": {
                "transaction_count": count,
                "time_window_minutes": self.time_window_minutes,
                "threshold": self.max_transactions,
            },
        }


class AmountThresholdRule(FraudRule):
    """Check if transaction amount exceeds thresholds"""

    def __init__(
        self,
        rule_id: str,
        threshold_amount: float,
        currency: str = "USD",
        risk_level: RiskLevel = RiskLevel.HIGH,
    ):
        super().__init__(
            rule_id=rule_id,
            name=f"Amount Threshold: {currency} {threshold_amount}",
            description=f"Flags transactions exceeding {currency} {threshold_amount}",
            rule_type=RuleType.AMOUNT,
            risk_level=risk_level,
        )
        self.threshold_amount = threshold_amount
        self.currency = currency

    def evaluate(
        self, transaction: dict[str, Any], context: dict[str, Any]
    ) -> dict[str, Any]:
        """Check if amount exceeds threshold"""
        amount = float(transaction.get("amount", 0))
        currency = transaction.get("currency", "USD")

        triggered = amount > self.threshold_amount and currency == self.currency

        if triggered:
            self.triggered_count += 1

        risk_score = (
            min(100, int((amount / self.threshold_amount) * 60)) if triggered else 0
        )

        return {
            "triggered": triggered,
            "risk_score": risk_score,
            "reason": f"Amount {currency} {amount} exceeds threshold {self.currency} {self.threshold_amount}",
            "details": {
                "amount": amount,
                "currency": currency,
                "threshold": self.threshold_amount,
                "excess_percentage": (
                    ((amount / self.threshold_amount) - 1) * 100 if triggered else 0
                ),
            },
        }


class GeographicAnomalyRule(FraudRule):
    """Detect geographic anomalies (impossible travel, unusual locations)"""

    def __init__(
        self,
        rule_id: str,
        max_distance_km: float = 500,
        min_time_hours: float = 1,
        risk_level: RiskLevel = RiskLevel.CRITICAL,
    ):
        super().__init__(
            rule_id=rule_id,
            name=f"Geographic Anomaly: {max_distance_km}km in {min_time_hours}h",
            description="Detects impossible travel patterns",
            rule_type=RuleType.GEOGRAPHIC,
            risk_level=risk_level,
        )
        self.max_distance_km = max_distance_km
        self.min_time_hours = min_time_hours

    def evaluate(
        self, transaction: dict[str, Any], context: dict[str, Any]
    ) -> dict[str, Any]:
        """Check for impossible travel"""
        location = transaction.get("location", {})
        timestamp = datetime.fromisoformat(
            transaction.get("timestamp", datetime.utcnow().isoformat())
        )

        last_transaction = context.get("last_transaction", {})
        if not last_transaction:
            return {
                "triggered": False,
                "risk_score": 0,
                "reason": "No previous transaction",
                "details": {},
            }

        last_location = last_transaction.get("location", {})
        last_timestamp = datetime.fromisoformat(last_transaction.get("timestamp", ""))

        # Simplified distance calculation (should use haversine in production)
        distance_km = self._calculate_distance(location, last_location)
        time_diff_hours = (timestamp - last_timestamp).total_seconds() / 3600

        # Check if travel is physically impossible
        required_speed = (
            distance_km / time_diff_hours if time_diff_hours > 0 else float("inf")
        )
        triggered = (
            distance_km > self.max_distance_km and time_diff_hours < self.min_time_hours
        )

        if triggered:
            self.triggered_count += 1

        risk_score = (
            min(100, int((distance_km / self.max_distance_km) * 80)) if triggered else 0
        )

        return {
            "triggered": triggered,
            "risk_score": risk_score,
            "reason": f"Impossible travel: {distance_km:.0f}km in {time_diff_hours:.1f}h (speed: {required_speed:.0f}km/h)",
            "details": {
                "distance_km": distance_km,
                "time_hours": time_diff_hours,
                "required_speed_kmh": required_speed,
                "from_location": last_location,
                "to_location": location,
            },
        }

    def _calculate_distance(self, loc1: dict, loc2: dict) -> float:
        """Simplified distance calculation - use haversine in production"""
        if not loc1 or not loc2:
            return 0

        lat1, lon1 = loc1.get("lat", 0), loc1.get("lon", 0)
        lat2, lon2 = loc2.get("lat", 0), loc2.get("lon", 0)

        # Simplified: 1 degree ≈ 111km
        return abs(lat1 - lat2) * 111 + abs(lon1 - lon2) * 111


class RuleEngine:
    """Main fraud detection rule engine"""

    def __init__(self):
        self.rules: list[FraudRule] = []
        self.evaluation_count = 0

    def add_rule(self, rule: FraudRule):
        """Add a rule to the engine"""
        self.rules.append(rule)

    def remove_rule(self, rule_id: str):
        """Remove a rule by ID"""
        self.rules = [r for r in self.rules if r.rule_id != rule_id]

    def get_rule(self, rule_id: str) -> FraudRule | None:
        """Get a specific rule"""
        return next((r for r in self.rules if r.rule_id == rule_id), None)

    def evaluate_transaction(
        self, transaction: dict[str, Any], context: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Evaluate a transaction against all enabled rules

        Returns:
        {
            "is_fraud": bool,
            "overall_risk_score": int (0-100),
            "triggered_rules": List[dict],
            "recommendations": List[str]
        }
        """
        self.evaluation_count += 1

        triggered_rules = []
        total_risk_score = 0

        for rule in self.rules:
            if not rule.enabled:
                continue

            result = rule.evaluate(transaction, context)

            if result["triggered"]:
                triggered_rules.append(
                    {
                        "rule_id": rule.rule_id,
                        "rule_name": rule.name,
                        "rule_type": rule.rule_type.value,
                        "risk_level": rule.risk_level.value,
                        "risk_score": result["risk_score"],
                        "reason": result["reason"],
                        "details": result["details"],
                    }
                )
                total_risk_score += result["risk_score"]

        # Cap at 100
        overall_risk_score = min(100, total_risk_score)
        is_fraud = overall_risk_score >= 70 or any(
            r["risk_level"] == "critical" for r in triggered_rules
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            triggered_rules, overall_risk_score
        )

        return {
            "is_fraud": is_fraud,
            "overall_risk_score": overall_risk_score,
            "triggered_rules": triggered_rules,
            "recommendations": recommendations,
            "evaluation_timestamp": datetime.utcnow().isoformat(),
        }

    def _generate_recommendations(
        self, triggered_rules: list[dict], risk_score: int
    ) -> list[str]:
        """Generate action recommendations based on results"""
        recommendations = []

        if risk_score >= 90:
            recommendations.append(
                "IMMEDIATE ACTION: Block transaction and contact fraud team"
            )
            recommendations.append("Freeze account pending investigation")
        elif risk_score >= 70:
            recommendations.append("HIGH RISK: Manual review required within 1 hour")
            recommendations.append("Contact customer for verification")
        elif risk_score >= 50:
            recommendations.append("MEDIUM RISK: Flag for review within 24 hours")
            recommendations.append("Add to watchlist")
        elif risk_score >= 30:
            recommendations.append("LOW RISK: Automated monitoring")

        # Specific recommendations based on rule types
        rule_types = {r["rule_type"] for r in triggered_rules}

        if "velocity" in rule_types:
            recommendations.append("Check for account takeover or card testing")

        if "geographic" in rule_types:
            recommendations.append("Verify customer location and recent activity")

        if "amount" in rule_types:
            recommendations.append("Confirm transaction with customer")

        return recommendations

    def get_stats(self) -> dict[str, Any]:
        """Get engine statistics"""
        return {
            "total_rules": len(self.rules),
            "enabled_rules": sum(1 for r in self.rules if r.enabled),
            "total_evaluations": self.evaluation_count,
            "rules_by_type": {
                rule_type.value: sum(1 for r in self.rules if r.rule_type == rule_type)
                for rule_type in RuleType
            },
            "most_triggered_rules": sorted(
                [
                    {"rule_id": r.rule_id, "name": r.name, "count": r.triggered_count}
                    for r in self.rules
                ],
                key=lambda x: x["count"],
                reverse=True,
            )[:5],
        }


# Default rule set
def create_default_rules() -> RuleEngine:
    """Create engine with default fraud detection rules"""
    engine = RuleEngine()

    # Velocity rules
    engine.add_rule(
        VelocityRule(
            "VEL001",
            max_transactions=5,
            time_window_minutes=5,
            risk_level=RiskLevel.HIGH,
        )
    )
    engine.add_rule(
        VelocityRule(
            "VEL002",
            max_transactions=10,
            time_window_minutes=60,
            risk_level=RiskLevel.MEDIUM,
        )
    )

    # Amount rules
    engine.add_rule(
        AmountThresholdRule(
            "AMT001", threshold_amount=10000.0, risk_level=RiskLevel.HIGH
        )
    )
    engine.add_rule(
        AmountThresholdRule(
            "AMT002", threshold_amount=50000.0, risk_level=RiskLevel.CRITICAL
        )
    )

    # Geographic rules
    engine.add_rule(
        GeographicAnomalyRule(
            "GEO001",
            max_distance_km=500,
            min_time_hours=1,
            risk_level=RiskLevel.CRITICAL,
        )
    )

    return engine
