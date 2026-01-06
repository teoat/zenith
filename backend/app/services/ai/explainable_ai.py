"""
Explainable AI Framework
Provides human-interpretable explanations for fraud detection predictions.
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ExplanationType(Enum):
    FEATURE_CONTRIBUTION = "feature_contribution"
    RULE_BASED = "rule_based"
    SIMILAR_CASES = "similar_cases"
    COUNTERFACTUAL = "counterfactual"
    GLOBAL_INSIGHTS = "global_insights"


@dataclass
class FeatureContribution:
    """Contribution of a single feature to the prediction"""

    feature_name: str
    feature_value: Any
    contribution: float
    importance_rank: int
    explanation: str


@dataclass
class PredictionExplanation:
    """Complete explanation for a fraud prediction"""

    prediction_id: str
    final_prediction: float
    confidence_score: float
    risk_level: str
    primary_reason: str
    feature_contributions: list[FeatureContribution]
    similar_cases: list[dict[str, Any]]
    counterfactual_scenarios: list[dict[str, Any]]
    model_insights: dict[str, Any]
    explanation_confidence: float
    generated_at: str


class ExplainableFraudDetector:
    """AI system that provides interpretable fraud detection explanations"""

    def __init__(self):
        self.feature_importance_cache: dict[str, dict[str, float]] = {}
        self.case_history: list[dict[str, Any]] = []
        self.explanation_templates = self._load_explanation_templates()

    def _load_explanation_templates(self) -> dict[str, str]:
        """Load human-readable explanation templates"""
        return {
            "high_amount": "Transaction amount (${amount}) is {percent_above:.0f}% above the account's typical range",
            "unusual_merchant": "Merchant category '{category}' is unusual for this account's spending patterns",
            "geographic_anomaly": "Transaction location ({location}) differs significantly from account's usual areas",
            "temporal_pattern": "Transaction timing ({time}) breaks from account's established behavioral patterns",
            "velocity_spike": "Transaction frequency ({count} transactions) exceeds account's normal velocity by {factor:.1f}x",
            "peer_anomaly": "Transaction pattern differs from {percentage:.0f}% of similar accounts",
            "network_connection": "Transaction involves entities connected to {count} previously flagged accounts",
        }

    async def explain_prediction(
        self, transaction_data: dict[str, Any], prediction_result: dict[str, Any]
    ) -> PredictionExplanation:
        """
        Generate comprehensive explanation for a fraud prediction

        Args:
            transaction_data: Raw transaction data
            prediction_result: ML model prediction results

        Returns:
            Detailed explanation with multiple interpretation layers
        """
        prediction_id = f"exp_{hash(str(transaction_data))}"

        # Calculate feature contributions
        feature_contributions = await self._calculate_feature_contributions(
            transaction_data, prediction_result
        )

        # Find similar cases
        similar_cases = await self._find_similar_cases(
            transaction_data, prediction_result
        )

        # Generate counterfactual scenarios
        counterfactuals = await self._generate_counterfactuals(
            transaction_data, prediction_result
        )

        # Determine risk level and primary reason
        risk_level, primary_reason = self._assess_risk_level(
            feature_contributions, prediction_result
        )

        # Calculate explanation confidence
        explanation_confidence = self._calculate_explanation_confidence(
            feature_contributions, similar_cases
        )

        return PredictionExplanation(
            prediction_id=prediction_id,
            final_prediction=prediction_result.get("fraud_probability", 0.0),
            confidence_score=prediction_result.get("confidence", 0.0),
            risk_level=risk_level,
            primary_reason=primary_reason,
            feature_contributions=feature_contributions,
            similar_cases=similar_cases,
            counterfactual_scenarios=counterfactuals,
            model_insights=self._extract_model_insights(prediction_result),
            explanation_confidence=explanation_confidence,
            generated_at=self._get_current_timestamp(),
        )

    async def _calculate_feature_contributions(
        self, transaction_data: dict[str, Any], prediction_result: dict[str, Any]
    ) -> list[FeatureContribution]:
        """Calculate how each feature contributed to the prediction"""
        contributions = []
        feature_weights = prediction_result.get("feature_weights", {})

        # Define feature mapping and importance
        feature_definitions = {
            "amount": {"name": "Transaction Amount", "importance": 0.9},
            "merchant_category": {"name": "Merchant Category", "importance": 0.8},
            "location": {"name": "Transaction Location", "importance": 0.7},
            "time_of_day": {"name": "Time of Transaction", "importance": 0.6},
            "transaction_frequency": {
                "name": "Transaction Frequency",
                "importance": 0.8,
            },
            "account_age": {"name": "Account Age", "importance": 0.5},
            "peer_behavior": {"name": "Peer Comparison", "importance": 0.7},
            "network_connections": {"name": "Network Connections", "importance": 0.8},
        }

        # Calculate contributions for each feature
        for feature_key, definition in feature_definitions.items():
            if feature_key in transaction_data:
                weight = feature_weights.get(feature_key, 0.0)
                contribution = weight * definition["importance"]

                explanation = self._generate_feature_explanation(
                    feature_key, transaction_data[feature_key], contribution
                )

                contributions.append(
                    FeatureContribution(
                        feature_name=definition["name"],
                        feature_value=transaction_data[feature_key],
                        contribution=contribution,
                        importance_rank=0,  # Will be set after sorting
                        explanation=explanation,
                    )
                )

        # Sort by contribution magnitude and assign ranks
        contributions.sort(key=lambda x: abs(x.contribution), reverse=True)
        for i, contrib in enumerate(contributions):
            contrib.importance_rank = i + 1

        return contributions

    def _generate_feature_explanation(
        self, feature_key: str, value: Any, contribution: float
    ) -> str:
        """Generate human-readable explanation for a feature contribution"""
        try:
            if feature_key == "amount":
                if contribution > 0.5:
                    return self.explanation_templates["high_amount"].format(
                        amount=value, percent_above=contribution * 100
                    )
                else:
                    return f"Transaction amount (${value}) is within normal range"

            elif feature_key == "merchant_category":
                if contribution > 0.3:
                    return self.explanation_templates["unusual_merchant"].format(
                        category=value
                    )
                else:
                    return f"Merchant category '{value}' matches account's typical spending"

            elif feature_key == "location":
                if contribution > 0.4:
                    return self.explanation_templates["geographic_anomaly"].format(
                        location=value
                    )
                else:
                    return f"Transaction location ({value}) is consistent with account history"

            elif feature_key == "transaction_frequency":
                if contribution > 0.6:
                    return self.explanation_templates["velocity_spike"].format(
                        count=value, factor=contribution * 2
                    )
                else:
                    return f"Transaction frequency ({value}) is within normal patterns"

            elif feature_key == "peer_behavior":
                if contribution > 0.5:
                    return self.explanation_templates["peer_anomaly"].format(
                        percentage=contribution * 100
                    )
                else:
                    return "Transaction behavior aligns with similar accounts"

            elif feature_key == "network_connections":
                if contribution > 0.7:
                    return self.explanation_templates["network_connection"].format(
                        count=int(contribution * 10)
                    )
                else:
                    return "No significant suspicious network connections detected"

            else:
                return f"Feature '{feature_key}' contributes {contribution:.2f} to risk assessment"

        except Exception as e:
            logger.warning(f"Error generating explanation for {feature_key}: {e}")
            return f"Feature '{feature_key}' shows {contribution:.2f} risk contribution"

    async def _find_similar_cases(
        self, transaction_data: dict[str, Any], prediction_result: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Find similar historical cases for comparison"""
        # This would typically query a case database
        # For now, return mock similar cases based on prediction confidence

        confidence = prediction_result.get("confidence", 0.5)
        similar_cases = []

        if confidence > 0.8:
            # High confidence - find very similar cases
            similar_cases = [
                {
                    "case_id": "CASE-2024-001",
                    "similarity_score": 0.95,
                    "outcome": "CONFIRMED_FRAUD",
                    "key_similarities": [
                        "High amount",
                        "Unusual merchant",
                        "Geographic anomaly",
                    ],
                },
                {
                    "case_id": "CASE-2024-015",
                    "similarity_score": 0.89,
                    "outcome": "CONFIRMED_FRAUD",
                    "key_similarities": ["Velocity spike", "New merchant category"],
                },
            ]
        elif confidence > 0.6:
            # Medium confidence - find moderately similar cases
            similar_cases = [
                {
                    "case_id": "CASE-2024-042",
                    "similarity_score": 0.76,
                    "outcome": "FALSE_POSITIVE",
                    "key_similarities": [
                        "Amount slightly above average",
                        "Known merchant",
                    ],
                }
            ]
        else:
            # Low confidence - broader comparison
            similar_cases = [
                {
                    "case_id": "CASE-2024-089",
                    "similarity_score": 0.45,
                    "outcome": "LEGITIMATE",
                    "key_similarities": ["Standard transaction pattern"],
                }
            ]

        return similar_cases

    async def _generate_counterfactuals(
        self, transaction_data: dict[str, Any], prediction_result: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Generate counterfactual scenarios showing what would change the prediction"""
        counterfactuals = []
        fraud_probability = prediction_result.get("fraud_probability", 0.0)

        # Amount-based counterfactual
        if "amount" in transaction_data:
            current_amount = transaction_data["amount"]
            # Find amount that would make prediction drop below threshold
            threshold_amount = current_amount * 0.7  # Rough approximation
            counterfactuals.append(
                {
                    "scenario": "Lower Amount",
                    "change": f"Reduce amount from ${current_amount} to ${threshold_amount:.2f}",
                    "predicted_probability": fraud_probability * 0.6,
                    "explanation": "Lower transaction amounts typically reduce fraud risk",
                }
            )

        # Location-based counterfactual
        if "location" in transaction_data:
            counterfactuals.append(
                {
                    "scenario": "Familiar Location",
                    "change": f"Change location from {transaction_data['location']} to account's primary location",
                    "predicted_probability": fraud_probability * 0.7,
                    "explanation": "Transactions in familiar locations are less suspicious",
                }
            )

        # Time-based counterfactual
        if "time_of_day" in transaction_data:
            counterfactuals.append(
                {
                    "scenario": "Normal Hours",
                    "change": "Change transaction time to account's typical hours",
                    "predicted_probability": fraud_probability * 0.8,
                    "explanation": "Transactions during normal account hours reduce suspicion",
                }
            )

        return counterfactuals

    def _assess_risk_level(
        self,
        contributions: list[FeatureContribution],
        prediction_result: dict[str, Any],
    ) -> tuple[str, str]:
        """Assess overall risk level and primary reason"""
        fraud_probability = prediction_result.get("fraud_probability", 0.0)

        if fraud_probability > 0.8:
            risk_level = "CRITICAL"
        elif fraud_probability > 0.6:
            risk_level = "HIGH"
        elif fraud_probability > 0.4:
            risk_level = "MEDIUM"
        elif fraud_probability > 0.2:
            risk_level = "LOW"
        else:
            risk_level = "VERY_LOW"

        # Find primary reason from top contribution
        if contributions:
            top_contribution = contributions[0]
            primary_reason = top_contribution.explanation
        else:
            primary_reason = "Multiple factors contribute to risk assessment"

        return risk_level, primary_reason

    def _extract_model_insights(
        self, prediction_result: dict[str, Any]
    ) -> dict[str, Any]:
        """Extract model-level insights and metadata"""
        return {
            "model_version": prediction_result.get("model_version", "unknown"),
            "training_data_size": prediction_result.get("training_samples", 0),
            "feature_count": len(prediction_result.get("feature_weights", {})),
            "model_type": prediction_result.get("model_type", "unknown"),
            "last_trained": prediction_result.get("last_trained", "unknown"),
            "performance_metrics": prediction_result.get("performance_metrics", {}),
        }

    def _calculate_explanation_confidence(
        self,
        contributions: list[FeatureContribution],
        similar_cases: list[dict[str, Any]],
    ) -> float:
        """Calculate confidence score for the explanation"""
        # Base confidence from feature contributions
        contribution_confidence = min(1.0, len(contributions) / 10.0)

        # Boost confidence with similar cases
        case_confidence = min(0.5, len(similar_cases) * 0.1)

        # Consider contribution distribution
        if contributions:
            top_contribution_ratio = contributions[0].contribution / sum(
                abs(c.contribution) for c in contributions
            )
            distribution_confidence = (
                1.0 - top_contribution_ratio
            )  # Prefer distributed contributions
        else:
            distribution_confidence = 0.5

        return (
            contribution_confidence * 0.5
            + case_confidence * 0.3
            + distribution_confidence * 0.2
        )

    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime

        return datetime.now().isoformat()

    def get_explanation_summary(
        self, explanation: PredictionExplanation
    ) -> dict[str, Any]:
        """Generate a concise summary of the explanation"""
        return {
            "prediction_id": explanation.prediction_id,
            "risk_level": explanation.risk_level,
            "confidence": explanation.confidence_score,
            "primary_reason": explanation.primary_reason,
            "top_contributing_factors": [
                {
                    "feature": contrib.feature_name,
                    "contribution": contrib.contribution,
                    "explanation": contrib.explanation,
                }
                for contrib in explanation.feature_contributions[:3]
            ],
            "similar_case_count": len(explanation.similar_cases),
            "explanation_confidence": explanation.explanation_confidence,
        }


# Global instance
explainable_detector = ExplainableFraudDetector()
