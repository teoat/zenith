"""
Temporal Burst Detection Service

Detects structuring patterns and rapid transaction bursts that may indicate
money laundering or fraud.

Key Detection Patterns:
1. Burst Pattern: 10+ transactions in 48 hours from same entity
2. Structuring: Multiple transactions just below $10,000 reporting threshold
3. Velocity Anomaly: Sudden increase in transaction frequency
"""

import logging
import statistics
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class BurstAlert:
    """Represents a detected temporal burst pattern"""

    entity_id: str
    entity_name: str
    pattern_type: str  # 'burst', 'structuring', 'velocity'
    transaction_count: int
    total_amount: float
    time_window_hours: float
    confidence: float
    severity: str  # 'low', 'medium', 'high', 'critical'
    transactions: List[Dict[str, Any]]
    description: str
    detected_at: str


class TemporalBurstDetector:
    """
    Detects temporal burst patterns and structuring in transaction data.

    Thresholds are configurable via constructor parameters.
    """

    # Default thresholds
    DEFAULT_BURST_THRESHOLD = 10  # transactions
    DEFAULT_BURST_WINDOW_HOURS = 48
    DEFAULT_STRUCTURING_THRESHOLD = 10000  # USD
    DEFAULT_STRUCTURING_MARGIN = 0.15  # 15% below threshold
    DEFAULT_VELOCITY_MULTIPLIER = 3.0  # 3x normal rate

    def __init__(
        self,
        burst_threshold: int = DEFAULT_BURST_THRESHOLD,
        burst_window_hours: int = DEFAULT_BURST_WINDOW_HOURS,
        structuring_threshold: float = DEFAULT_STRUCTURING_THRESHOLD,
        structuring_margin: float = DEFAULT_STRUCTURING_MARGIN,
        velocity_multiplier: float = DEFAULT_VELOCITY_MULTIPLIER,
    ):
        self.burst_threshold = burst_threshold
        self.burst_window_hours = burst_window_hours
        self.structuring_threshold = structuring_threshold
        self.structuring_margin = structuring_margin
        self.velocity_multiplier = velocity_multiplier

    def analyze_transactions(
        self, transactions: List[Dict[str, Any]], case_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze transactions for temporal burst patterns.

        Args:
            transactions: List of transaction dictionaries with 'date', 'amount',
                          'customer_id' or 'account_id', and optional 'customer_name'
            case_id: Optional case ID for context

        Returns:
            Analysis results with detected patterns and confidence scores
        """
        if not transactions:
            return {
                "case_id": case_id,
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "transaction_count": 0,
                "alerts": [],
                "summary": {
                    "burst_patterns": 0,
                    "structuring_patterns": 0,
                    "velocity_anomalies": 0,
                    "overall_risk_score": 0.0,
                },
            }

        # Group transactions by entity
        entity_transactions = self._group_by_entity(transactions)

        all_alerts: List[BurstAlert] = []

        for entity_id, entity_txns in entity_transactions.items():
            # Sort by date
            sorted_txns = sorted(
                entity_txns, key=lambda x: self._parse_date(x.get("date", ""))
            )

            # Detect burst patterns
            burst_alerts = self._detect_burst_patterns(entity_id, sorted_txns)
            all_alerts.extend(burst_alerts)

            # Detect structuring patterns
            structuring_alerts = self._detect_structuring_patterns(
                entity_id, sorted_txns
            )
            all_alerts.extend(structuring_alerts)

            # Detect velocity anomalies
            velocity_alerts = self._detect_velocity_anomalies(entity_id, sorted_txns)
            all_alerts.extend(velocity_alerts)

        # Calculate overall risk score
        risk_score = self._calculate_risk_score(all_alerts)

        # Sort alerts by confidence (descending)
        all_alerts.sort(key=lambda x: x.confidence, reverse=True)

        return {
            "case_id": case_id,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
            "transaction_count": len(transactions),
            "alerts": [asdict(alert) for alert in all_alerts],
            "summary": {
                "burst_patterns": len(
                    [a for a in all_alerts if a.pattern_type == "burst"]
                ),
                "structuring_patterns": len(
                    [a for a in all_alerts if a.pattern_type == "structuring"]
                ),
                "velocity_anomalies": len(
                    [a for a in all_alerts if a.pattern_type == "velocity"]
                ),
                "overall_risk_score": risk_score,
                "highest_severity": self._get_highest_severity(all_alerts),
            },
        }

    def _group_by_entity(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Group transactions by entity (customer/account)"""
        grouped = defaultdict(list)

        for txn in transactions:
            entity_id = (
                txn.get("customer_id")
                or txn.get("account_id")
                or txn.get("entity_id")
                or "unknown"
            )
            grouped[entity_id].append(txn)

        return grouped

    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime"""
        if not date_str:
            return datetime.min.replace(tzinfo=timezone.utc)

        try:
            # Try ISO format
            if "T" in date_str:
                return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            # Try common date formats
            for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%m/%d/%Y"]:
                try:
                    return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
        except Exception:
            pass

        return datetime.min.replace(tzinfo=timezone.utc)

    def _detect_burst_patterns(
        self, entity_id: str, transactions: List[Dict[str, Any]]
    ) -> List[BurstAlert]:
        """Detect rapid transaction bursts"""
        alerts = []

        if len(transactions) < self.burst_threshold:
            return alerts

        window = timedelta(hours=self.burst_window_hours)

        # Pre-parse dates once
        txn_dates = []
        for txn in transactions:
            txn_dates.append(self._parse_date(txn.get("date", "")))

        # Sliding window analysis
        # Using O(N) approach with two pointers
        start_idx = 0

        # Iterate through transactions as the end of the window
        for end_idx in range(len(transactions)):
            current_time = txn_dates[end_idx]

            # Shrink window from the left if it exceeds duration
            while start_idx < end_idx and (current_time - txn_dates[start_idx]) > window:
                start_idx += 1

            # Check if current window size meets threshold
            current_window_size = end_idx - start_idx + 1
            if current_window_size >= self.burst_threshold:
                window_txns = transactions[start_idx : end_idx + 1]

                total_amount = sum(float(txn.get("amount", 0)) for txn in window_txns)
                entity_name = window_txns[0].get("customer_name", entity_id)

                # Calculate confidence based on how far above threshold
                excess_ratio = len(window_txns) / self.burst_threshold
                confidence = min(0.95, 0.6 + (excess_ratio - 1) * 0.2)

                # Determine severity
                severity = self._determine_severity(confidence, total_amount)

                alert = BurstAlert(
                    entity_id=entity_id,
                    entity_name=entity_name,
                    pattern_type="burst",
                    transaction_count=len(window_txns),
                    total_amount=total_amount,
                    time_window_hours=self.burst_window_hours,
                    confidence=round(confidence, 2),
                    severity=severity,
                    transactions=window_txns[:10],  # Limit to first 10
                    description=f"{len(window_txns)} transactions in {self.burst_window_hours} hours (threshold: {self.burst_threshold})",
                    detected_at=datetime.now(timezone.utc).isoformat(),
                )
                alerts.append(alert)
                break  # Avoid duplicate alerts for same entity

        return alerts

    def _detect_structuring_patterns(
        self, entity_id: str, transactions: List[Dict[str, Any]]
    ) -> List[BurstAlert]:
        """Detect structuring (transactions just below reporting threshold)"""
        alerts = []

        # Calculate structuring range
        lower_bound = self.structuring_threshold * (1 - self.structuring_margin)
        upper_bound = self.structuring_threshold

        # Find transactions in structuring range
        structuring_txns = [
            txn
            for txn in transactions
            if lower_bound <= float(txn.get("amount", 0)) < upper_bound
        ]

        # Need at least 3 structuring transactions to be suspicious
        if len(structuring_txns) >= 3:
            total_amount = sum(float(txn.get("amount", 0)) for txn in structuring_txns)
            entity_name = structuring_txns[0].get("customer_name", entity_id)

            # Higher confidence with more structuring transactions
            confidence = min(0.95, 0.5 + len(structuring_txns) * 0.1)

            # Calculate time span
            if len(structuring_txns) >= 2:
                dates = [
                    self._parse_date(txn.get("date", "")) for txn in structuring_txns
                ]
                time_span = (max(dates) - min(dates)).total_seconds() / 3600
            else:
                time_span = 0

            severity = self._determine_severity(confidence, total_amount)

            alert = BurstAlert(
                entity_id=entity_id,
                entity_name=entity_name,
                pattern_type="structuring",
                transaction_count=len(structuring_txns),
                total_amount=total_amount,
                time_window_hours=time_span,
                confidence=round(confidence, 2),
                severity=severity,
                transactions=structuring_txns[:10],
                description=f"{len(structuring_txns)} transactions between ${lower_bound:,.0f}-${upper_bound:,.0f} (potential structuring)",
                detected_at=datetime.now(timezone.utc).isoformat(),
            )
            alerts.append(alert)

        return alerts

    def _detect_velocity_anomalies(
        self, entity_id: str, transactions: List[Dict[str, Any]]
    ) -> List[BurstAlert]:
        """Detect sudden increases in transaction velocity"""
        alerts = []

        if len(transactions) < 10:  # Need enough data for baseline
            return alerts

        # Calculate transaction intervals
        dates = [self._parse_date(txn.get("date", "")) for txn in transactions]
        intervals = []

        for i in range(1, len(dates)):
            interval = (dates[i] - dates[i - 1]).total_seconds() / 3600  # hours
            if interval > 0:
                intervals.append(interval)

        if len(intervals) < 5:
            return alerts

        # Use first 70% as baseline
        baseline_count = int(len(intervals) * 0.7)
        baseline_intervals = intervals[:baseline_count]
        recent_intervals = intervals[baseline_count:]

        if not recent_intervals:
            return alerts

        try:
            baseline_avg = statistics.mean(baseline_intervals)
            recent_avg = statistics.mean(recent_intervals)

            # Detect if recent velocity is significantly higher (lower interval)
            if baseline_avg > 0 and recent_avg > 0:
                velocity_ratio = baseline_avg / recent_avg

                if velocity_ratio >= self.velocity_multiplier:
                    entity_name = transactions[0].get("customer_name", entity_id)
                    recent_txns = transactions[baseline_count:]
                    total_amount = sum(
                        float(txn.get("amount", 0)) for txn in recent_txns
                    )

                    confidence = min(
                        0.9, 0.5 + (velocity_ratio - self.velocity_multiplier) * 0.1
                    )
                    severity = self._determine_severity(confidence, total_amount)

                    # Calculate recent time window
                    recent_dates = dates[baseline_count:]
                    time_window = (
                        max(recent_dates) - min(recent_dates)
                    ).total_seconds() / 3600

                    alert = BurstAlert(
                        entity_id=entity_id,
                        entity_name=entity_name,
                        pattern_type="velocity",
                        transaction_count=len(recent_txns),
                        total_amount=total_amount,
                        time_window_hours=time_window,
                        confidence=round(confidence, 2),
                        severity=severity,
                        transactions=recent_txns[:10],
                        description=f"Transaction velocity increased {velocity_ratio:.1f}x above baseline",
                        detected_at=datetime.now(timezone.utc).isoformat(),
                    )
                    alerts.append(alert)

        except statistics.StatisticsError:
            pass  # Not enough data for statistics

        return alerts

    def _determine_severity(self, confidence: float, amount: float) -> str:
        """Determine alert severity based on confidence and amount"""
        if confidence >= 0.85 or amount >= 100000:
            return "critical"
        elif confidence >= 0.7 or amount >= 50000:
            return "high"
        elif confidence >= 0.5 or amount >= 20000:
            return "medium"
        return "low"

    def _calculate_risk_score(self, alerts: List[BurstAlert]) -> float:
        """Calculate overall risk score from alerts"""
        if not alerts:
            return 0.0

        severity_weights = {"critical": 1.0, "high": 0.75, "medium": 0.5, "low": 0.25}

        total_score = sum(
            alert.confidence * severity_weights.get(alert.severity, 0.25)
            for alert in alerts
        )

        # Normalize to 0-100 scale
        normalized = min(100, (total_score / len(alerts)) * 100)
        return round(normalized, 1)

    def _get_highest_severity(self, alerts: List[BurstAlert]) -> str:
        """Get the highest severity from alerts"""
        if not alerts:
            return "none"

        severity_order = ["critical", "high", "medium", "low"]
        for severity in severity_order:
            if any(a.severity == severity for a in alerts):
                return severity
        return "low"


# Global instance with default configuration
temporal_burst_detector = TemporalBurstDetector()
