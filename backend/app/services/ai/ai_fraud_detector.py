import logging
import os
from datetime import datetime, timedelta
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class AIFraudDetector:
    def __init__(self, model_path: str = "models/isolation_forest.pkl"):
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.feature_names = [
            "amount",
            "hour_of_day",
            "day_of_week",
            "is_weekend",
            "amount_zscore",
            "velocity_ratio",
            "merchant_frequency",
            "category_risk",
            "geographic_risk",
            "time_anomaly",
        ]

        # Ensure models directory exists
        os.makedirs(os.path.dirname(model_path), exist_ok=True)

        # Try to load existing model
        self._load_model()

    def _load_model(self):
        """Load trained model if it exists"""
        try:
            if os.path.exists(self.model_path):
                model_data = joblib.load(self.model_path)
                self.model = model_data["model"]
                self.scaler = model_data["scaler"]
                self.is_trained = True
                logger.info("Loaded existing AI fraud detection model")
            else:
                logger.info("No existing model found, will need training")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.is_trained = False

    def _extract_features(
        self,
        transaction: dict[str, Any],
        historical_data: list[dict[str, Any]] | None = None,
    ) -> np.ndarray:
        """Extract features for AI analysis"""
        amount = float(transaction.get("amount", 0))
        timestamp = transaction.get("timestamp") or transaction.get("date")

        # Parse timestamp
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            except Exception as e:
                logger.warning(f"Failed to parse timestamp: {e}")
                timestamp = datetime.now()
        elif not isinstance(timestamp, datetime):
            timestamp = datetime.now()

        # Basic temporal features
        hour_of_day = timestamp.hour
        day_of_week = timestamp.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0

        # Historical analysis
        amount_zscore = 0.0
        velocity_ratio = 0.0
        merchant_frequency = 0.0

        if historical_data:
            # Amount statistics
            amounts = [float(tx.get("amount", 0)) for tx in historical_data]
            if amounts:
                mean_amount = np.mean(amounts)
                std_amount = np.std(amounts) or 1.0
                amount_zscore = (amount - mean_amount) / std_amount

            # Velocity analysis (transactions in last 24 hours)
            recent_cutoff = timestamp - timedelta(hours=24)
            recent_count = sum(1 for tx in historical_data if self._parse_timestamp(tx.get("timestamp") or tx.get("date")) >= recent_cutoff)
            velocity_ratio = recent_count / max(1, len(historical_data))

            # Merchant frequency
            merchant = transaction.get("merchant_name", "")
            if merchant:
                merchant_count = sum(1 for tx in historical_data if tx.get("merchant_name", "") == merchant)
                merchant_frequency = merchant_count / max(1, len(historical_data))

        # Category risk (simplified)
        category = transaction.get("category", "").lower()
        category_risk = 0.0
        if "cash" in category or "wire" in category:
            category_risk = 0.8
        elif "gambling" in category or "crypto" in category:
            category_risk = 0.6

        # Geographic risk
        country = transaction.get("country", "").upper()
        geographic_risk = 0.0
        high_risk_countries = {
            "NG",
            "VN",
            "PK",
            "BD",
            "KE",
            "GH",
            "SN",
            "MA",
            "TN",
            "DZ",
        }
        if country in high_risk_countries:
            geographic_risk = 0.9

        # Time anomaly (unusual hours)
        time_anomaly = 0.0
        if hour_of_day < 6 or hour_of_day > 22:
            time_anomaly = 0.7

        features = np.array(
            [
                amount,
                hour_of_day,
                day_of_week,
                is_weekend,
                amount_zscore,
                velocity_ratio,
                merchant_frequency,
                category_risk,
                geographic_risk,
                time_anomaly,
            ]
        ).reshape(1, -1)

        return features

    def _parse_timestamp(self, timestamp) -> datetime:
        """Parse timestamp safely"""
        if isinstance(timestamp, datetime):
            return timestamp
        if isinstance(timestamp, str):
            try:
                return datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            except Exception as e:
                logger.warning(f"Failed to parse timestamp in _parse_timestamp: {e}")
                pass
        return datetime.now()

    def train_model(self, training_data: list[dict[str, Any]], contamination: float = 0.1) -> dict[str, Any]:
        """Train the Isolation Forest model"""
        logger.info(f"Training AI model with {len(training_data)} transactions")

        # Extract features from all transactions
        feature_matrix = []
        for tx in training_data:
            features = self._extract_features(tx, training_data)
            feature_matrix.append(features[0])

        X = np.array(feature_matrix)

        # Handle missing values
        X = np.nan_to_num(X, nan=0.0)

        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Train Isolation Forest
        self.model = IsolationForest(n_estimators=100, contamination=contamination, random_state=42, n_jobs=-1)

        # Fit the model
        self.model.fit(X_scaled)

        # Save the model
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "trained_at": datetime.now().isoformat(),
            "training_samples": len(training_data),
        }

        joblib.dump(model_data, self.model_path)
        self.is_trained = True

        logger.info("AI model training completed")

        return {
            "status": "success",
            "training_samples": len(training_data),
            "contamination": contamination,
            "feature_count": len(self.feature_names),
        }

    def predict_fraud_score(
        self,
        transaction: dict[str, Any],
        historical_data: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Predict fraud score for a transaction"""
        if not self.is_trained:
            return {
                "score": 50.0,  # Neutral score when no model
                "confidence": 0.0,
                "is_fraud": False,
                "explanation": "Model not trained",
            }

        try:
            # Extract features
            features = self._extract_features(transaction, historical_data)
            features_scaled = self.scaler.transform(features)

            # Get anomaly score (-1 to 1, where -1 is most anomalous)
            anomaly_score = self.model.decision_function(features_scaled)[0]

            # Convert to fraud score (0-100, higher = more fraudulent)
            # Isolation Forest: -1 (anomaly) to 1 (normal)
            # Convert to 0-100 scale where 100 is most fraudulent
            fraud_score = (1 - anomaly_score) * 50  # Scale to 0-100

            # Prediction (-1 = anomaly, 1 = normal)
            prediction = self.model.predict(features_scaled)[0]
            is_fraud = prediction == -1

            # Calculate confidence based on distance from decision boundary
            confidence = min(1.0, abs(anomaly_score) * 2)

            # Generate explanation
            explanation = self._generate_explanation(features[0], fraud_score)

            return {
                "score": round(fraud_score, 2),
                "confidence": round(confidence, 2),
                "is_fraud": is_fraud,
                "explanation": explanation,
                "anomaly_score": round(anomaly_score, 4),
            }

        except Exception as e:
            logger.error(f"AI prediction failed: {e}")
            return {
                "score": 50.0,
                "confidence": 0.0,
                "is_fraud": False,
                "explanation": f"Prediction error: {e!s}",
            }

    def _generate_explanation(self, features: np.ndarray, score: float) -> str:
        """Generate human-readable explanation for the prediction"""
        explanations = []

        feature_values = dict(zip(self.feature_names, features))

        if score > 70:
            explanations.append("High fraud probability detected")
        elif score > 40:
            explanations.append("Moderate fraud risk")
        else:
            explanations.append("Low fraud risk")

        # Feature-specific explanations
        if feature_values["amount_zscore"] > 2:
            explanations.append("Transaction amount significantly deviates from historical pattern")

        if feature_values["velocity_ratio"] > 0.5:
            explanations.append("High transaction velocity compared to historical activity")

        if feature_values["merchant_frequency"] < 0.1:
            explanations.append("First-time merchant interaction")

        if feature_values["geographic_risk"] > 0.5:
            explanations.append("Transaction involves high-risk geographic location")

        if feature_values["time_anomaly"] > 0.5:
            explanations.append("Transaction occurred during unusual hours")

        if feature_values["category_risk"] > 0.5:
            explanations.append("Transaction category associated with higher risk")

        return "; ".join(explanations)

    def get_model_info(self) -> dict[str, Any]:
        """Get information about the trained model"""
        if not self.is_trained:
            return {"status": "not_trained"}

        return {
            "status": "trained",
            "feature_count": len(self.feature_names),
            "features": self.feature_names,
            "model_type": "IsolationForest",
            "is_trained": self.is_trained,
        }

    def retrain_model(self, new_data: list[dict[str, Any]]) -> dict[str, Any]:
        """Retrain the model with new data"""
        # In a real implementation, you'd combine with existing training data
        # For simplicity, we'll retrain with the new data
        return self.train_model(new_data)
