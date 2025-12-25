"""
Proactive Monitoring and Alerting Service for 99.99% Uptime
Provides real-time monitoring, anomaly detection, and automated alerting
"""
import asyncio
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import logging

from core.logging import logger

class AlertSeverity:
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AlertStatus:
    """Alert status"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"

class ProactiveMonitoringService:
    """Service for proactive monitoring and alerting to maintain 99.99% uptime"""

    def __init__(self):
        self.alerts: Dict[str, Dict[str, Any]] = {}
        self.metrics_history: Dict[str, List[float]] = {}
        self.anomaly_thresholds = {
            "response_time_p95": 2000,  # 2 seconds
            "error_rate": 0.001,        # 0.1%
            "cpu_usage": 85,           # 85%
            "memory_usage": 90,        # 90%
            "circuit_breaker_open": 0  # 0 = no breakers open
        }
        self.alert_cooldown = 300  # 5 minutes between similar alerts
        self._monitoring_active = False
        self._alerting_active = False

    async def start_monitoring(self):
        """Start proactive monitoring"""
        if self._monitoring_active:
            return

        self._monitoring_active = True
        logger.info("Starting proactive monitoring for 99.99% uptime")

        # Start background monitoring tasks
        asyncio.create_task(self._continuous_health_monitoring())
        asyncio.create_task(self._anomaly_detection_loop())
        asyncio.create_task(self._uptime_calculation_loop())

    async def stop_monitoring(self):
        """Stop proactive monitoring"""
        self._monitoring_active = False
        logger.info("Stopping proactive monitoring")

    async def _continuous_health_monitoring(self):
        """Continuous health monitoring loop"""
        while self._monitoring_active:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Error in health monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait longer on error

    async def _perform_health_checks(self):
        """Perform comprehensive health checks"""
        try:
            from app.routers.health import health_check
            from app.services.infrastructure.storage.database_service import db_service
            from app.services.infrastructure.circuit_breaker import get_all_circuit_breakers

            # Get comprehensive health status
            health_result = await health_check()

            # Check for critical issues
            critical_issues = []

            # Database health
            db_health = health_result.get("components", {}).get("database", {})
            if db_health.get("status") != "healthy":
                critical_issues.append(f"Database unhealthy: {db_health}")

            # Circuit breakers
            circuit_breakers = get_all_circuit_breakers()
            open_breakers = [name for name, status in circuit_breakers.items() if status["state"] == "open"]
            if open_breakers:
                critical_issues.append(f"Open circuit breakers: {open_breakers}")

            # System resources
            system_resources = health_result.get("components", {}).get("system_resources", {})
            if system_resources.get("status") in ["critical", "degraded"]:
                critical_issues.append(f"System resources critical: {system_resources}")

            # Create alerts for critical issues
            for issue in critical_issues:
                await self._create_alert(
                    alert_type="health_critical",
                    severity=AlertSeverity.CRITICAL,
                    message=f"Critical health issue detected: {issue}",
                    details={"health_result": health_result, "issue": issue}
                )

            # Track metrics for anomaly detection
            self._track_metric("response_time", health_result.get("response_time_ms", 0))
            self._track_metric("error_rate", self._calculate_error_rate_from_health(health_result))

        except Exception as e:
            logger.error(f"Error performing health checks: {e}")
            await self._create_alert(
                alert_type="monitoring_failure",
                severity=AlertSeverity.ERROR,
                message=f"Health monitoring failed: {e}",
                details={"error": str(e)}
            )

    async def _anomaly_detection_loop(self):
        """Anomaly detection monitoring loop"""
        while self._monitoring_active:
            try:
                await self._detect_anomalies()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in anomaly detection: {e}")
                await asyncio.sleep(120)

    async def _detect_anomalies(self):
        """Detect anomalies in metrics"""
        anomalies = []

        # Check response time anomalies
        response_times = self.metrics_history.get("response_time", [])
        if len(response_times) >= 10:
            recent_avg = sum(response_times[-10:]) / 10
            threshold = self.anomaly_thresholds["response_time_p95"]

            if recent_avg > threshold:
                anomalies.append({
                    "metric": "response_time",
                    "value": recent_avg,
                    "threshold": threshold,
                    "message": f"Response time anomaly: {recent_avg:.2f}ms > {threshold}ms"
                })

        # Check error rate anomalies
        error_rates = self.metrics_history.get("error_rate", [])
        if len(error_rates) >= 5:
            recent_avg = sum(error_rates[-5:]) / 5
            threshold = self.anomaly_thresholds["error_rate"]

            if recent_avg > threshold:
                anomalies.append({
                    "metric": "error_rate",
                    "value": recent_avg,
                    "threshold": threshold,
                    "message": f"Error rate anomaly: {recent_avg:.4f} > {threshold}"
                })

        # Create alerts for anomalies
        for anomaly in anomalies:
            await self._create_alert(
                alert_type="metric_anomaly",
                severity=AlertSeverity.WARNING,
                message=anomaly["message"],
                details=anomaly
            )

    async def _uptime_calculation_loop(self):
        """Calculate and monitor uptime metrics"""
        while self._monitoring_active:
            try:
                await self._calculate_uptime_metrics()
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Error calculating uptime: {e}")
                await asyncio.sleep(600)

    async def _calculate_uptime_metrics(self):
        """Calculate current uptime metrics"""
        try:
            # Calculate uptime based on health checks over last 24 hours
            current_time = datetime.now(timezone.utc)

            # In a real implementation, this would track actual downtime events
            # For now, we'll use health check results as a proxy
            uptime_percentage = 99.95  # Placeholder - would be calculated from actual data

            # Alert if uptime drops below 99.9%
            if uptime_percentage < 99.9:
                await self._create_alert(
                    alert_type="uptime_degradation",
                    severity=AlertSeverity.CRITICAL,
                    message=f"Uptime degraded to {uptime_percentage:.2f}% (target: 99.99%)",
                    details={
                        "current_uptime": uptime_percentage,
                        "target_uptime": 99.99,
                        "time_window": "24h"
                    }
                )
            elif uptime_percentage < 99.95:
                await self._create_alert(
                    alert_type="uptime_warning",
                    severity=AlertSeverity.WARNING,
                    message=f"Uptime below optimal: {uptime_percentage:.2f}% (target: 99.99%)",
                    details={
                        "current_uptime": uptime_percentage,
                        "target_uptime": 99.99,
                        "time_window": "24h"
                    }
                )

        except Exception as e:
            logger.error(f"Error in uptime calculation: {e}")

    def _track_metric(self, metric_name: str, value: float):
        """Track metric value for anomaly detection"""
        if metric_name not in self.metrics_history:
            self.metrics_history[metric_name] = []

        self.metrics_history[metric_name].append(value)

        # Keep only last 100 values
        if len(self.metrics_history[metric_name]) > 100:
            self.metrics_history[metric_name] = self.metrics_history[metric_name][-100:]

    def _calculate_error_rate_from_health(self, health_result: Dict[str, Any]) -> float:
        """Calculate error rate from health check results"""
        try:
            # This is a simplified calculation - in reality you'd track actual errors
            components = health_result.get("components", {})

            unhealthy_components = sum(
                1 for comp in components.values()
                if isinstance(comp, dict) and comp.get("status") in ["unhealthy", "degraded"]
            )

            total_components = len(components)
            return unhealthy_components / total_components if total_components > 0 else 0

        except Exception:
            return 0

    async def _create_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        details: Dict[str, Any] = None
    ):
        """Create an alert with deduplication"""
        alert_key = f"{alert_type}_{hash(json.dumps(details or {}, sort_keys=True))}"

        # Check for recent similar alerts
        if alert_key in self.alerts:
            last_alert = self.alerts[alert_key]
            if time.time() - last_alert.get("created_at", 0) < self.alert_cooldown:
                # Alert is still in cooldown, don't create duplicate
                return

        # Create new alert
        alert = {
            "id": alert_key,
            "type": alert_type,
            "severity": severity,
            "message": message,
            "details": details or {},
            "status": AlertStatus.ACTIVE,
            "created_at": time.time(),
            "updated_at": time.time()
        }

        self.alerts[alert_key] = alert

        # Log alert
        logger.warning(f"🚨 Proactive Alert [{severity.upper()}]: {message}", extra={
            "alert_type": alert_type,
            "alert_id": alert_key,
            "alert_details": details
        })

        # In production, this would send notifications via email, Slack, PagerDuty, etc.
        await self._send_notifications(alert)

    async def _send_notifications(self, alert: Dict[str, Any]):
        """Send alert notifications (email, Slack, PagerDuty, etc.)"""
        try:
            # Placeholder for notification logic
            # In production, this would integrate with notification services

            if alert["severity"] == AlertSeverity.CRITICAL:
                # Send immediate notifications for critical alerts
                logger.critical(f"🚨 CRITICAL ALERT: {alert['message']}", extra={
                    "alert_id": alert["id"],
                    "notification_sent": True
                })

            elif alert["severity"] == AlertSeverity.WARNING:
                # Send warning notifications
                logger.warning(f"⚠️ WARNING ALERT: {alert['message']}", extra={
                    "alert_id": alert["id"],
                    "notification_sent": True
                })

        except Exception as e:
            logger.error(f"Failed to send alert notifications: {e}")

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get all active alerts"""
        return [
            alert for alert in self.alerts.values()
            if alert["status"] == AlertStatus.ACTIVE
        ]

    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id]["status"] = AlertStatus.ACKNOWLEDGED
            self.alerts[alert_id]["updated_at"] = time.time()
            return True
        return False

    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id]["status"] = AlertStatus.RESOLVED
            self.alerts[alert_id]["updated_at"] = time.time()
            return True
        return False

    def get_monitoring_status(self) -> Dict[str, Any]:
        """Get comprehensive monitoring status"""
        return {
            "monitoring_active": self._monitoring_active,
            "alerting_active": self._alerting_active,
            "active_alerts": len(self.get_active_alerts()),
            "total_alerts": len(self.alerts),
            "tracked_metrics": list(self.metrics_history.keys()),
            "uptime_target": "99.99%",
            "anomaly_thresholds": self.anomaly_thresholds,
            "last_check": datetime.now(timezone.utc).isoformat()
        }


# Global proactive monitoring instance
proactive_monitoring = ProactiveMonitoringService()