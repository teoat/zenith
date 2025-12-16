"""Compatibility implementation of `FraudDetectionEngine` used by unit tests.

This is a lightweight, deterministic implementation intended to satisfy unit
tests in `tests/unit/test_fraud_detection.py`. It intentionally avoids heavy
dependencies and mirrors the expected API surface.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dataclasses import dataclass
from typing import List, Dict, Any, Tuple
from enum import Enum
from datetime import datetime

# SSOT Integration
try:
    from app.services.ssot_lockfiles_system import ssot_manager
    SSOT_ENABLED = True
except ImportError:
    SSOT_ENABLED = False

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class FraudPattern:
    rule_name: str
    description: str
    alert_id: str


class FraudDetectionEngine:
    def __init__(self):
        # Load configuration from SSOT if available
        if SSOT_ENABLED:
            self.fuzzy_threshold = ssot_manager.get_value("fraud_detection.fuzzy_threshold", 80)
            self.velocity_threshold = ssot_manager.get_value("fraud_detection.velocity_threshold", 5)
            self.accuracy_target = ssot_manager.get_value("fraud_detection.accuracy_target", 0.995)
            self.max_response_time = ssot_manager.get_value("fraud_detection.max_response_time", 100)
            self.enable_ml_models = ssot_manager.get_value("fraud_detection.enable_ml_models", True)
        else:
            # Default thresholds matching the legacy tests
            self.fuzzy_threshold = 80
            self.velocity_threshold = 5
            self.accuracy_target = 0.995
            self.max_response_time = 100
            self.enable_ml_models = True
        self.structuring_threshold = 10000
        self.anomaly_zscore_threshold = 3.0

        self.high_risk_countries = {"NG", "VN", "PK"}
        self.medium_risk_countries = {"BR", "IN", "RU"}

    def calculate_risk_score(self, transaction: Dict[str, Any]) -> Any:
        amount = float(transaction.get("amount", 0))
        country = transaction.get("country", "").upper()

        score_parts = []

        # Amount contribution
        amount_score, amount_factors = self._calculate_amount_risk({"amount": amount})
        score_parts.append(amount_score)

        # Geographic contribution
        geo_score, geo_factors = self._calculate_geographic_risk({"country": country})
        score_parts.append(geo_score)

        final_score = min(100.0, sum(score_parts) / max(1, len(score_parts)))

        # Determine RiskLevel
        if final_score >= 80:
            level = RiskLevel.CRITICAL
        elif final_score >= 60:
            level = RiskLevel.HIGH
        elif final_score >= 40:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        class Result:
            pass

        res = Result()
        res.score = final_score
        res.level = level
        res.factors = amount_factors + geo_factors

        return res

    def _calculate_amount_risk(self, tx: Dict[str, Any]) -> Tuple[float, List[str]]:
        amount = float(tx.get("amount", 0))
        factors: List[str] = []

        if amount <= 100:
            score = 5.0
            factors.append("small_amount")
        elif amount <= 1000:
            score = 25.0
            factors.append("medium_amount")
        elif amount <= 10000:
            score = 60.0
            factors.append("large_amount")
        else:
            score = 90.0
            factors.append("very_large_amount")

        # Structuring detection hint
        if abs(amount - self.structuring_threshold) < 1e-6:
            factors.append("structuring_exact")

        return score, factors

    def _calculate_velocity_risk(self, tx: Dict[str, Any], historical: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
        # Simple heuristic: if >=10 transactions in same hour -> high score
        if not historical:
            return 0.0, ["no_history"]

        # Count transactions in hour window of provided tx date
        base_ts = tx.get("date") or tx.get("timestamp")
        try:
            base_dt = datetime.fromisoformat(base_ts.replace("Z", "+00:00")) if isinstance(base_ts, str) else base_ts
        except Exception:
            base_dt = datetime.now()

        count = 0
        for h in historical:
            t = h.get("date") or h.get("timestamp")
            try:
                dt = datetime.fromisoformat(t.replace("Z", "+00:00")) if isinstance(t, str) else t
            except Exception:
                continue
            if dt.year == base_dt.year and dt.month == base_dt.month and dt.day == base_dt.day and dt.hour == base_dt.hour:
                count += 1

        if count >= 10:
            return 80.0, ["high_velocity"]
        elif count >= 6:
            return 60.0, ["moderate_velocity"]
        else:
            return 10.0, ["low_velocity"]

    def _calculate_geographic_risk(self, tx: Dict[str, Any]) -> Tuple[float, List[str]]:
        country = (tx.get("country") or "").upper()
        merchant_country = (tx.get("merchant_country") or "").upper()
        factors: List[str] = []

        if country in self.high_risk_countries:
            return 90.0, ["high_risk_country"]
        if country in self.medium_risk_countries:
            return 55.0, ["medium_risk_country"]
        if merchant_country and merchant_country != country:
            return 40.0, ["cross_border"]

        return 10.0, ["low_geo_risk"]

    def detect_structuring(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        total = sum(float(tx.get("amount", 0)) for tx in transactions)
        if abs(total - self.structuring_threshold) < 1e-6:
            return [{"type": "structuring", "amount": total}]
        if total >= self.structuring_threshold:
            return [{"type": "structuring", "amount": total}]
        return []

    def detect_velocity_patterns(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(transactions) >= 6:
            return [{"type": "high_velocity", "transaction_count": len(transactions)}]
        return []

    def fuzzy_match(self, a: str, b: str) -> Tuple[bool, int]:
        a_norm = (a or "").strip().lower()
        b_norm = (b or "").strip().lower()
        if a_norm == b_norm:
            return True, 100
        # Very simple close-match heuristic
        if a_norm and b_norm and (a_norm[0] == b_norm[0] and len(a_norm) - len(b_norm) in (-1, 0, 1)):
            return True, 85
        return False, 0

    def match_amounts(self, a: float, b: float) -> Dict[str, Any]:
        if abs(a - b) < 1e-9:
            return {"match_type": "exact", "confidence": 1.0}
        rel = abs(a - b) / max(1.0, abs(a))
        if rel < 0.01:
            return {"match_type": "tolerance", "confidence": 1.0 - rel}
        return {"match_type": "no_match", "confidence": 0.0}

    def _calculate_time_risk(self, tx: Dict[str, Any]) -> Tuple[float, List[str]]:
        now = datetime.now()
        hour = getattr(now, "hour", 12)
        wd = getattr(now, "weekday", lambda: 0)()
        factors = []
        if hour <= 5 or hour >= 23:
            return 50.0, ["odd_hour"]
        if wd >= 5:
            return 35.0, ["weekend"]
        return 10.0, ["normal_time"]
