#!/usr/bin/env python3
"""
Notification Service for System Orchestration Framework
Manages alerts and notifications for system events.
"""

import asyncio
import json
import logging
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class NotificationChannel(Enum):
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    DASHBOARD = "dashboard"


class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class OrchestrationNotificationService:
    """Service for managing system orchestration notifications and alerts."""

    def __init__(self):
        self.notification_channels = self._initialize_channels()
        self.notification_history: List[Dict[str, Any]] = []
        self.alert_rules = self._initialize_alert_rules()

    def _initialize_channels(self) -> Dict[str, Dict[str, Any]]:
        """Initialize notification channels."""
        return {
            "email": {
                "enabled": True,
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "sender_email": "system@frauddetection.com",
                "recipients": ["admin@frauddetection.com", "devops@frauddetection.com"],
            },
            "slack": {
                "enabled": False,
                "webhook_url": "https://hooks.slack.com/services/...",
                "channel": "#system-alerts",
            },
            "webhook": {
                "enabled": False,
                "url": "https://api.pagerduty.com/webhooks",
                "headers": {"Authorization": "Token token=..."},
            },
            "dashboard": {"enabled": True, "persistent_alerts": True},
        }

    def _initialize_alert_rules(self) -> Dict[str, Dict[str, Any]]:
        """Initialize alert rules."""
        return {
            "score_drop": {
                "enabled": True,
                "threshold": 0.05,  # 5% drop
                "channels": ["email", "dashboard"],
                "priority": NotificationPriority.HIGH.value,
                "cooldown_minutes": 60,
            },
            "critical_issue": {
                "enabled": True,
                "keywords": ["critical", "security", "data_integrity"],
                "channels": ["email", "slack"],
                "priority": NotificationPriority.CRITICAL.value,
                "immediate": True,
            },
            "system_degradation": {
                "enabled": True,
                "threshold": 0.8,  # Below 80% health
                "channels": ["email", "dashboard"],
                "priority": NotificationPriority.MEDIUM.value,
                "cooldown_minutes": 30,
            },
            "pipeline_failure": {
                "enabled": True,
                "channels": ["email", "dashboard"],
                "priority": NotificationPriority.HIGH.value,
                "immediate": True,
            },
            "sync_failure": {
                "enabled": True,
                "channels": ["email"],
                "priority": NotificationPriority.MEDIUM.value,
                "cooldown_minutes": 15,
            },
        }

    async def check_and_send_alerts(self, system_data: Dict[str, Any]):
        """Check system data and send appropriate alerts."""
        alerts_to_send = []

        # Check score drop alerts
        score_alert = self._check_score_drop_alert(system_data)
        if score_alert:
            alerts_to_send.append(score_alert)

        # Check critical issue alerts
        critical_alerts = self._check_critical_issue_alerts(system_data)
        alerts_to_send.extend(critical_alerts)

        # Check system degradation alerts
        degradation_alert = self._check_system_degradation_alert(system_data)
        if degradation_alert:
            alerts_to_send.append(degradation_alert)

        # Send alerts
        for alert in alerts_to_send:
            await self.send_notification(alert)

    def _check_score_drop_alert(
        self, system_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Check for score drop alerts."""
        rule = self.alert_rules["score_drop"]
        if not rule["enabled"]:
            return None

        overall_score = system_data.get("overall_health_score", 1.0)
        threshold = rule["threshold"]

        # Check if score dropped significantly
        # This is simplified - in practice, compare with historical data
        if overall_score < (1.0 - threshold):
            return {
                "type": "score_drop",
                "priority": rule["priority"],
                "title": "System Health Score Drop Alert",
                "message": f"Overall system health score dropped to {overall_score:.1%}",
                "details": {
                    "current_score": overall_score,
                    "threshold": threshold,
                    "affected_dimensions": self._get_affected_dimensions(system_data),
                },
                "channels": rule["channels"],
                "timestamp": datetime.now().isoformat(),
            }

        return None

    def _check_critical_issue_alerts(
        self, system_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check for critical issue alerts."""
        rule = self.alert_rules["critical_issue"]
        if not rule["enabled"]:
            return []

        alerts = []
        keywords = rule["keywords"]

        # Check each dimension for critical issues
        for dimension_name, dimension_data in system_data.items():
            if not isinstance(dimension_data, dict):
                continue

            alerts_list = dimension_data.get("alerts", [])
            for alert in alerts_list:
                if any(keyword.lower() in alert.lower() for keyword in keywords):
                    alerts.append(
                        {
                            "type": "critical_issue",
                            "priority": rule["priority"],
                            "title": "Critical System Issue Alert",
                            "message": f"Critical issue detected in {dimension_name}: {alert}",
                            "details": {
                                "dimension": dimension_name,
                                "issue": alert,
                                "severity": "critical",
                            },
                            "channels": rule["channels"],
                            "timestamp": datetime.now().isoformat(),
                        }
                    )

        return alerts

    def _check_system_degradation_alert(
        self, system_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Check for system degradation alerts."""
        rule = self.alert_rules["system_degradation"]
        if not rule["enabled"]:
            return None

        overall_score = system_data.get("overall_health_score", 1.0)
        threshold = rule["threshold"]

        if overall_score < threshold:
            return {
                "type": "system_degradation",
                "priority": rule["priority"],
                "title": "System Performance Degradation Alert",
                "message": f"System health below acceptable threshold: {overall_score:.1%} < {threshold:.1%}",
                "details": {
                    "current_score": overall_score,
                    "threshold": threshold,
                    "recommendations": [
                        "Review recent changes",
                        "Check system resources",
                        "Run diagnostics",
                    ],
                },
                "channels": rule["channels"],
                "timestamp": datetime.now().isoformat(),
            }

        return None

    def _get_affected_dimensions(self, system_data: Dict[str, Any]) -> List[str]:
        """Get dimensions affected by issues."""
        affected = []
        for dimension_name, dimension_data in system_data.items():
            if isinstance(dimension_data, dict):
                score = dimension_data.get("health_score", 1.0)
                alerts = dimension_data.get("alerts", [])
                if score < 0.9 or len(alerts) > 0:
                    affected.append(dimension_name)
        return affected

    async def send_notification(self, alert: Dict[str, Any]):
        """Send notification through configured channels."""
        alert_id = f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Add metadata
        alert["id"] = alert_id
        alert["sent_at"] = datetime.now().isoformat()

        channels = alert.get("channels", ["dashboard"])
        success_count = 0

        for channel in channels:
            try:
                if channel == "email":
                    await self._send_email_alert(alert)
                elif channel == "slack":
                    await self._send_slack_alert(alert)
                elif channel == "webhook":
                    await self._send_webhook_alert(alert)
                elif channel == "dashboard":
                    await self._store_dashboard_alert(alert)

                success_count += 1
                logger.info(f"Alert {alert_id} sent via {channel}")

            except Exception as e:
                logger.error(f"Failed to send alert {alert_id} via {channel}: {e}")

        alert["delivery_status"] = f"{success_count}/{len(channels)} channels"
        self.notification_history.append(alert)

    async def _send_email_alert(self, alert: Dict[str, Any]):
        """Send alert via email."""
        channel_config = self.notification_channels["email"]
        if not channel_config["enabled"]:
            return

        try:
            msg = MIMEMultipart()
            msg["From"] = channel_config["sender_email"]
            msg["To"] = ", ".join(channel_config["recipients"])
            msg["Subject"] = f"[{alert['priority'].upper()}] {alert['title']}"

            body = f"""
System Alert Notification

Title: {alert['title']}
Priority: {alert['priority'].upper()}
Time: {alert['timestamp']}

Message:
{alert['message']}

Details:
{json.dumps(alert.get('details', {}), indent=2)}

This is an automated notification from the System Orchestration Framework.
            """

            msg.attach(MIMEText(body, "plain"))

            # In a real implementation, you would configure SMTP properly
            # server = smtplib.SMTP(channel_config["smtp_server"], channel_config["smtp_port"])
            # server.starttls()
            # server.login(...)
            # server.sendmail(...)
            # server.quit()

            logger.info(f"Email alert sent (simulated): {alert['title']}")

        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            raise

    async def _send_slack_alert(self, alert: Dict[str, Any]):
        """Send alert via Slack."""
        channel_config = self.notification_channels["slack"]
        if not channel_config["enabled"]:
            return

        # In a real implementation, send to Slack webhook
        logger.info(f"Slack alert sent (simulated): {alert['title']}")

    async def _send_webhook_alert(self, alert: Dict[str, Any]):
        """Send alert via webhook."""
        channel_config = self.notification_channels["webhook"]
        if not channel_config["enabled"]:
            return

        # In a real implementation, send to webhook URL
        logger.info(f"Webhook alert sent (simulated): {alert['title']}")

    async def _store_dashboard_alert(self, alert: Dict[str, Any]):
        """Store alert for dashboard display."""
        # In a real implementation, store in database or cache
        logger.info(f"Dashboard alert stored: {alert['title']}")

    def get_recent_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent alerts."""
        return self.notification_history[-limit:]

    def configure_channel(
        self, channel_name: str, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Configure a notification channel."""
        if channel_name not in self.notification_channels:
            raise ValueError(f"Unknown channel: {channel_name}")

        self.notification_channels[channel_name].update(config)
        return self.notification_channels[channel_name]

    def configure_alert_rule(
        self, rule_name: str, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Configure an alert rule."""
        if rule_name not in self.alert_rules:
            raise ValueError(f"Unknown alert rule: {rule_name}")

        self.alert_rules[rule_name].update(config)
        return self.alert_rules[rule_name]


# Global orchestration notification service instance
orchestration_notification_service = OrchestrationNotificationService()
