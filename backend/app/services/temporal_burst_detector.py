"""
Temporal Burst Detector - Real Implementation
Detects suspicious transaction patterns including:
- Burst patterns (rapid transaction sequences)
- Structuring patterns (amounts below reporting thresholds)
- Velocity anomalies (unusual transaction frequencies)
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean, stdev
from typing import Any

logger = logging.getLogger(__name__)

# Configuration constants
DEFAULT_BURST_THRESHOLD = 10  # Minimum transactions to trigger burst detection
DEFAULT_BURST_WINDOW_HOURS = 48
DEFAULT_STRUCTURING_THRESHOLD = 10000  # Common reporting threshold (e.g., $10,000)
DEFAULT_STRUCTURING_TOLERANCE = 0.15  # 15% below threshold
VELOCITY_ANOMALY_STDEV_MULTIPLIER = 2.5


class TemporalBurstDetector:
    """
    Real Temporal Burst Detector for AML/Fraud Detection.
    Implements sliding window analysis for pattern detection.
    """

    def __init__(
        self,
        burst_threshold: int = DEFAULT_BURST_THRESHOLD,
        burst_window_hours: int = DEFAULT_BURST_WINDOW_HOURS,
        structuring_threshold: float = DEFAULT_STRUCTURING_THRESHOLD,
        structuring_tolerance: float = DEFAULT_STRUCTURING_TOLERANCE,
    ):
        self.burst_threshold = burst_threshold
        self.burst_window_hours = burst_window_hours
        self.structuring_threshold = structuring_threshold
        self.structuring_tolerance = structuring_tolerance
        self.structuring_lower_bound = structuring_threshold * (
            1 - structuring_tolerance
        )

    def analyze_transactions(
        self, transactions: list[dict[str, Any]], case_id: str | None = None
    ) -> dict[str, Any]:
        """
        Analyze a list of transactions for temporal patterns.

        Args:
            transactions: List of transaction dicts with 'date', 'amount', 'customer_id'
            case_id: Optional case ID for logging

        Returns:
            Analysis results with alerts and summary
        """
        if not transactions:
            return self._empty_result()

        logger.info(
            f"Analyzing {len(transactions)} transactions for case {case_id or 'unknown'}"
        )

        alerts = []

        # Parse and sort transactions by date
        parsed_txns = self._parse_transactions(transactions)
        if not parsed_txns:
            return self._empty_result()

        # Detect burst patterns
        burst_alerts = self._detect_bursts(parsed_txns)
        alerts.extend(burst_alerts)

        # Detect structuring patterns
        structuring_alerts = self._detect_structuring(parsed_txns)
        alerts.extend(structuring_alerts)

        # Detect velocity anomalies
        velocity_alerts = self._detect_velocity_anomalies(parsed_txns)
        alerts.extend(velocity_alerts)

        # Calculate risk score
        risk_score = self._calculate_risk_score(alerts, len(transactions))

        return {
            "alerts": alerts,
            "summary": {
                "overall_risk_score": risk_score,
                "burst_patterns": len(burst_alerts),
                "structuring_patterns": len(structuring_alerts),
                "velocity_anomalies": len(velocity_alerts),
                "transactions_analyzed": len(transactions),
                "analysis_timestamp": datetime.now().isoformat(),
            },
            "case_id": case_id,
        }

    def _parse_transactions(
        self, transactions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Parse and validate transaction data."""
        parsed = []
        for txn in transactions:
            try:
                date_value = (
                    txn.get("date") or txn.get("timestamp") or txn.get("created_at")
                )
                if isinstance(date_value, str):
                    # Try multiple date formats
                    for fmt in [
                        "%Y-%m-%dT%H:%M:%S",
                        "%Y-%m-%dT%H:%M:%SZ",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%d",
                    ]:
                        try:
                            date_value = datetime.strptime(
                                date_value.split(".")[0].replace("Z", ""),
                                fmt.replace("Z", ""),
                            )
                            break
                        except ValueError:
                            continue
                    else:
                        date_value = datetime.now()
                elif not isinstance(date_value, datetime):
                    date_value = datetime.now()

                parsed.append(
                    {
                        "id": txn.get("id", str(len(parsed))),
                        "date": date_value,
                        "amount": float(txn.get("amount", 0)),
                        "customer_id": txn.get("customer_id", "unknown"),
                        "type": txn.get("type", "unknown"),
                        "original": txn,
                    }
                )
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse transaction: {e}")
                continue

        return sorted(parsed, key=lambda x: x["date"])

    def _detect_bursts(
        self, transactions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Detect burst patterns using sliding window analysis."""
        alerts = []
        window = timedelta(hours=self.burst_window_hours)

        # Group by customer
        by_customer = defaultdict(list)
        for txn in transactions:
            by_customer[txn["customer_id"]].append(txn)

        for customer_id, customer_txns in by_customer.items():
            if len(customer_txns) < self.burst_threshold:
                continue

            # Sliding window analysis
            for i, txn in enumerate(customer_txns):
                window_end = txn["date"] + window
                window_txns = [t for t in customer_txns[i:] if t["date"] <= window_end]

                if len(window_txns) >= self.burst_threshold:
                    total_amount = sum(t["amount"] for t in window_txns)
                    alerts.append(
                        {
                            "type": "BURST_PATTERN",
                            "severity": "HIGH"
                            if len(window_txns) >= self.burst_threshold * 1.5
                            else "MEDIUM",
                            "customer_id": customer_id,
                            "transaction_count": len(window_txns),
                            "total_amount": round(total_amount, 2),
                            "window_start": txn["date"].isoformat(),
                            "window_end": window_end.isoformat(),
                            "description": f"{len(window_txns)} transactions within {self.burst_window_hours}h window",
                            "transaction_ids": [
                                t["id"] for t in window_txns[:10]
                            ],  # First 10
                        }
                    )
                    break  # One alert per customer per burst

        return alerts

    def _detect_structuring(
        self, transactions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Detect potential structuring (smurfing) patterns."""
        alerts = []

        # Group by customer
        by_customer = defaultdict(list)
        for txn in transactions:
            by_customer[txn["customer_id"]].append(txn)

        for customer_id, customer_txns in by_customer.items():
            # Find transactions just below threshold
            suspicious = [
                t
                for t in customer_txns
                if self.structuring_lower_bound
                <= t["amount"]
                < self.structuring_threshold
            ]

            if len(suspicious) >= 3:  # At least 3 suspicious transactions
                total = sum(t["amount"] for t in suspicious)
                avg_amount = mean(t["amount"] for t in suspicious)

                # Calculate how close to threshold on average
                avg_distance = mean(
                    (self.structuring_threshold - t["amount"])
                    / self.structuring_threshold
                    for t in suspicious
                )

                severity = "HIGH" if avg_distance < 0.05 else "MEDIUM"

                alerts.append(
                    {
                        "type": "STRUCTURING_PATTERN",
                        "severity": severity,
                        "customer_id": customer_id,
                        "suspicious_count": len(suspicious),
                        "total_amount": round(total, 2),
                        "average_amount": round(avg_amount, 2),
                        "threshold": self.structuring_threshold,
                        "avg_distance_from_threshold": f"{avg_distance * 100:.1f}%",
                        "description": f"{len(suspicious)} transactions averaging ${avg_amount:.2f}, just below ${self.structuring_threshold} threshold",
                        "transaction_ids": [t["id"] for t in suspicious[:10]],
                    }
                )

        return alerts

    def _detect_velocity_anomalies(
        self, transactions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Detect unusual transaction velocity using statistical analysis."""
        alerts = []

        if len(transactions) < 5:
            return alerts

        # Group by customer
        by_customer = defaultdict(list)
        for txn in transactions:
            by_customer[txn["customer_id"]].append(txn)

        for customer_id, customer_txns in by_customer.items():
            if len(customer_txns) < 5:
                continue

            # Calculate daily transaction counts
            daily_counts = defaultdict(int)
            for txn in customer_txns:
                day = txn["date"].date()
                daily_counts[day] += 1

            counts = list(daily_counts.values())
            if len(counts) < 3:
                continue

            avg_count = mean(counts)
            try:
                std_count = stdev(counts)
            except Exception:
                std_count = 0

            if std_count == 0:
                continue

            # Find days with anomalous velocity
            threshold = avg_count + (VELOCITY_ANOMALY_STDEV_MULTIPLIER * std_count)
            anomalous_days = [
                (day, count) for day, count in daily_counts.items() if count > threshold
            ]

            if anomalous_days:
                alerts.append(
                    {
                        "type": "VELOCITY_ANOMALY",
                        "severity": "MEDIUM",
                        "customer_id": customer_id,
                        "average_daily_txns": round(avg_count, 1),
                        "std_deviation": round(std_count, 1),
                        "anomaly_threshold": round(threshold, 1),
                        "anomalous_days": [
                            {"date": str(day), "count": count}
                            for day, count in anomalous_days
                        ],
                        "description": f"Transaction velocity exceeded {VELOCITY_ANOMALY_STDEV_MULTIPLIER}σ on {len(anomalous_days)} day(s)",
                    }
                )

        return alerts

    def _calculate_risk_score(
        self, alerts: list[dict], total_transactions: int
    ) -> float:
        """Calculate overall risk score from 0-100."""
        if not alerts:
            return 0.0

        # Weight by severity
        severity_weights = {"HIGH": 30, "MEDIUM": 15, "LOW": 5}
        total_weight = sum(
            severity_weights.get(a.get("severity", "LOW"), 5) for a in alerts
        )

        # Normalize by transaction count
        normalized = min(total_weight / max(total_transactions, 1) * 10, 100)

        # Bonus for multiple pattern types
        pattern_types = {a["type"] for a in alerts}
        if len(pattern_types) >= 3:
            normalized = min(normalized * 1.3, 100)
        elif len(pattern_types) >= 2:
            normalized = min(normalized * 1.15, 100)

        return round(normalized, 1)

    def _empty_result(self) -> dict[str, Any]:
        """Return empty result structure."""
        return {
            "alerts": [],
            "summary": {
                "overall_risk_score": 0,
                "burst_patterns": 0,
                "structuring_patterns": 0,
                "velocity_anomalies": 0,
                "transactions_analyzed": 0,
                "analysis_timestamp": datetime.now().isoformat(),
            },
        }


# Singleton instance
temporal_burst_detector = TemporalBurstDetector()
