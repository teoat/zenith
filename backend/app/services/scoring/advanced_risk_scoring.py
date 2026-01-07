"""
Advanced Risk Scoring Engine
Dynamic, multi-factor risk assessment with predictive analytics and
real-time risk score adjustments based on new data and patterns.
"""

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class RiskFactor(Enum):
    TRANSACTION_AMOUNT = "transaction_amount"
    TRANSACTION_FREQUENCY = "transaction_frequency"
    GEOGRAPHIC_LOCATION = "geographic_location"
    TIME_PATTERN = "time_pattern"
    MERCHANT_CATEGORY = "merchant_category"
    DEVICE_FINGERPRINT = "device_fingerprint"
    BEHAVIORAL_BIOMETRICS = "behavioral_biometrics"
    SOCIAL_NETWORK = "social_network"
    HISTORICAL_PATTERN = "historical_pattern"
    EXTERNAL_DATA = "external_data"


class RiskLevel(Enum):
    VERY_LOW = "very_low"  # 0.0 - 0.2
    LOW = "low"  # 0.2 - 0.4
    MEDIUM = "medium"  # 0.4 - 0.6
    HIGH = "high"  # 0.6 - 0.8
    CRITICAL = "critical"  # 0.8 - 1.0


@dataclass
class RiskFactorScore:
    """Individual risk factor contribution"""

    factor: RiskFactor
    score: float  # 0.0 to 1.0
    confidence: float  # 0.0 to 1.0
    weight: float  # Relative importance
    evidence: list[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class RiskAssessment:
    """Complete risk assessment for an entity or transaction"""

    entity_id: str
    assessment_id: str
    overall_risk_score: float
    risk_level: RiskLevel
    factor_scores: dict[RiskFactor, RiskFactorScore]
    risk_trend: str  # "increasing", "decreasing", "stable"
    confidence_score: float
    assessment_reasoning: list[str]
    recommended_actions: list[str]
    time_horizon: str  # "immediate", "short_term", "long_term"
    created_at: datetime
    expires_at: datetime | None = None


@dataclass
class RiskThreshold:
    """Dynamic risk thresholds that adapt based on patterns"""

    threshold_id: str
    risk_level: RiskLevel
    base_threshold: float
    adaptive_offset: float = 0.0
    trigger_conditions: list[dict[str, Any]] = field(default_factory=list)
    last_adjusted: datetime = field(default_factory=datetime.now)


class AdvancedRiskScoringEngine:
    """Advanced risk scoring with dynamic, multi-factor assessment"""

    def __init__(self):
        self.risk_assessments: dict[str, RiskAssessment] = {}
        self.risk_factors: dict[RiskFactor, dict[str, Any]] = {}
        self.risk_thresholds: dict[str, RiskThreshold] = {}
        self.historical_data: dict[str, list[dict[str, Any]]] = defaultdict(list)

        # Initialize default risk factors and thresholds
        self._initialize_risk_factors()
        self._initialize_risk_thresholds()

    def _initialize_risk_factors(self):
        """Initialize risk factor configurations"""
        self.risk_factors = {
            RiskFactor.TRANSACTION_AMOUNT: {
                "weight": 0.15,
                "scoring_function": self._score_transaction_amount,
                "thresholds": {
                    "low": 100,
                    "medium": 1000,
                    "high": 10000,
                    "critical": 50000,
                },
            },
            RiskFactor.TRANSACTION_FREQUENCY: {
                "weight": 0.12,
                "scoring_function": self._score_transaction_frequency,
                "thresholds": {"low": 5, "medium": 15, "high": 30, "critical": 50},
            },
            RiskFactor.GEOGRAPHIC_LOCATION: {
                "weight": 0.18,
                "scoring_function": self._score_geographic_location,
                "high_risk_countries": {"North Korea", "Iran", "Syria", "Venezuela"},
                "distance_threshold_km": 1000,
            },
            RiskFactor.TIME_PATTERN: {
                "weight": 0.10,
                "scoring_function": self._score_time_pattern,
                "normal_hours": range(6, 22),  # 6 AM to 10 PM
                "high_risk_hours": range(22, 6),  # 10 PM to 6 AM
            },
            RiskFactor.MERCHANT_CATEGORY: {
                "weight": 0.08,
                "scoring_function": self._score_merchant_category,
                "high_risk_categories": {
                    "gambling",
                    "money_transfer",
                    "cryptocurrency",
                    "adult_entertainment",
                },
            },
            RiskFactor.DEVICE_FINGERPRINT: {
                "weight": 0.10,
                "scoring_function": self._score_device_fingerprint,
                "consistency_threshold": 0.8,
            },
            RiskFactor.BEHAVIORAL_BIOMETRICS: {
                "weight": 0.12,
                "scoring_function": self._score_behavioral_biometrics,
                "anomaly_threshold": 2.0,  # Standard deviations
            },
            RiskFactor.SOCIAL_NETWORK: {
                "weight": 0.08,
                "scoring_function": self._score_social_network,
                "connection_threshold": 3,
            },
            RiskFactor.HISTORICAL_PATTERN: {
                "weight": 0.05,
                "scoring_function": self._score_historical_pattern,
                "lookback_days": 90,
            },
            RiskFactor.EXTERNAL_DATA: {
                "weight": 0.02,
                "scoring_function": self._score_external_data,
                "data_sources": ["credit_bureau", "fraud_databases", "public_records"],
            },
        }

    def _initialize_risk_thresholds(self):
        """Initialize adaptive risk thresholds"""
        self.risk_thresholds = {
            "very_low": RiskThreshold(
                threshold_id="very_low",
                risk_level=RiskLevel.VERY_LOW,
                base_threshold=0.2,
                trigger_conditions=[
                    {"metric": "false_positive_rate", "operator": "<", "value": 0.02},
                    {"metric": "system_load", "operator": "<", "value": 0.7},
                ],
            ),
            "low": RiskThreshold(
                threshold_id="low",
                risk_level=RiskLevel.LOW,
                base_threshold=0.4,
                trigger_conditions=[
                    {"metric": "false_positive_rate", "operator": "<", "value": 0.05}
                ],
            ),
            "medium": RiskThreshold(
                threshold_id="medium",
                risk_level=RiskLevel.MEDIUM,
                base_threshold=0.6,
                trigger_conditions=[
                    {"metric": "case_complexity", "operator": ">", "value": 0.5}
                ],
            ),
            "high": RiskThreshold(
                threshold_id="high",
                risk_level=RiskLevel.HIGH,
                base_threshold=0.8,
                trigger_conditions=[
                    {"metric": "amount_involved", "operator": ">", "value": 10000},
                    {"metric": "entity_connections", "operator": ">", "value": 5},
                ],
            ),
            "critical": RiskThreshold(
                threshold_id="critical",
                risk_level=RiskLevel.CRITICAL,
                base_threshold=0.9,
                trigger_conditions=[
                    {"metric": "amount_involved", "operator": ">", "value": 100000},
                    {
                        "metric": "multiple_high_risk_factors",
                        "operator": ">",
                        "value": 3,
                    },
                ],
            ),
        }

    async def assess_risk(
        self,
        entity_id: str,
        context_data: dict[str, Any],
        assessment_type: str = "comprehensive",
    ) -> RiskAssessment:
        """
        Perform comprehensive risk assessment for an entity

        Args:
            entity_id: Entity identifier to assess
            context_data: Contextual data for risk assessment
            assessment_type: Type of assessment ("comprehensive", "transaction", "entity")

        Returns:
            Complete risk assessment
        """
        assessment_id = f"risk_{entity_id}_{int(datetime.now().timestamp())}"

        # Calculate individual factor scores
        factor_scores = {}
        for factor in RiskFactor:
            if factor in self.risk_factors:
                factor_config = self.risk_factors[factor]
                score = await factor_config["scoring_function"](entity_id, context_data)
                factor_scores[factor] = score

        # Calculate overall risk score using weighted ensemble
        overall_score = self._calculate_overall_risk_score(factor_scores)

        # Determine risk level
        risk_level = self._determine_risk_level(overall_score)

        # Calculate confidence and trend
        confidence_score = self._calculate_assessment_confidence(factor_scores)
        risk_trend = self._calculate_risk_trend(entity_id, overall_score)

        # Generate reasoning and recommendations
        reasoning = self._generate_assessment_reasoning(factor_scores, overall_score)
        recommendations = self._generate_risk_recommendations(risk_level, factor_scores)

        # Determine time horizon
        time_horizon = self._determine_time_horizon(risk_level, factor_scores)

        assessment = RiskAssessment(
            entity_id=entity_id,
            assessment_id=assessment_id,
            overall_risk_score=overall_score,
            risk_level=risk_level,
            factor_scores=factor_scores,
            risk_trend=risk_trend,
            confidence_score=confidence_score,
            assessment_reasoning=reasoning,
            recommended_actions=recommendations,
            time_horizon=time_horizon,
            created_at=datetime.now(),
            expires_at=datetime.now()
            + timedelta(hours=24),  # Assessments expire in 24 hours
        )

        # Store assessment
        self.risk_assessments[assessment_id] = assessment

        # Update historical data for trend analysis
        self._update_historical_data(
            entity_id,
            {
                "assessment_id": assessment_id,
                "risk_score": overall_score,
                "timestamp": datetime.now(),
                "factors": {k.value: v.score for k, v in factor_scores.items()},
            },
        )

        return assessment

    async def _score_transaction_amount(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on transaction amount"""
        transactions = context_data.get("transactions", [])
        if not transactions:
            return RiskFactorScore(
                factor=RiskFactor.TRANSACTION_AMOUNT,
                score=0.0,
                confidence=0.3,
                weight=self.risk_factors[RiskFactor.TRANSACTION_AMOUNT]["weight"],
                evidence=["No transaction data available"],
            )

        amounts = [tx.get("amount", 0) for tx in transactions]
        max_amount = max(amounts)
        avg_amount = sum(amounts) / len(amounts)

        thresholds = self.risk_factors[RiskFactor.TRANSACTION_AMOUNT]["thresholds"]

        # Calculate risk score based on amount thresholds
        if max_amount >= thresholds["critical"]:
            score = 1.0
            evidence = [
                f"Transaction amount ${max_amount:,.0f} exceeds critical threshold"
            ]
        elif max_amount >= thresholds["high"]:
            score = 0.8
            evidence = [f"High-value transaction: ${max_amount:,.0f}"]
        elif max_amount >= thresholds["medium"]:
            score = 0.6
            evidence = [f"Medium-value transaction: ${max_amount:,.0f}"]
        elif max_amount >= thresholds["low"]:
            score = 0.3
            evidence = [f"Low-value transaction: ${max_amount:,.0f}"]
        else:
            score = 0.1
            evidence = [f"Very low-value transaction: ${max_amount:,.0f}"]

        # Consider amount variability
        if len(amounts) > 1:
            std_dev = np.std(amounts)
            cv = std_dev / avg_amount if avg_amount > 0 else 0
            if cv > 1.0:  # High variability
                score += 0.1
                evidence.append("High transaction amount variability detected")

        return RiskFactorScore(
            factor=RiskFactor.TRANSACTION_AMOUNT,
            score=min(1.0, score),
            confidence=0.9,
            weight=self.risk_factors[RiskFactor.TRANSACTION_AMOUNT]["weight"],
            evidence=evidence,
        )

    async def _score_transaction_frequency(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on transaction frequency"""
        transactions = context_data.get("transactions", [])
        if len(transactions) < 2:
            return RiskFactorScore(
                factor=RiskFactor.TRANSACTION_FREQUENCY,
                score=0.0,
                confidence=0.3,
                weight=self.risk_factors[RiskFactor.TRANSACTION_FREQUENCY]["weight"],
                evidence=["Insufficient transaction data for frequency analysis"],
            )

        # Calculate transactions per day over the time period
        timestamps = []
        for tx in transactions:
            # Simplified timestamp extraction - would parse actual timestamps
            if "timestamp" in tx:
                timestamps.append(tx["timestamp"])

        if len(timestamps) < 2:
            return RiskFactorScore(
                factor=RiskFactor.TRANSACTION_FREQUENCY,
                score=0.0,
                confidence=0.3,
                weight=self.risk_factors[RiskFactor.TRANSACTION_FREQUENCY]["weight"],
                evidence=["Unable to determine transaction timing"],
            )

        # Calculate time span (simplified)
        time_span_days = max(1, (len(timestamps) - 1) * 0.1)  # Rough estimate
        transactions_per_day = len(transactions) / time_span_days

        thresholds = self.risk_factors[RiskFactor.TRANSACTION_FREQUENCY]["thresholds"]

        if transactions_per_day >= thresholds["critical"]:
            score = 1.0
            evidence = [
                f"Extremely high frequency: {transactions_per_day:.1f} transactions/day"
            ]
        elif transactions_per_day >= thresholds["high"]:
            score = 0.8
            evidence = [f"High frequency: {transactions_per_day:.1f} transactions/day"]
        elif transactions_per_day >= thresholds["medium"]:
            score = 0.6
            evidence = [
                f"Moderate frequency: {transactions_per_day:.1f} transactions/day"
            ]
        elif transactions_per_day >= thresholds["low"]:
            score = 0.3
            evidence = [f"Low frequency: {transactions_per_day:.1f} transactions/day"]
        else:
            score = 0.1
            evidence = [
                f"Very low frequency: {transactions_per_day:.1f} transactions/day"
            ]

        # Check for burst patterns
        if self._detect_frequency_burst(transactions):
            score += 0.2
            evidence.append("Transaction burst pattern detected")

        return RiskFactorScore(
            factor=RiskFactor.TRANSACTION_FREQUENCY,
            score=min(1.0, score),
            confidence=0.85,
            weight=self.risk_factors[RiskFactor.TRANSACTION_FREQUENCY]["weight"],
            evidence=evidence,
        )

    def _detect_frequency_burst(self, transactions: list[dict[str, Any]]) -> bool:
        """Detect transaction frequency bursts"""
        if len(transactions) < 5:
            return False

        # Simple burst detection - check if many transactions occur in short time windows
        # In practice, would use proper time series analysis
        return len(transactions) > 10  # Simplified heuristic

    async def _score_geographic_location(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on geographic location patterns"""
        locations = context_data.get("locations", [])
        if not locations:
            return RiskFactorScore(
                factor=RiskFactor.GEOGRAPHIC_LOCATION,
                score=0.0,
                confidence=0.2,
                weight=self.risk_factors[RiskFactor.GEOGRAPHIC_LOCATION]["weight"],
                evidence=["No location data available"],
            )

        high_risk_countries = self.risk_factors[RiskFactor.GEOGRAPHIC_LOCATION][
            "high_risk_countries"
        ]
        countries = [loc.get("country", "").upper() for loc in locations]

        # Count high-risk country transactions
        high_risk_count = sum(
            1 for country in countries if country in high_risk_countries
        )

        # Calculate geographic spread
        unique_countries = len(set(countries))
        total_locations = len(locations)

        evidence = []
        score = 0.0

        if high_risk_count > 0:
            risk_percentage = high_risk_count / total_locations
            score += risk_percentage * 0.8
            evidence.append(f"{high_risk_count} transactions in high-risk countries")

        if unique_countries > 5:
            spread_score = min(0.4, (unique_countries - 5) * 0.1)
            score += spread_score
            evidence.append(f"Wide geographic spread: {unique_countries} countries")

        # Check for unusual location changes
        if self._detect_location_anomalies(locations):
            score += 0.2
            evidence.append("Unusual geographic location patterns detected")

        return RiskFactorScore(
            factor=RiskFactor.GEOGRAPHIC_LOCATION,
            score=min(1.0, score),
            confidence=0.8,
            weight=self.risk_factors[RiskFactor.GEOGRAPHIC_LOCATION]["weight"],
            evidence=evidence or ["Normal geographic patterns"],
        )

    def _detect_location_anomalies(self, locations: list[dict[str, Any]]) -> bool:
        """Detect anomalous location patterns"""
        if len(locations) < 3:
            return False

        # Simplified anomaly detection
        # In practice, would use clustering algorithms to detect outliers
        countries = [loc.get("country", "") for loc in locations]
        country_counts = defaultdict(int)

        for country in countries:
            country_counts[country] += 1

        # Check if most transactions are in one country but some are in distant locations
        max_count = max(country_counts.values())
        total_count = sum(country_counts.values())

        return max_count / total_count < 0.7  # Less than 70% in primary country

    async def _score_time_pattern(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on transaction timing patterns"""
        transactions = context_data.get("transactions", [])
        if not transactions:
            return RiskFactorScore(
                factor=RiskFactor.TIME_PATTERN,
                score=0.0,
                confidence=0.2,
                weight=self.risk_factors[RiskFactor.TIME_PATTERN]["weight"],
                evidence=["No transaction timing data"],
            )

        # Extract transaction hours (simplified)
        hours = []
        for tx in transactions:
            # Simplified hour extraction - would parse actual timestamps
            hour = tx.get("hour", 12)  # Default to noon
            hours.append(hour)

        normal_hours = self.risk_factors[RiskFactor.TIME_PATTERN]["normal_hours"]
        high_risk_hours = self.risk_factors[RiskFactor.TIME_PATTERN]["high_risk_hours"]

        sum(1 for hour in hours if hour in normal_hours)
        high_risk_count = sum(1 for hour in hours if hour in high_risk_hours)

        total_transactions = len(hours)
        evidence = []

        score = 0.0

        # High-risk timing
        if (
            high_risk_count > total_transactions * 0.3
        ):  # More than 30% in high-risk hours
            risk_percentage = high_risk_count / total_transactions
            score += risk_percentage * 0.6
            evidence.append(
                f"{(risk_percentage * 100):.0f}% of transactions during high-risk hours"
            )

        # Unusual timing patterns
        if self._detect_timing_anomalies(hours):
            score += 0.3
            evidence.append("Unusual transaction timing patterns detected")

        return RiskFactorScore(
            factor=RiskFactor.TIME_PATTERN,
            score=min(1.0, score),
            confidence=0.75,
            weight=self.risk_factors[RiskFactor.TIME_PATTERN]["weight"],
            evidence=evidence or ["Normal transaction timing patterns"],
        )

    def _detect_timing_anomalies(self, hours: list[int]) -> bool:
        """Detect anomalous timing patterns"""
        if len(hours) < 5:
            return False

        # Check for very regular patterns (potential automation)
        hour_counts = defaultdict(int)
        for hour in hours:
            hour_counts[hour] += 1

        # If transactions occur at the same hour frequently
        max_count = max(hour_counts.values())
        return max_count > len(hours) * 0.4  # More than 40% at same hour

    async def _score_merchant_category(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on merchant categories"""
        transactions = context_data.get("transactions", [])
        if not transactions:
            return RiskFactorScore(
                factor=RiskFactor.MERCHANT_CATEGORY,
                score=0.0,
                confidence=0.2,
                weight=self.risk_factors[RiskFactor.MERCHANT_CATEGORY]["weight"],
                evidence=["No merchant data available"],
            )

        high_risk_categories = self.risk_factors[RiskFactor.MERCHANT_CATEGORY][
            "high_risk_categories"
        ]

        categories = [tx.get("merchant_category", "").lower() for tx in transactions]
        high_risk_count = sum(1 for cat in categories if cat in high_risk_categories)

        evidence = []
        score = 0.0

        if high_risk_count > 0:
            risk_percentage = high_risk_count / len(transactions)
            score += risk_percentage * 0.8
            evidence.append(
                f"{high_risk_count} transactions in high-risk merchant categories"
            )

        # Check for category concentration
        category_counts = defaultdict(int)
        for cat in categories:
            category_counts[cat] += 1

        # If >70% of transactions are in one category
        max_category_count = max(category_counts.values()) if category_counts else 0
        if max_category_count > len(transactions) * 0.7:
            score += 0.2
            dominant_category = max(category_counts.items(), key=lambda x: x[1])[0]
            evidence.append(
                f"High concentration in merchant category: {dominant_category}"
            )

        return RiskFactorScore(
            factor=RiskFactor.MERCHANT_CATEGORY,
            score=min(1.0, score),
            confidence=0.8,
            weight=self.risk_factors[RiskFactor.MERCHANT_CATEGORY]["weight"],
            evidence=evidence or ["Normal merchant category distribution"],
        )

    async def _score_device_fingerprint(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on device fingerprint consistency"""
        devices = context_data.get("device_fingerprints", [])
        if len(devices) < 2:
            return RiskFactorScore(
                factor=RiskFactor.DEVICE_FINGERPRINT,
                score=0.0,
                confidence=0.3,
                weight=self.risk_factors[RiskFactor.DEVICE_FINGERPRINT]["weight"],
                evidence=["Insufficient device data for analysis"],
            )

        fingerprints = list(
            {d.get("fingerprint", "") for d in devices if d.get("fingerprint")}
        )
        consistency_threshold = self.risk_factors[RiskFactor.DEVICE_FINGERPRINT][
            "consistency_threshold"
        ]

        evidence = []
        score = 0.0

        if len(fingerprints) == 1:
            # Perfect consistency
            score = 0.0
            evidence.append("Consistent device usage")
        else:
            # Multiple devices - check for suspicious patterns
            unique_devices = len(fingerprints)
            consistency_score = 1.0 / unique_devices  # Lower score for more devices

            if consistency_score < consistency_threshold:
                score = (1.0 - consistency_score) * 0.7
                evidence.append(
                    f"Multiple devices detected: {unique_devices} unique fingerprints"
                )

            # Check for rapid device changes
            if self._detect_device_swapping(devices):
                score += 0.3
                evidence.append("Frequent device changes detected")

        return RiskFactorScore(
            factor=RiskFactor.DEVICE_FINGERPRINT,
            score=min(1.0, score),
            confidence=0.7,
            weight=self.risk_factors[RiskFactor.DEVICE_FINGERPRINT]["weight"],
            evidence=evidence,
        )

    def _detect_device_swapping(self, devices: list[dict[str, Any]]) -> bool:
        """Detect frequent device changes"""
        if len(devices) < 3:
            return False

        # Sort by timestamp and check for rapid changes
        # Simplified - would use proper timestamp comparison
        return len(devices) > 5  # Simplified heuristic

    async def _score_behavioral_biometrics(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on behavioral biometrics"""
        behavioral_data = context_data.get("behavioral_data", {})
        if not behavioral_data:
            return RiskFactorScore(
                factor=RiskFactor.BEHAVIORAL_BIOMETRICS,
                score=0.0,
                confidence=0.2,
                weight=self.risk_factors[RiskFactor.BEHAVIORAL_BIOMETRICS]["weight"],
                evidence=["No behavioral data available"],
            )

        # Simplified behavioral analysis
        anomaly_score = 0.0
        evidence = []

        # Check keystroke patterns
        keystroke_consistency = behavioral_data.get("keystroke_consistency", 1.0)
        if keystroke_consistency < 0.7:
            anomaly_score += 0.3
            evidence.append("Irregular keystroke patterns detected")

        # Check mouse movement
        mouse_consistency = behavioral_data.get("mouse_consistency", 1.0)
        if mouse_consistency < 0.7:
            anomaly_score += 0.3
            evidence.append("Unusual mouse movement patterns")

        # Check session behavior
        session_anomaly = behavioral_data.get("session_anomaly_score", 0.0)
        if session_anomaly > 0.5:
            anomaly_score += session_anomaly * 0.4
            evidence.append("Abnormal session behavior detected")

        return RiskFactorScore(
            factor=RiskFactor.BEHAVIORAL_BIOMETRICS,
            score=min(1.0, anomaly_score),
            confidence=0.75,
            weight=self.risk_factors[RiskFactor.BEHAVIORAL_BIOMETRICS]["weight"],
            evidence=evidence or ["Normal behavioral patterns"],
        )

    async def _score_social_network(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on social network connections"""
        connections = context_data.get("social_connections", [])
        connection_threshold = self.risk_factors[RiskFactor.SOCIAL_NETWORK][
            "connection_threshold"
        ]

        evidence = []
        score = 0.0

        if len(connections) > connection_threshold:
            score += min(0.6, (len(connections) - connection_threshold) * 0.1)
            evidence.append(f"Extensive network: {len(connections)} connections")

        # Check for high-risk connections
        high_risk_connections = [c for c in connections if c.get("risk_score", 0) > 0.7]
        if high_risk_connections:
            score += len(high_risk_connections) * 0.2
            evidence.append(
                f"Connected to {len(high_risk_connections)} high-risk entities"
            )

        # Check for network centrality
        centrality_score = context_data.get("network_centrality", 0.0)
        if centrality_score > 0.5:
            score += centrality_score * 0.3
            evidence.append("High network centrality detected")

        return RiskFactorScore(
            factor=RiskFactor.SOCIAL_NETWORK,
            score=min(1.0, score),
            confidence=0.7,
            weight=self.risk_factors[RiskFactor.SOCIAL_NETWORK]["weight"],
            evidence=evidence or ["Normal network connections"],
        )

    async def _score_historical_pattern(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on historical patterns"""
        historical_data = self.historical_data.get(entity_id, [])
        self.risk_factors[RiskFactor.HISTORICAL_PATTERN][
            "lookback_days"
        ]

        if len(historical_data) < 3:
            return RiskFactorScore(
                factor=RiskFactor.HISTORICAL_PATTERN,
                score=0.0,
                confidence=0.3,
                weight=self.risk_factors[RiskFactor.HISTORICAL_PATTERN]["weight"],
                evidence=["Insufficient historical data"],
            )

        # Analyze risk score trends
        recent_scores = [
            entry["risk_score"]
            for entry in historical_data[-10:]  # Last 10 assessments
        ]

        if not recent_scores:
            return RiskFactorScore(
                factor=RiskFactor.HISTORICAL_PATTERN,
                score=0.0,
                confidence=0.3,
                weight=self.risk_factors[RiskFactor.HISTORICAL_PATTERN]["weight"],
                evidence=["No recent risk assessments"],
            )

        current_avg = sum(recent_scores) / len(recent_scores)
        trend = self._calculate_risk_trend_from_history(recent_scores)

        evidence = []
        score = 0.0

        if trend == "increasing":
            score += 0.4
            evidence.append("Risk score trending upward")
        elif trend == "stable":
            score += 0.1
            evidence.append("Stable risk patterns")
        elif trend == "decreasing":
            score -= 0.2  # Lower risk for improving patterns
            evidence.append("Risk score trending downward")

        # High current risk
        if current_avg > 0.6:
            score += 0.3
            evidence.append("Consistently high risk scores")

        return RiskFactorScore(
            factor=RiskFactor.HISTORICAL_PATTERN,
            score=max(0.0, min(1.0, score)),
            confidence=0.8,
            weight=self.risk_factors[RiskFactor.HISTORICAL_PATTERN]["weight"],
            evidence=evidence,
        )

    def _calculate_risk_trend_from_history(self, scores: list[float]) -> str:
        """Calculate risk trend from historical scores"""
        if len(scores) < 3:
            return "stable"

        # Simple linear trend
        x = list(range(len(scores)))
        slope = np.polyfit(x, scores, 1)[0]

        if slope > 0.01:
            return "increasing"
        elif slope < -0.01:
            return "decreasing"
        else:
            return "stable"

    async def _score_external_data(
        self, entity_id: str, context_data: dict[str, Any]
    ) -> RiskFactorScore:
        """Score risk based on external data sources"""
        external_data = context_data.get("external_data", {})

        score = 0.0
        evidence = []

        # Credit score (if available)
        credit_score = external_data.get("credit_score")
        if credit_score and credit_score < 600:
            score += 0.3
            evidence.append(f"Low credit score: {credit_score}")

        # Fraud database hits
        fraud_hits = external_data.get("fraud_database_hits", 0)
        if fraud_hits > 0:
            score += min(0.5, fraud_hits * 0.1)
            evidence.append(f"Found in {fraud_hits} fraud databases")

        # Regulatory flags
        regulatory_flags = external_data.get("regulatory_flags", [])
        if regulatory_flags:
            score += len(regulatory_flags) * 0.2
            evidence.append(f"Regulatory flags: {', '.join(regulatory_flags)}")

        return RiskFactorScore(
            factor=RiskFactor.EXTERNAL_DATA,
            score=min(1.0, score),
            confidence=0.6,  # External data confidence varies
            weight=self.risk_factors[RiskFactor.EXTERNAL_DATA]["weight"],
            evidence=evidence or ["No significant external risk indicators"],
        )

    def _calculate_overall_risk_score(
        self, factor_scores: dict[RiskFactor, RiskFactorScore]
    ) -> float:
        """Calculate overall risk score using weighted ensemble"""
        total_weight = 0
        weighted_sum = 0

        for score_obj in factor_scores.values():
            weight = score_obj.weight
            score = score_obj.score
            confidence = score_obj.confidence

            # Weight score by confidence
            weighted_score = score * confidence * weight
            weighted_sum += weighted_score
            total_weight += weight

        return weighted_sum / total_weight if total_weight > 0 else 0.0

    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """Determine risk level from score"""
        if risk_score >= 0.8:
            return RiskLevel.CRITICAL
        elif risk_score >= 0.6:
            return RiskLevel.HIGH
        elif risk_score >= 0.4:
            return RiskLevel.MEDIUM
        elif risk_score >= 0.2:
            return RiskLevel.LOW
        else:
            return RiskLevel.VERY_LOW

    def _calculate_assessment_confidence(
        self, factor_scores: dict[RiskFactor, RiskFactorScore]
    ) -> float:
        """Calculate overall confidence in the assessment"""
        confidences = [score.confidence for score in factor_scores.values()]
        return sum(confidences) / len(confidences) if confidences else 0.0

    def _calculate_risk_trend(self, entity_id: str, current_score: float) -> str:
        """Calculate risk trend for the entity"""
        historical_scores = [
            entry["risk_score"]
            for entry in self.historical_data[entity_id][-5:]  # Last 5 assessments
        ]

        if len(historical_scores) < 2:
            return "unknown"

        recent_avg = sum(historical_scores) / len(historical_scores)
        trend = current_score - recent_avg

        if trend > 0.1:
            return "increasing"
        elif trend < -0.1:
            return "decreasing"
        else:
            return "stable"

    def _generate_assessment_reasoning(
        self, factor_scores: dict[RiskFactor, RiskFactorScore], overall_score: float
    ) -> list[str]:
        """Generate human-readable assessment reasoning"""
        reasoning = []

        # Sort factors by contribution
        sorted_factors = sorted(
            factor_scores.items(), key=lambda x: x[1].score * x[1].weight, reverse=True
        )

        # Primary risk factors
        top_factors = sorted_factors[:3]
        reasoning.append(
            f"Primary risk factors: {', '.join([f[0].value.replace('_', ' ') for f, _ in top_factors])}"
        )

        # Risk level explanation
        risk_level = self._determine_risk_level(overall_score)
        reasoning.append(
            f"Overall risk level: {risk_level.value.replace('_', ' ').title()}"
        )

        # Confidence assessment
        confidence = self._calculate_assessment_confidence(factor_scores)
        if confidence > 0.8:
            reasoning.append("High confidence in risk assessment")
        elif confidence > 0.6:
            reasoning.append("Moderate confidence in risk assessment")
        else:
            reasoning.append("Limited confidence - additional data recommended")

        return reasoning

    def _generate_risk_recommendations(
        self, risk_level: RiskLevel, factor_scores: dict[RiskFactor, RiskFactorScore]
    ) -> list[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []

        if risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
            recommendations.extend(
                [
                    "Immediate case escalation required",
                    "Enhanced transaction monitoring",
                    "Contact law enforcement if applicable",
                ]
            )

        if risk_level in [RiskLevel.HIGH, RiskLevel.MEDIUM]:
            recommendations.extend(
                [
                    "Increase monitoring frequency",
                    "Require additional verification",
                    "Review account access patterns",
                ]
            )

        # Factor-specific recommendations
        for factor, score in factor_scores.items():
            if score.score > 0.7:
                if factor == RiskFactor.TRANSACTION_AMOUNT:
                    recommendations.append("Monitor high-value transactions closely")
                elif factor == RiskFactor.GEOGRAPHIC_LOCATION:
                    recommendations.append("Verify unusual geographic locations")
                elif factor == RiskFactor.DEVICE_FINGERPRINT:
                    recommendations.append("Investigate device inconsistencies")

        return recommendations

    def _determine_time_horizon(
        self, risk_level: RiskLevel, factor_scores: dict[RiskFactor, RiskFactorScore]
    ) -> str:
        """Determine appropriate time horizon for risk monitoring"""
        if risk_level == RiskLevel.CRITICAL:
            return "immediate"
        elif risk_level == RiskLevel.HIGH:
            return "short_term"  # Hours to days
        elif risk_level == RiskLevel.MEDIUM:
            return "short_term"  # Days to week
        else:
            return "long_term"  # Weeks to months

    def _update_historical_data(self, entity_id: str, assessment_data: dict[str, Any]):
        """Update historical data for trend analysis"""
        self.historical_data[entity_id].append(assessment_data)

        # Keep only recent history (last 100 entries)
        if len(self.historical_data[entity_id]) > 100:
            self.historical_data[entity_id] = self.historical_data[entity_id][-100:]

    def get_risk_assessment(self, assessment_id: str) -> RiskAssessment | None:
        """Retrieve a specific risk assessment"""
        return self.risk_assessments.get(assessment_id)

    def get_entity_risk_history(
        self, entity_id: str, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Get risk assessment history for an entity"""
        return self.historical_data[entity_id][-limit:]

    def update_risk_thresholds(self, market_conditions: dict[str, Any]):
        """Update risk thresholds based on market conditions"""
        # Adjust thresholds based on current market volatility, etc.
        # Implementation would adapt thresholds dynamically

    def get_risk_statistics(self) -> dict[str, Any]:
        """Get overall risk assessment statistics"""
        total_assessments = len(self.risk_assessments)
        if total_assessments == 0:
            return {"message": "No assessments available"}

        scores = [
            assessment.overall_risk_score
            for assessment in self.risk_assessments.values()
        ]

        return {
            "total_assessments": total_assessments,
            "average_risk_score": sum(scores) / len(scores),
            "risk_distribution": {
                "very_low": sum(1 for s in scores if s < 0.2),
                "low": sum(1 for s in scores if 0.2 <= s < 0.4),
                "medium": sum(1 for s in scores if 0.4 <= s < 0.6),
                "high": sum(1 for s in scores if 0.6 <= s < 0.8),
                "critical": sum(1 for s in scores if s >= 0.8),
            },
            "assessment_trends": self._calculate_assessment_trends(),
        }

    def _calculate_assessment_trends(self) -> dict[str, Any]:
        """Calculate trends in risk assessments"""
        if len(self.risk_assessments) < 5:
            return {"message": "Insufficient data for trend analysis"}

        # Sort assessments by creation time
        sorted_assessments = sorted(
            self.risk_assessments.values(), key=lambda x: x.created_at
        )

        recent_scores = [a.overall_risk_score for a in sorted_assessments[-10:]]
        older_scores = (
            [a.overall_risk_score for a in sorted_assessments[-20:-10]]
            if len(sorted_assessments) >= 20
            else []
        )

        trend = "stable"
        if older_scores:
            recent_avg = sum(recent_scores) / len(recent_scores)
            older_avg = sum(older_scores) / len(older_scores)
            if recent_avg > older_avg + 0.05:
                trend = "increasing"
            elif recent_avg < older_avg - 0.05:
                trend = "decreasing"

        return {
            "overall_trend": trend,
            "recent_average": sum(recent_scores) / len(recent_scores),
            "change_rate": self._calculate_trend_slope(recent_scores),
        }

    def _calculate_trend_slope(self, scores: list[float]) -> float:
        """Calculate slope of risk score trend"""
        if len(scores) < 2:
            return 0.0

        x = list(range(len(scores)))
        slope, _ = np.polyfit(x, scores, 1)
        return slope


# Global instance
advanced_risk_engine = AdvancedRiskScoringEngine()
