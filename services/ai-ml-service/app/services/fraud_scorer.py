"""
Predictive Fraud Scoring Service
ML-based fraud risk assessment for Zenith platform
"""

import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import structlog
from dataclasses import dataclass

logger = structlog.get_logger()


@dataclass
class TransactionFeatures:
    """Features extracted from transaction data for ML scoring"""

    amount: float
    amount_log: float
    time_of_day: int
    day_of_week: int
    is_weekend: bool
    merchant_category_risk: float
    transaction_velocity: int  # transactions in last hour
    amount_velocity: float  # total amount in last hour
    location_anomaly: bool  # unusual location for user
    device_fingerprint_risk: float
    ip_reputation_score: float
    user_behavior_score: float


@dataclass
class FraudPrediction:
    """Fraud prediction result"""

    fraud_probability: float
    risk_score: float  # 0-100 scale
    confidence: float
    flags: List[str]
    model_version: str
    features_used: List[str]


class PredictiveFraudScorer:
    """ML-based predictive fraud scoring system"""

    def __init__(self):
        self.model_version = "1.0.0"
        # In production, load trained model weights
        self.model_weights = self._load_model_weights()
        self.feature_importance = self._get_feature_importance()

    def _load_model_weights(self) -> Dict[str, float]:
        """Load trained model weights (simplified for demo)"""
        # In production, load from MLflow or similar
        return {
            "amount_log": 0.3,
            "time_of_day": 0.1,
            "merchant_category_risk": 0.25,
            "transaction_velocity": 0.15,
            "location_anomaly": 0.4,
            "device_fingerprint_risk": 0.2,
            "ip_reputation_score": 0.35,
            "user_behavior_score": 0.3,
        }

    def _get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        return {
            "location_anomaly": 0.4,
            "ip_reputation_score": 0.35,
            "amount_log": 0.3,
            "user_behavior_score": 0.3,
            "device_fingerprint_risk": 0.2,
            "merchant_category_risk": 0.25,
            "transaction_velocity": 0.15,
            "time_of_day": 0.1,
        }

    def extract_features(
        self, transaction: Dict[str, Any], user_history: List[Dict[str, Any]]
    ) -> TransactionFeatures:
        """Extract features from transaction and user history"""
        amount = float(transaction.get("amount", 0))
        timestamp = transaction.get("timestamp", datetime.now())

        # Basic features
        amount_log = np.log1p(amount) if amount > 0 else 0

        if isinstance(timestamp, str):
            dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        else:
            dt = timestamp

        time_of_day = dt.hour
        day_of_week = dt.weekday()
        is_weekend = day_of_week >= 5

        # Merchant category risk (simplified)
        merchant_category = transaction.get("merchant_category", "unknown")
        merchant_category_risk = self._get_merchant_risk_score(merchant_category)

        # Velocity features
        recent_transactions = self._get_recent_transactions(user_history, dt, hours=1)
        transaction_velocity = len(recent_transactions)
        amount_velocity = sum(float(tx.get("amount", 0)) for tx in recent_transactions)

        # Location anomaly
        current_location = transaction.get("location", {})
        location_anomaly = self._check_location_anomaly(current_location, user_history)

        # Device and IP risk
        device_fingerprint = transaction.get("device_fingerprint", "")
        device_fingerprint_risk = self._calculate_device_risk(
            device_fingerprint, user_history
        )

        ip_address = transaction.get("ip_address", "")
        ip_reputation_score = self._get_ip_reputation(ip_address)

        # User behavior score
        user_behavior_score = self._calculate_user_behavior_score(
            user_history, transaction
        )

        return TransactionFeatures(
            amount=amount,
            amount_log=amount_log,
            time_of_day=time_of_day,
            day_of_week=day_of_week,
            is_weekend=is_weekend,
            merchant_category_risk=merchant_category_risk,
            transaction_velocity=transaction_velocity,
            amount_velocity=amount_velocity,
            location_anomaly=location_anomaly,
            device_fingerprint_risk=device_fingerprint_risk,
            ip_reputation_score=ip_reputation_score,
            user_behavior_score=user_behavior_score,
        )

    def predict_fraud(
        self, transaction: Dict[str, Any], user_history: List[Dict[str, Any]]
    ) -> FraudPrediction:
        """Predict fraud probability for a transaction"""
        try:
            features = self.extract_features(transaction, user_history)

            # Calculate weighted risk score
            risk_score = self._calculate_risk_score(features)

            # Convert to probability using sigmoid
            fraud_probability = 1 / (1 + np.exp(-risk_score))

            # Determine confidence based on feature completeness
            confidence = self._calculate_confidence(features)

            # Generate risk flags
            flags = self._generate_risk_flags(features, risk_score)

            # Feature names used
            features_used = [
                "amount",
                "time_of_day",
                "merchant_category_risk",
                "transaction_velocity",
                "location_anomaly",
                "device_fingerprint_risk",
                "ip_reputation_score",
                "user_behavior_score",
            ]

            return FraudPrediction(
                fraud_probability=round(float(fraud_probability), 4),
                risk_score=round(float(risk_score * 25), 2),  # Scale to 0-100
                confidence=round(float(confidence), 4),
                flags=flags,
                model_version=self.model_version,
                features_used=features_used,
            )

        except Exception as e:
            logger.error(
                "Fraud prediction failed",
                error=str(e),
                transaction_id=transaction.get("id"),
            )
            # Return safe default
            return FraudPrediction(
                fraud_probability=0.5,
                risk_score=50.0,
                confidence=0.0,
                flags=["prediction_error"],
                model_version=self.model_version,
                features_used=[],
            )

    def _calculate_risk_score(self, features: TransactionFeatures) -> float:
        """Calculate weighted risk score"""
        score = 0.0

        # Apply model weights
        score += features.amount_log * self.model_weights.get("amount_log", 0.3)
        score += (
            features.time_of_day * self.model_weights.get("time_of_day", 0.1) / 24
        )  # Normalize
        score += features.merchant_category_risk * self.model_weights.get(
            "merchant_category_risk", 0.25
        )
        score += min(features.transaction_velocity / 10, 1.0) * self.model_weights.get(
            "transaction_velocity", 0.15
        )
        score += (1.0 if features.location_anomaly else 0.0) * self.model_weights.get(
            "location_anomaly", 0.4
        )
        score += features.device_fingerprint_risk * self.model_weights.get(
            "device_fingerprint_risk", 0.2
        )
        score += features.ip_reputation_score * self.model_weights.get(
            "ip_reputation_score", 0.35
        )
        score += features.user_behavior_score * self.model_weights.get(
            "user_behavior_score", 0.3
        )

        # Add weekend risk
        if features.is_weekend:
            score += 0.2

        return score

    def _calculate_confidence(self, features: TransactionFeatures) -> float:
        """Calculate prediction confidence based on feature completeness"""
        confidence_factors = []

        # Check if we have sufficient historical data
        if features.transaction_velocity > 0:
            confidence_factors.append(0.8)
        else:
            confidence_factors.append(0.4)

        # Check location data
        if not features.location_anomaly:  # If we can determine normal behavior
            confidence_factors.append(0.9)
        else:
            confidence_factors.append(0.6)

        # Check device/IP data completeness
        if features.device_fingerprint_risk < 0.5:
            confidence_factors.append(0.7)
        else:
            confidence_factors.append(0.5)

        return np.mean(confidence_factors)

    def _generate_risk_flags(
        self, features: TransactionFeatures, risk_score: float
    ) -> List[str]:
        """Generate human-readable risk flags"""
        flags = []

        if features.location_anomaly:
            flags.append("unusual_location")

        if features.transaction_velocity > 5:
            flags.append("high_transaction_frequency")

        if features.amount_velocity > 1000:
            flags.append("high_amount_velocity")

        if features.ip_reputation_score > 0.7:
            flags.append("suspicious_ip")

        if features.device_fingerprint_risk > 0.8:
            flags.append("unusual_device")

        if features.merchant_category_risk > 0.7:
            flags.append("high_risk_merchant")

        if features.is_weekend and features.time_of_day < 6:
            flags.append("unusual_timing")

        if risk_score > 1.5:
            flags.append("high_risk_transaction")

        return flags if flags else ["low_risk"]

    # Helper methods (simplified implementations)
    def _get_merchant_risk_score(self, category: str) -> float:
        """Get risk score for merchant category"""
        high_risk_categories = ["gambling", "money_transfer", "cryptocurrency"]
        medium_risk_categories = ["online_shopping", "digital_goods"]

        if category.lower() in high_risk_categories:
            return 0.8
        elif category.lower() in medium_risk_categories:
            return 0.5
        else:
            return 0.2

    def _get_recent_transactions(
        self, history: List[Dict[str, Any]], current_time: datetime, hours: int
    ) -> List[Dict[str, Any]]:
        """Get transactions within time window"""
        cutoff = current_time - timedelta(hours=hours)
        return [
            tx
            for tx in history
            if datetime.fromisoformat(
                tx.get("timestamp", "2020-01-01").replace("Z", "+00:00")
            )
            > cutoff
        ]

    def _check_location_anomaly(
        self, current_location: Dict[str, Any], history: List[Dict[str, Any]]
    ) -> bool:
        """Check if current location is anomalous"""
        if not history:
            return False

        # Simple distance-based check (simplified)
        current_lat = current_location.get("latitude")
        current_lng = current_location.get("longitude")

        if not current_lat or not current_lng:
            return True  # Can't verify

        # Check if within 100km of any historical transaction
        for tx in history[-10:]:  # Check last 10 transactions
            tx_location = tx.get("location", {})
            tx_lat = tx_location.get("latitude")
            tx_lng = tx_location.get("longitude")

            if tx_lat and tx_lng:
                distance = self._calculate_distance(
                    current_lat, current_lng, tx_lat, tx_lng
                )
                if distance < 100:  # Within 100km
                    return False

        return True  # Anomalous

    def _calculate_device_risk(
        self, fingerprint: str, history: List[Dict[str, Any]]
    ) -> float:
        """Calculate device fingerprint risk"""
        if not fingerprint or not history:
            return 0.5

        # Check if device has been used before
        known_devices = set(tx.get("device_fingerprint", "") for tx in history)
        return 0.1 if fingerprint in known_devices else 0.8

    def _get_ip_reputation(self, ip: str) -> float:
        """Get IP reputation score (0-1, higher = more suspicious)"""
        if not ip:
            return 0.5

        # Simplified IP reputation check
        # In production, integrate with services like MaxMind, IPQualityScore, etc.
        suspicious_patterns = ["192.168.", "10.", "172.16."]
        if any(ip.startswith(pattern) for pattern in suspicious_patterns):
            return 0.9  # Private IPs might be suspicious for online transactions

        return 0.1  # Default low risk

    def _calculate_user_behavior_score(
        self, history: List[Dict[str, Any]], transaction: Dict[str, Any]
    ) -> float:
        """Calculate user behavior score based on historical patterns"""
        if not history:
            return 0.5

        amount = float(transaction.get("amount", 0))

        # Calculate average transaction amount
        amounts = [float(tx.get("amount", 0)) for tx in history]
        avg_amount = np.mean(amounts) if amounts else 0
        std_amount = np.std(amounts) if amounts else 1

        # Check if amount deviates significantly from normal
        if std_amount > 0:
            z_score = abs(amount - avg_amount) / std_amount
            if z_score > 2:  # More than 2 standard deviations
                return 0.8  # High risk

        return 0.2  # Normal behavior

    def _calculate_distance(
        self, lat1: float, lng1: float, lat2: float, lng2: float
    ) -> float:
        """Calculate distance between two points in kilometers"""
        from math import radians, sin, cos, sqrt, atan2

        R = 6371  # Earth's radius in kilometers

        lat1_rad, lng1_rad = radians(lat1), radians(lng1)
        lat2_rad, lng2_rad = radians(lat2), radians(lng2)

        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad

        a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlng / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c
