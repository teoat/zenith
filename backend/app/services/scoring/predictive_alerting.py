"""
Predictive Alerting System
AI-powered anomaly detection and intelligent alert management for system monitoring.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(Enum):
    PERFORMANCE_DEGRADATION = "performance_degradation"
    ERROR_SPIKE = "error_spike"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    SECURITY_ANOMALY = "security_anomaly"
    PREDICTIVE_FAILURE = "predictive_failure"
    CAPACITY_WARNING = "capacity_warning"


@dataclass
class Alert:
    """Intelligent alert with predictive insights"""

    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    metrics: dict[str, Any]
    predicted_impact: str
    recommended_actions: list[str]
    confidence_score: float
    time_to_impact: timedelta | None
    created_at: datetime
    acknowledged: bool = False
    resolved: bool = False


@dataclass
class MetricData:
    """Time-series metric data"""

    name: str
    values: list[float]
    timestamps: list[datetime]
    metadata: dict[str, Any]


class PredictiveAlertingEngine:
    """AI-powered predictive alerting system"""

    def __init__(self):
        self.alerts: dict[str, Alert] = {}
        self.metrics_history: dict[str, MetricData] = {}
        self.anomaly_thresholds = self._initialize_thresholds()
        self.learning_enabled = True

    def _initialize_thresholds(self) -> dict[str, dict[str, float]]:
        """Initialize adaptive anomaly detection thresholds"""
        return {
            "cpu_usage": {"warning": 70.0, "critical": 90.0, "trend_threshold": 5.0},
            "memory_usage": {"warning": 80.0, "critical": 95.0, "trend_threshold": 3.0},
            "response_time": {
                "warning": 500.0,
                "critical": 2000.0,
                "trend_threshold": 100.0,
            },
            "error_rate": {"warning": 0.05, "critical": 0.15, "trend_threshold": 0.02},
            "disk_usage": {"warning": 85.0, "critical": 95.0, "trend_threshold": 2.0},
            "network_latency": {
                "warning": 100.0,
                "critical": 500.0,
                "trend_threshold": 50.0,
            },
        }

    async def analyze_metrics(self, metrics: dict[str, Any]) -> list[Alert]:
        """
        Analyze system metrics and generate predictive alerts

        Args:
            metrics: Current system metrics

        Returns:
            List of generated alerts
        """
        alerts = []

        # Update metrics history
        await self._update_metrics_history(metrics)

        # Analyze each metric type
        for metric_name, metric_value in metrics.items():
            if isinstance(metric_value, (int, float)):
                alert = await self._analyze_metric(metric_name, metric_value)
                if alert:
                    alerts.append(alert)

        # Cross-metric analysis for complex patterns
        complex_alerts = await self._analyze_metric_patterns(metrics)
        alerts.extend(complex_alerts)

        # Store alerts
        for alert in alerts:
            self.alerts[alert.id] = alert

        return alerts

    async def _analyze_metric(self, metric_name: str, current_value: float) -> Alert | None:
        """Analyze individual metric for anomalies"""
        if metric_name not in self.anomaly_thresholds:
            return None

        thresholds = self.anomaly_thresholds[metric_name]
        history = self.metrics_history.get(metric_name)

        if not history or len(history.values) < 10:
            # Not enough data for analysis
            return None

        # Calculate statistical measures
        values = np.array(history.values[-50:])  # Last 50 data points
        mean = np.mean(values)
        std = np.std(values)
        z_score = (current_value - mean) / std if std > 0 else 0

        # Trend analysis
        trend = self._calculate_trend(history.values[-20:])  # Last 20 points
        trend_magnitude = abs(trend)

        # Determine severity and prediction
        severity = AlertSeverity.LOW
        predicted_impact = ""
        recommended_actions = []
        confidence_score = 0.0
        time_to_impact = None

        # Performance degradation detection
        if metric_name in ["response_time", "cpu_usage", "memory_usage"]:
            if z_score > 3.0 or current_value > thresholds["critical"]:
                severity = AlertSeverity.CRITICAL
                predicted_impact = f"System performance severely degraded. {metric_name} at {current_value}"
                recommended_actions = [
                    f"Scale {metric_name.split('_')[0]} resources immediately",
                    "Review recent code deployments",
                    "Check for memory leaks or resource contention",
                ]
                confidence_score = min(0.95, z_score / 5.0)
                time_to_impact = timedelta(minutes=30)

            elif z_score > 2.0 or current_value > thresholds["warning"]:
                severity = AlertSeverity.HIGH
                predicted_impact = f"Performance degradation detected in {metric_name}"
                recommended_actions = [
                    f"Monitor {metric_name} closely",
                    "Prepare scaling resources",
                    "Review application logs",
                ]
                confidence_score = min(0.85, z_score / 4.0)
                time_to_impact = timedelta(hours=2)

        # Error rate analysis
        elif metric_name == "error_rate":
            if current_value > thresholds["critical"]:
                severity = AlertSeverity.CRITICAL
                predicted_impact = f"Critical error rate spike: {current_value:.1%}"
                recommended_actions = [
                    "Immediate investigation required",
                    "Check application health",
                    "Review error logs and stack traces",
                ]
                confidence_score = 0.9
                time_to_impact = timedelta(minutes=15)

        # Resource exhaustion prediction
        elif metric_name in ["disk_usage", "memory_usage"] and (
            trend > thresholds["trend_threshold"] and current_value > thresholds["warning"]
        ):
            severity = AlertSeverity.MEDIUM
            predicted_impact = f"{metric_name} trending toward exhaustion"
            recommended_actions = [
                f"Monitor {metric_name} growth rate",
                "Plan capacity expansion",
                "Implement data cleanup if applicable",
            ]
            confidence_score = min(0.8, trend_magnitude / 10.0)
            time_to_impact = timedelta(days=7)

        # Generate alert if severity is not LOW
        if severity != AlertSeverity.LOW and confidence_score > 0.6:
            alert_id = f"{metric_name}_{int(datetime.now().timestamp())}"

            return Alert(
                id=alert_id,
                type=self._classify_alert_type(metric_name, severity),
                severity=severity,
                title=f"{severity.value.title()} {metric_name.replace('_', ' ')} Alert",
                description=f"Detected anomaly in {metric_name}: current value {current_value}, z-score {z_score:.2f}",
                metrics={
                    "metric_name": metric_name,
                    "current_value": current_value,
                    "z_score": z_score,
                    "trend": trend,
                    "mean": mean,
                    "std": std,
                },
                predicted_impact=predicted_impact,
                recommended_actions=recommended_actions,
                confidence_score=confidence_score,
                time_to_impact=time_to_impact,
                created_at=datetime.now(),
            )

        return None

    async def _analyze_metric_patterns(self, metrics: dict[str, Any]) -> list[Alert]:
        """Analyze patterns across multiple metrics for complex issues"""
        alerts = []

        # Memory leak detection
        if "memory_usage" in metrics and "response_time" in metrics:
            memory_trend = self._calculate_trend(
                self.metrics_history.get("memory_usage", MetricData("memory_usage", [], [], {})).values[-10:]
            )
            response_trend = self._calculate_trend(
                self.metrics_history.get("response_time", MetricData("response_time", [], [], {})).values[-10:]
            )

            if memory_trend > 2.0 and response_trend > 50.0:
                alerts.append(
                    Alert(
                        id=f"memory_leak_{int(datetime.now().timestamp())}",
                        type=AlertType.PREDICTIVE_FAILURE,
                        severity=AlertSeverity.HIGH,
                        title="Potential Memory Leak Detected",
                        description="Correlated memory growth and response time degradation",
                        metrics={
                            "memory_trend": memory_trend,
                            "response_trend": response_trend,
                            "correlation": self._calculate_correlation(
                                self.metrics_history["memory_usage"].values[-20:],
                                self.metrics_history["response_time"].values[-20:],
                            ),
                        },
                        predicted_impact="Progressive performance degradation leading to service unavailability",
                        recommended_actions=[
                            "Profile memory usage patterns",
                            "Review recent code changes for memory leaks",
                            "Implement memory monitoring and alerts",
                            "Consider application restart if leak confirmed",
                        ],
                        confidence_score=0.85,
                        time_to_impact=timedelta(hours=24),
                        created_at=datetime.now(),
                    )
                )

        # Capacity planning alerts
        if self._detect_capacity_trend(metrics):
            alerts.append(
                Alert(
                    id=f"capacity_planning_{int(datetime.now().timestamp())}",
                    type=AlertType.CAPACITY_WARNING,
                    severity=AlertSeverity.MEDIUM,
                    title="Capacity Planning Required",
                    description="System resources trending toward limits",
                    metrics=metrics,
                    predicted_impact="Potential service degradation under peak load",
                    recommended_actions=[
                        "Review current capacity utilization",
                        "Plan infrastructure scaling",
                        "Optimize resource-intensive operations",
                        "Implement auto-scaling if applicable",
                    ],
                    confidence_score=0.75,
                    time_to_impact=timedelta(days=30),
                    created_at=datetime.now(),
                )
            )

        return alerts

    def _calculate_trend(self, values: list[float]) -> float:
        """Calculate linear trend slope"""
        if len(values) < 2:
            return 0.0

        x = np.arange(len(values))
        slope, _ = np.polyfit(x, values, 1)
        return slope

    def _calculate_correlation(self, series1: list[float], series2: list[float]) -> float:
        """Calculate Pearson correlation coefficient"""
        if len(series1) != len(series2) or len(series1) < 2:
            return 0.0

        return np.corrcoef(series1, series2)[0, 1]

    def _classify_alert_type(self, metric_name: str, severity: AlertSeverity) -> AlertType:
        """Classify alert type based on metric and severity"""
        if metric_name in ["cpu_usage", "memory_usage", "response_time"]:
            return AlertType.PERFORMANCE_DEGRADATION
        elif metric_name == "error_rate":
            return AlertType.ERROR_SPIKE
        elif metric_name in ["disk_usage"]:
            return AlertType.RESOURCE_EXHAUSTION
        else:
            return AlertType.SECURITY_ANOMALY

    def _detect_capacity_trend(self, metrics: dict[str, Any]) -> bool:
        """Detect if system is trending toward capacity limits"""
        capacity_indicators = ["cpu_usage", "memory_usage", "disk_usage"]
        trending_toward_limit = 0

        for indicator in capacity_indicators:
            if indicator in metrics:
                history = self.metrics_history.get(indicator)
                if history and len(history.values) >= 20:
                    recent_avg = np.mean(history.values[-10:])
                    older_avg = np.mean(history.values[-20:-10])
                    if recent_avg > older_avg * 1.1:  # 10% increase
                        trending_toward_limit += 1

        return trending_toward_limit >= 2  # At least 2 indicators trending up

    async def _update_metrics_history(self, metrics: dict[str, Any]):
        """Update metrics history for trend analysis"""
        current_time = datetime.now()

        for metric_name, value in metrics.items():
            if isinstance(value, (int, float)):
                if metric_name not in self.metrics_history:
                    self.metrics_history[metric_name] = MetricData(name=metric_name, values=[], timestamps=[], metadata={})

                history = self.metrics_history[metric_name]
                history.values.append(float(value))
                history.timestamps.append(current_time)

                # Keep only recent history (last 1000 points)
                if len(history.values) > 1000:
                    history.values = history.values[-1000:]
                    history.timestamps = history.timestamps[-1000:]

    def get_active_alerts(self) -> list[Alert]:
        """Get all active (unresolved) alerts"""
        return [alert for alert in self.alerts.values() if not alert.resolved]

    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].acknowledged = True
            return True
        return False

    def resolve_alert(self, alert_id: str) -> bool:
        """Mark an alert as resolved"""
        if alert_id in self.alerts:
            self.alerts[alert_id].resolved = True
            return True
        return False

    def get_alert_summary(self) -> dict[str, Any]:
        """Get alert summary statistics"""
        active_alerts = self.get_active_alerts()
        severity_counts = {}

        for alert in active_alerts:
            severity_counts[alert.severity.value] = severity_counts.get(alert.severity.value, 0) + 1

        return {
            "total_active": len(active_alerts),
            "by_severity": severity_counts,
            "most_critical": (max(active_alerts, key=lambda x: x.severity.value) if active_alerts else None),
        }


# Global instance
predictive_alerting = PredictiveAlertingEngine()
