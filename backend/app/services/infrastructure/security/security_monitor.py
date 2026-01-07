"""
Production Monitoring Configuration
Sets up monitoring for security events and failed authentication attempts
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)


class SecurityMonitor:
    """Monitor security events and trigger alerts"""

    def __init__(self):
        self.failed_auth_attempts = defaultdict(list)
        self.admin_operations = []
        self.critical_events = []

    def log_failed_auth(self, user_id: str, ip_address: str, reason: str):
        """Log failed authentication attempt"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "ip_address": ip_address,
            "reason": reason,
            "event_type": "FAILED_AUTH",
        }

        self.failed_auth_attempts[ip_address].append(event)

        # Alert if more than 5 failed attempts from same IP in 5 minutes
        recent_failures = [
            e
            for e in self.failed_auth_attempts[ip_address]
            if datetime.fromisoformat(e["timestamp"])
            > datetime.now() - timedelta(minutes=5)
        ]

        if len(recent_failures) >= 5:
            self.trigger_alert(
                "BRUTE_FORCE_DETECTED",
                {
                    "ip_address": ip_address,
                    "attempts": len(recent_failures),
                    "timeframe": "5_minutes",
                },
            )

    def log_admin_operation(
        self, user_id: str, operation: str, details: dict[str, Any]
    ):
        """Log admin operation for monitoring"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "operation": operation,
            "details": details,
            "event_type": "ADMIN_OPERATION",
        }

        self.admin_operations.append(event)
        logger.warning(f"Admin operation: {operation} by {user_id}")

    def log_critical_event(self, event_type: str, details: dict[str, Any]):
        """Log critical security event"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "details": details,
            "severity": "CRITICAL",
        }

        self.critical_events.append(event)
        logger.critical(f"Critical security event: {event_type}")

        # Always trigger alert for critical events
        self.trigger_alert(event_type, details)

    def trigger_alert(self, alert_type: str, details: dict[str, Any]):
        """Trigger security alert"""
        {
            "timestamp": datetime.now().isoformat(),
            "alert_type": alert_type,
            "details": details,
            "requires_action": True,
        }

        logger.critical(f"SECURITY ALERT: {alert_type} - {details}")

        # In production, this would:
        # - Send email to security team
        # - Post to Slack/Teams channel
        # - Create PagerDuty incident
        # - Write to SIEM system

    def get_security_summary(self) -> dict[str, Any]:
        """Get summary of recent security events"""
        now = datetime.now()
        last_24h = now - timedelta(hours=24)

        # Count recent events
        recent_failed_auths = sum(
            len(
                [
                    e
                    for e in attempts
                    if datetime.fromisoformat(e["timestamp"]) > last_24h
                ]
            )
            for attempts in self.failed_auth_attempts.values()
        )

        recent_admin_ops = len(
            [
                e
                for e in self.admin_operations
                if datetime.fromisoformat(e["timestamp"]) > last_24h
            ]
        )

        recent_critical = len(
            [
                e
                for e in self.critical_events
                if datetime.fromisoformat(e["timestamp"]) > last_24h
            ]
        )

        return {
            "period": "last_24_hours",
            "failed_auth_attempts": recent_failed_auths,
            "admin_operations": recent_admin_ops,
            "critical_events": recent_critical,
            "high_risk_ips": self._get_high_risk_ips(),
            "status": "healthy" if recent_critical == 0 else "alert",
        }

    def _get_high_risk_ips(self) -> list[str]:
        """Get IPs with suspicious activity"""
        high_risk = []
        now = datetime.now()
        last_hour = now - timedelta(hours=1)

        for ip, attempts in self.failed_auth_attempts.items():
            recent = [
                e
                for e in attempts
                if datetime.fromisoformat(e["timestamp"]) > last_hour
            ]
            if len(recent) >= 3:  # 3+ failures in last hour
                high_risk.append(ip)

        return high_risk


# Global monitoring instance
security_monitor = SecurityMonitor()
