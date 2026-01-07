"""
Security Monitoring and Alerting System for Zenith Fraud Detection Platform

Provides comprehensive security event monitoring, anomaly detection, and automated
response capabilities to maintain platform security posture.
"""

import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from core.logging import logger


@dataclass
class SecurityEvent:
    """Represents a security event"""

    event_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    source: str
    user_id: str | None = None
    ip_address: str | None = None
    details: dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    event_id: str = field(default_factory=lambda: f"sec_{int(time.time() * 1000)}")


@dataclass
class SecurityAlert:
    """Represents a security alert"""

    alert_id: str
    alert_type: str
    severity: str
    description: str
    events: list[SecurityEvent] = field(default_factory=list)
    triggered_at: datetime = field(default_factory=datetime.now)
    resolved_at: datetime | None = None
    status: str = "active"  # 'active', 'resolved', 'dismissed'


class SecurityMonitor:
    """
    Comprehensive security monitoring system that tracks events, detects anomalies,
    and generates alerts for security incidents.
    """

    def __init__(self):
        self.events: deque[SecurityEvent] = deque(maxlen=10000)  # Keep last 10k events
        self.alerts: list[SecurityAlert] = []
        self.anomaly_detectors = {}

        # Rate limiting tracking
        self.ip_request_counts: dict[str, deque] = defaultdict(
            lambda: deque(maxlen=100)
        )
        self.user_request_counts: dict[str, deque] = defaultdict(
            lambda: deque(maxlen=100)
        )

        # Failed login tracking
        self.failed_logins: dict[str, list[datetime]] = defaultdict(list)

        # Suspicious activity tracking
        self.suspicious_ips: set[str] = set()
        self.blocked_ips: set[str] = set()

        # Alert thresholds
        self.thresholds = {
            "failed_logins_per_hour": 5,
            "requests_per_minute": 100,
            "suspicious_patterns_per_hour": 10,
            "brute_force_attempts": 10,
        }

        # Initialize anomaly detectors
        self._setup_anomaly_detectors()

    def _setup_anomaly_detectors(self):
        """Initialize anomaly detection rules"""
        self.anomaly_detectors = {
            "brute_force": self._detect_brute_force,
            "unusual_traffic": self._detect_unusual_traffic,
            "suspicious_patterns": self._detect_suspicious_patterns,
            "privilege_escalation": self._detect_privilege_escalation,
            "data_exfiltration": self._detect_data_exfiltration,
        }

    async def record_event(self, event: SecurityEvent) -> None:
        """
        Record a security event and check for anomalies

        Args:
            event: Security event to record
        """
        self.events.append(event)

        # Update tracking data structures
        self._update_tracking(event)

        # Check for anomalies
        alerts = await self._check_anomalies(event)

        # Generate alerts if any
        for alert in alerts:
            await self._generate_alert(alert)

        # Log the event
        self._log_event(event)

    def _update_tracking(self, event: SecurityEvent):
        """Update internal tracking data structures"""
        now = datetime.now()

        # Update IP request counts
        if event.ip_address:
            self.ip_request_counts[event.ip_address].append(now)

        # Update user request counts
        if event.user_id:
            self.user_request_counts[event.user_id].append(now)

        # Track failed logins
        if event.event_type == "login_failed":
            if event.user_id:
                self.failed_logins[event.user_id].append(now)
            elif event.ip_address:
                self.failed_logins[f"ip_{event.ip_address}"].append(now)

        # Clean up old tracking data
        self._cleanup_old_data()

    def _cleanup_old_data(self):
        """Clean up old tracking data to prevent memory leaks"""
        now = datetime.now()
        cutoff_time = now - timedelta(hours=24)

        # Clean failed logins older than 24 hours
        for key in list(self.failed_logins.keys()):
            self.failed_logins[key] = [
                ts for ts in self.failed_logins[key] if ts > cutoff_time
            ]
            if not self.failed_logins[key]:
                del self.failed_logins[key]

        # Clean request counts older than 1 hour
        cutoff_requests = now - timedelta(hours=1)
        for ip in list(self.ip_request_counts.keys()):
            while (
                self.ip_request_counts[ip]
                and self.ip_request_counts[ip][0] < cutoff_requests
            ):
                self.ip_request_counts[ip].popleft()
            if not self.ip_request_counts[ip]:
                del self.ip_request_counts[ip]

        for user in list(self.user_request_counts.keys()):
            while (
                self.user_request_counts[user]
                and self.user_request_counts[user][0] < cutoff_requests
            ):
                self.user_request_counts[user].popleft()
            if not self.user_request_counts[user]:
                del self.user_request_counts[user]

    async def _check_anomalies(self, event: SecurityEvent) -> list[SecurityAlert]:
        """
        Check for security anomalies based on the event

        Returns:
            List of alerts to generate
        """
        alerts = []

        for detector_name, detector_func in self.anomaly_detectors.items():
            try:
                alert = await detector_func(event)
                if alert:
                    alerts.append(alert)
            except Exception as e:
                logger.error(f"Error in anomaly detector {detector_name}: {e}")

        return alerts

    async def _detect_brute_force(self, event: SecurityEvent) -> SecurityAlert | None:
        """Detect brute force login attempts"""
        if event.event_type != "login_failed":
            return None

        # Check failed logins for user
        user_key = event.user_id or f"ip_{event.ip_address}"
        recent_failures = self.failed_logins.get(user_key, [])

        # Count failures in last hour
        now = datetime.now()
        recent_failures_count = sum(
            1 for ts in recent_failures if now - ts < timedelta(hours=1)
        )

        if recent_failures_count >= self.thresholds["brute_force_attempts"]:
            return SecurityAlert(
                alert_id=f"brute_force_{user_key}_{int(time.time())}",
                alert_type="brute_force_attack",
                severity="high",
                description=f"Brute force attack detected: {recent_failures_count} failed login attempts in the last hour",
                events=[event],
            )

        return None

    async def _detect_unusual_traffic(
        self, event: SecurityEvent
    ) -> SecurityAlert | None:
        """Detect unusual traffic patterns"""
        if not event.ip_address:
            return None

        # Count requests from this IP in the last minute
        now = datetime.now()
        recent_requests = [
            ts
            for ts in self.ip_request_counts[event.ip_address]
            if now - ts < timedelta(minutes=1)
        ]

        if len(recent_requests) > self.thresholds["requests_per_minute"]:
            return SecurityAlert(
                alert_id=f"unusual_traffic_{event.ip_address}_{int(time.time())}",
                alert_type="unusual_traffic",
                severity="medium",
                description=f"Unusual traffic detected from IP {event.ip_address}: {len(recent_requests)} requests per minute",
                events=[event],
            )

        return None

    async def _detect_suspicious_patterns(
        self, event: SecurityEvent
    ) -> SecurityAlert | None:
        """Detect suspicious patterns in requests"""
        if event.event_type not in [
            "suspicious_input",
            "xss_attempt",
            "sql_injection_attempt",
        ]:
            return None

        # Count suspicious events from this IP in the last hour
        now = datetime.now()
        suspicious_count = sum(
            1
            for e in self.events
            if e.ip_address == event.ip_address
            and e.event_type
            in ["suspicious_input", "xss_attempt", "sql_injection_attempt"]
            and now - e.timestamp < timedelta(hours=1)
        )

        if suspicious_count >= self.thresholds["suspicious_patterns_per_hour"]:
            return SecurityAlert(
                alert_id=f"suspicious_patterns_{event.ip_address}_{int(time.time())}",
                alert_type="suspicious_activity",
                severity="high",
                description=f"Suspicious activity detected from IP {event.ip_address}: {suspicious_count} suspicious events in the last hour",
                events=[event],
            )

        return None

    async def _detect_privilege_escalation(
        self, event: SecurityEvent
    ) -> SecurityAlert | None:
        """Detect potential privilege escalation attempts"""
        if event.event_type not in ["unauthorized_access", "permission_denied"]:
            return None

        # Check for pattern of escalating privilege attempts
        user_events = [
            e
            for e in self.events
            if e.user_id == event.user_id
            and e.event_type in ["unauthorized_access", "permission_denied"]
            and datetime.now() - e.timestamp < timedelta(hours=1)
        ]

        if len(user_events) >= 5:  # 5+ privilege violations in an hour
            return SecurityAlert(
                alert_id=f"privilege_escalation_{event.user_id}_{int(time.time())}",
                alert_type="privilege_escalation",
                severity="critical",
                description=f"Privilege escalation attempt detected for user {event.user_id}: {len(user_events)} access violations in the last hour",
                events=user_events[-10:],  # Last 10 events
            )

        return None

    async def _detect_data_exfiltration(
        self, event: SecurityEvent
    ) -> SecurityAlert | None:
        """Detect potential data exfiltration attempts"""
        if event.event_type not in [
            "large_download",
            "bulk_export",
            "unusual_data_access",
        ]:
            return None

        # Check for large data access patterns
        user_events = [
            e
            for e in self.events
            if e.user_id == event.user_id
            and e.event_type in ["large_download", "bulk_export", "unusual_data_access"]
            and datetime.now() - e.timestamp < timedelta(hours=1)
        ]

        if len(user_events) >= 3:  # 3+ large data operations in an hour
            return SecurityAlert(
                alert_id=f"data_exfiltration_{event.user_id}_{int(time.time())}",
                alert_type="data_exfiltration",
                severity="high",
                description=f"Potential data exfiltration detected for user {event.user_id}: {len(user_events)} large data operations in the last hour",
                events=user_events,
            )

        return None

    async def _generate_alert(self, alert: SecurityAlert) -> None:
        """Generate and handle a security alert"""
        self.alerts.append(alert)

        # Keep only last 100 alerts
        if len(self.alerts) > 100:
            self.alerts.pop(0)

        # Log the alert
        logger.warning(
            f"Security alert generated: {alert.alert_type}",
            extra={
                "alert_id": alert.alert_id,
                "severity": alert.severity,
                "description": alert.description,
                "event_count": len(alert.events),
            },
        )

        # Take automated response actions
        await self._respond_to_alert(alert)

    async def _respond_to_alert(self, alert: SecurityAlert) -> None:
        """Take automated response actions based on alert type"""
        if alert.alert_type == "brute_force_attack":
            # Block the IP temporarily
            if alert.events and alert.events[0].ip_address:
                ip = alert.events[0].ip_address
                self.blocked_ips.add(ip)
                logger.warning(f"Temporarily blocked IP {ip} due to brute force attack")

        elif alert.alert_type == "unusual_traffic":
            # Mark IP as suspicious
            if alert.events and alert.events[0].ip_address:
                ip = alert.events[0].ip_address
                self.suspicious_ips.add(ip)
                logger.warning(f"Marked IP {ip} as suspicious due to unusual traffic")

    def _log_event(self, event: SecurityEvent) -> None:
        """Log a security event"""
        log_data = {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "severity": event.severity,
            "source": event.source,
            "timestamp": event.timestamp.isoformat(),
        }

        if event.user_id:
            log_data["user_id"] = event.user_id
        if event.ip_address:
            log_data["ip_address"] = event.ip_address

        log_data.update(event.details)

        logger.info(
            f"Security event: {event.event_type}",
            extra=log_data,
        )

    def get_security_status(self) -> dict[str, Any]:
        """Get current security status and metrics"""
        now = datetime.now()
        last_hour = now - timedelta(hours=1)

        # Count events by type in last hour
        recent_events = [e for e in self.events if e.timestamp > last_hour]
        event_counts = defaultdict(int)
        for event in recent_events:
            event_counts[event.event_type] += 1

        # Count active alerts by severity
        alert_counts = defaultdict(int)
        for alert in self.alerts:
            if alert.status == "active":
                alert_counts[alert.severity] += 1

        return {
            "total_events_last_hour": len(recent_events),
            "events_by_type": dict(event_counts),
            "active_alerts": dict(alert_counts),
            "blocked_ips": len(self.blocked_ips),
            "suspicious_ips": len(self.suspicious_ips),
            "system_health": "compromised"
            if alert_counts["critical"] > 0
            else "warning"
            if alert_counts["high"] > 0
            else "good",
        }

    def get_recent_alerts(self, limit: int = 10) -> list[dict[str, Any]]:
        """Get recent security alerts"""
        alerts = self.alerts[-limit:] if limit > 0 else self.alerts

        return [
            {
                "alert_id": alert.alert_id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "description": alert.description,
                "triggered_at": alert.triggered_at.isoformat(),
                "status": alert.status,
                "event_count": len(alert.events),
            }
            for alert in alerts
        ]

    def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if an IP address is blocked"""
        return ip_address in self.blocked_ips

    def is_ip_suspicious(self, ip_address: str) -> bool:
        """Check if an IP address is marked as suspicious"""
        return ip_address in self.suspicious_ips


# Global security monitor instance
security_monitor = SecurityMonitor()


async def log_security_event(
    event_type: str,
    user_id: str | None = None,
    severity: str = "low",
    source: str = "system",
    ip_address: str | None = None,
    **details,
) -> None:
    """
    Log a security event to the monitoring system

    Args:
        event_type: Type of security event
        user_id: User ID associated with the event
        severity: Event severity ('low', 'medium', 'high', 'critical')
        source: Source system/component
        ip_address: IP address of the client
        **details: Additional event details
    """
    event = SecurityEvent(
        event_type=event_type,
        severity=severity,
        source=source,
        user_id=user_id,
        ip_address=ip_address,
        details=details,
    )

    await security_monitor.record_event(event)


def get_security_monitor() -> SecurityMonitor:
    """Get the global security monitor instance"""
    return security_monitor
