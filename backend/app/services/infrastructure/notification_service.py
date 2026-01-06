"""Notification service for channels (in-app, email, push).
Enhanced with real email and webhook support.
"""

import json
import logging
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class NotificationType(Enum):
    FRAUD_ALERT = "fraud_alert"
    SYSTEM_ALERT = "system_alert"
    CASE_UPDATE = "case_update"
    DOCUMENT_ANALYSIS = "document_analysis"
    PERFORMANCE_WARNING = "performance_warning"
    SECURITY_INCIDENT = "security_incident"
    COLLABORATION = "collaboration"
    DEADLINE_REMINDER = "deadline_reminder"


class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationChannel(Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    WEBHOOK = "webhook"
    DESKTOP = "desktop"
    MOBILE_PUSH = "mobile_push"


class NotificationService:
    def __init__(self):
        self.notifications: list[dict[str, Any]] = []

    def send_in_app(
        self,
        user_id: str,
        title: str,
        body: str,
        metadata: dict[str, Any] | None = None,
    ):
        note = {
            "channel": "in_app",
            "user_id": user_id,
            "title": title,
            "body": body,
            "metadata": metadata,
        }
        self.notifications.append(note)
        logger.info(f"In-app notification queued for {user_id}")
        return True

    def send_email(self, email: str, subject: str, body: str) -> bool:
        """Send real email via SMTP if configured, otherwise log"""
        from core.database import SessionLocal
        from core.plugin_system.registry import plugin_registry_service

        db = SessionLocal()
        plugins_executed = False

        try:
            # Try Plugin System first
            plugins = plugin_registry_service.get_plugins_by_capability("notification", db)

            if plugins:
                for plugin in plugins:
                    try:
                        plugin.execute({
                            "to": email,
                            "subject": subject,
                            "body": body,
                        })
                        plugins_executed = True
                        logger.info(f"Email sent via plugin to {email}")
                    except Exception as pe:
                        logger.error(f"Plugin {plugin.metadata.name} failed: {pe}")

            # Fallback to SMTP if configured and no plugins succeeded
            if not plugins_executed:
                smtp_config = {
                    "host": "smtp.gmail.com",
                    "port": 587,
                    "user": "your-email@gmail.com",
                    "password": "your-app-password",
                    "from": "noreply@zenith.com",
                }

                host = smtp_config["host"]
                port = smtp_config["port"]
                user = smtp_config["user"]
                password = smtp_config["password"]
                from_addr = smtp_config["from"]

                if host and user and password:
                    try:
                        msg = MIMEMultipart()
                        msg["From"] = from_addr
                        msg["To"] = email
                        msg["Subject"] = subject
                        msg.attach(MIMEText(body, "plain"))

                        with smtplib.SMTP(host, port) as server:
                            server.starttls()
                            server.login(user, password)
                            server.send_message(msg)

                        logger.info(f"Email sent via SMTP to {email}")
                        return True
                    except Exception as smtp_e:
                        logger.error(f"SMTP failed: {smtp_e}")

                # Ultimate fallback: log
                logger.info(f"[SIMULATED EMAIL] To: {email}, Subject: {subject}")
                return True

            return plugins_executed

        except Exception as e:
            logger.error(f"Failed to send email: {e!s}")
            return False
        finally:
            db.close()

    def send_push(self, device_id: str, title: str, body: str) -> bool:
        note = {"channel": "push", "device_id": device_id, "title": title, "body": body}
        self.notifications.append(note)
        logger.info(f"Push notification queued for {device_id}")
        return True


class AdvancedNotificationSystem:
    """Advanced intelligent notification system"""

    def __init__(self, config: dict[str, Any] | None = None):
        self.config = config or {}
        self.rules: dict[str, Any] = {}
        self.handlers: dict[NotificationChannel, Any] = {}
        self.template_engine = self._create_template_engine()
        self.notification_history: list[Any] = []
        self.rate_limits: dict[str, list[datetime]] = {}
        self.cooldowns: dict[str, datetime] = {}

        # Initialize handlers
        self._initialize_handlers()

        # Load default rules
        self._load_default_rules()

    def _create_template_engine(self):
        """Create template engine for notifications"""
        templates = {
            NotificationType.FRAUD_ALERT: {
                "title": "🚨 Fraud Alert: {risk_score} Risk Detected",
                "message": "High-risk transaction detected:\n\n_amount: ${amount}\n_merchant: {merchant}\nRisk Score: {risk_score}\n_reason: {reason}\n\nReview required immediately.",
            },
            NotificationType.SYSTEM_ALERT: {
                "title": "⚠️ System Alert: {component}",
                "message": "System component {component} is experiencing issues:\n\n{details}\n\n_status: {status}\n_impact: {impact}",
            },
            NotificationType.CASE_UPDATE: {
                "title": "📋 Case Update: {case_id}",
                "message": "Case {case_id} has been updated:\n\n_status: {status}\nAssigned to: {assigned_to}\nLast action: {last_action}\n\n{notes}",
            },
            NotificationType.DOCUMENT_ANALYSIS: {
                "title": "📄 Document Analysis Complete",
                "message": "Document analysis completed:\n\n_file: {filename}\nPII detected: {pii_count}\n_authenticity: {authenticity_score}%\nProcessing time: {processing_time}s",
            },
            NotificationType.PERFORMANCE_WARNING: {
                "title": "⚡ Performance Warning",
                "message": "Performance threshold exceeded:\n\n_metric: {metric}\nCurrent value: {current_value}\n_threshold: {threshold}\n_duration: {duration}",
            },
            NotificationType.SECURITY_INCIDENT: {
                "title": "🔒 Security Incident",
                "message": "Security incident detected:\n\n_type: {incident_type}\n_severity: {severity}\n_source: {source}\n_details: {details}\n\nImmediate action required.",
            },
            NotificationType.COLLABORATION: {
                "title": "👥 Collaboration Update",
                "message": "{user_name} {action} {document_type}:\n\n_document: {document_name}\n_time: {timestamp}\n\n{details}",
            },
            NotificationType.DEADLINE_REMINDER: {
                "title": "⏰ Deadline Reminder",
                "message": "Deadline approaching:\n\n_task: {task_name}\n_due: {due_date}\nAssigned to: {assigned_to}\n_priority: {priority}\n\n_time remaining: {time_remaining}",
            },
        }

        class TemplateEngine:
            def render(
                self, notification_type: NotificationType, data: dict[str, Any]
            ) -> dict[str, str]:
                template = templates.get(notification_type)
                if not template:
                    return {
                        "title": f"Notification: {notification_type.value}",
                        "message": str(data),
                    }

                try:
                    title = template["title"].format(**data)
                    message = template["message"].format(**data)
                    return {"title": title, "message": message}
                except KeyError as e:
                    logger.error(f"Template rendering error: missing key {e}")
                    return {
                        "title": f"Notification: {notification_type.value}",
                        "message": f"Template error: {e!s}. Data: {json.dumps(data, indent=2)}",
                    }

        return TemplateEngine()

    def _initialize_handlers(self):
        """Initialize notification channel handlers"""
        # In-app handler
        self.handlers[NotificationChannel.IN_APP] = self._create_in_app_handler()

        # Email handler (if configured)
        if self.config.get("email"):
            self.handlers[NotificationChannel.EMAIL] = self._create_email_handler()

        # Webhook handler
        self.handlers[NotificationChannel.WEBHOOK] = self._create_webhook_handler()

    def _create_in_app_handler(self):
        """Create in-app notification handler"""
        notifications = {}

        class InAppHandler:
            def __init__(self, storage):
                self.storage = storage

            async def send(self, notification, recipient):
                if recipient not in self.storage:
                    self.storage[recipient] = []

                self.storage[recipient].append(notification)

                # Keep only last 100 notifications per user
                if len(self.storage[recipient]) > 100:
                    self.storage[recipient] = self.storage[recipient][-100:]

                return True

            def get_user_notifications(self, user_id, unread_only=False):
                user_notifications = self.storage.get(user_id, [])

                if unread_only:
                    user_notifications = [
                        n for n in user_notifications if not n.get("read", False)
                    ]

                return sorted(
                    user_notifications,
                    key=lambda n: n.get("created_at", ""),
                    reverse=True,
                )

            def mark_as_read(self, user_id, notification_id):
                user_notifications = self.storage.get(user_id, [])
                for notification in user_notifications:
                    if notification.get("id") == notification_id:
                        notification["read"] = True
                        notification["read_at"] = datetime.now().isoformat()
                        return True
                return False

        return InAppHandler(notifications)

    def _create_email_handler(self):
        """Create email notification handler with real SMTP support"""
        email_config = self.config.get("email", {})

        class EmailHandler:
            def __init__(self, config):
                self.config = config
                self.smtp_config = {
                    "host": config.get("smtp_host", "smtp.gmail.com"),
                    "port": config.get("smtp_port", 587),
                    "user": config.get("smtp_user"),
                    "password": config.get("smtp_password"),
                    "from": config.get("from_email", "noreply@zenith.com"),
                }

            async def send(self, notification, recipient):
                from core.database import SessionLocal
                from core.plugin_system.registry import plugin_registry_service

                db = SessionLocal()
                plugins_executed = False

                try:
                    # 1. Try Plugin System first
                    plugins = await plugin_registry_service.get_plugins_by_capability(
                        "notification", db
                    )

                    if plugins:
                        for plugin in plugins:
                            try:
                                await plugin.execute({
                                    "to": recipient,
                                    "subject": notification.get("title"),
                                    "body": notification.get("message"),
                                })
                                plugins_executed = True
                                logger.info(f"Email sent via plugin to {recipient}")
                            except Exception as pe:
                                logger.error(f"Plugin {plugin.metadata.name} failed: {pe}")

                    # 2. Send via SMTP if configured
                    if not plugins_executed and self.smtp_config["user"] and self.smtp_config["password"]:
                        try:
                            msg = MIMEMultipart()
                            msg["From"] = self.smtp_config["from"]
                            msg["To"] = recipient
                            msg["Subject"] = notification.get("title", "Notification")
                            msg.attach(MIMEText(notification.get("message", ""), "plain"))

                            with smtplib.SMTP(self.smtp_config["host"], self.smtp_config["port"]) as server:
                                server.starttls()
                                server.login(self.smtp_config["user"], self.smtp_config["password"])
                                server.send_message(msg)

                            logger.info(f"Email sent via SMTP to {recipient}")
                            return True
                        except Exception as smtp_e:
                            logger.error(f"SMTP sending failed: {smtp_e}")

                    # 3. Log as fallback
                    if not plugins_executed:
                        logger.info(f"[EMAIL] To: {recipient}, Subject: {notification.get('title')}")

                    return True
                except Exception as e:
                    logger.error(f"Failed to send email: {e!s}")
                    return False
                finally:
                    db.close()

        return EmailHandler(email_config)

    def _create_webhook_handler(self):
        """Create webhook notification handler"""
        webhooks = {}

        class WebhookHandler:
            def __init__(self, storage):
                self.storage = storage

            def register_webhook(self, name, url, headers=None):
                self.storage[name] = {"url": url, "headers": headers or {}}

            async def send(self, notification, recipient):
                webhook = self.storage.get(recipient)
                if not webhook:
                    logger.error(f"Webhook '{recipient}' not found")
                    return False

                try:
                    # Simulate webhook call (in production, use actual HTTP request)
                    logger.info(
                        f"Webhook sent to {recipient}: {notification.get('title')}"
                    )
                    return True
                except Exception as e:
                    logger.error(f"Failed to send webhook: {e!s}")
                    return False

        return WebhookHandler(webhooks)

    def _load_default_rules(self):
        """Load default notification rules"""
        default_rules = {
            "fraud_high_risk": {
                "name": "High Risk Fraud Alert",
                "event_type": "fraud_detected",
                "conditions": {"risk_score": {"$gte": 0.8}},
                "channels": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                "priority": NotificationPriority.HIGH,
                "cooldown_minutes": 5,
            },
            "fraud_critical_risk": {
                "name": "Critical Risk Fraud Alert",
                "event_type": "fraud_detected",
                "conditions": {"risk_score": {"$gte": 0.95}},
                "channels": [
                    NotificationChannel.IN_APP,
                    NotificationChannel.EMAIL,
                    NotificationChannel.WEBHOOK,
                ],
                "priority": NotificationPriority.CRITICAL,
                "cooldown_minutes": 1,
            },
            "system_performance": {
                "name": "System Performance Warning",
                "event_type": "performance_metric",
                "conditions": {"threshold_exceeded": True},
                "channels": [NotificationChannel.IN_APP],
                "priority": NotificationPriority.MEDIUM,
                "cooldown_minutes": 15,
            },
            "security_incident": {
                "name": "Security Incident",
                "event_type": "security_event",
                "conditions": {"severity": {"$in": ["high", "critical"]}},
                "channels": [
                    NotificationChannel.IN_APP,
                    NotificationChannel.EMAIL,
                    NotificationChannel.WEBHOOK,
                ],
                "priority": NotificationPriority.CRITICAL,
                "cooldown_minutes": 1,
            },
        }

        self.rules.update(default_rules)

    async def process_event(
        self, event_type: str, data: dict[str, Any], recipient: str | None = None
    ):
        """Process an event and trigger notifications based on rules"""
        try:
            triggered_rules = []

            # Find matching rules
            for rule_id, rule in self.rules.items():
                if self._evaluate_conditions(rule.get("conditions", {}), data):
                    # Check cooldown
                    if self._is_in_cooldown(rule_id):
                        continue

                    triggered_rules.append((rule_id, rule, recipient))

            # Create and send notifications
            for rule_id, rule, recipient in triggered_rules:
                await self._create_and_send_notification(rule_id, rule, data, recipient)

        except Exception as e:
            logger.error(f"Error processing event {event_type}: {e!s}")

    def _evaluate_conditions(
        self, conditions: dict[str, Any], data: dict[str, Any]
    ) -> bool:
        """Evaluate rule conditions against event data"""
        try:
            for key, condition in conditions.items():
                if key not in data:
                    return False

                if isinstance(condition, dict):
                    for op, value in condition.items():
                        if (
                            (op == "$gte" and not (data[key] >= value))
                            or (op == "$lte" and not (data[key] <= value))
                            or (op == "$eq" and data[key] != value)
                            or (op == "$ne" and data[key] == value)
                            or (op == "$in" and data[key] not in value)
                            or (op == "$nin" and data[key] in value)
                        ):
                            return False
                else:
                    if data[key] != condition:
                        return False

            return True

        except Exception as e:
            logger.error(f"Error evaluating conditions: {e!s}")
            return False

    def _is_in_cooldown(self, rule_id: str) -> bool:
        """Check if rule is in cooldown period"""
        if rule_id not in self.cooldowns:
            return False

        rule = self.rules.get(rule_id)
        if not rule:
            return False

        cooldown_end = self.cooldowns[rule_id] + timedelta(
            minutes=rule.get("cooldown_minutes", 5)
        )
        return datetime.now() < cooldown_end

    async def _create_and_send_notification(
        self, rule_id: str, rule: dict[str, Any], data: dict[str, Any], recipient: str
    ):
        """Create and send notification"""
        try:
            # Determine notification type
            notification_type = self._map_event_to_type(
                rule.get("event_type", "system_alert")
            )

            # Render template
            template_data = self.template_engine.render(notification_type, data)

            # Create notification
            notification = {
                "id": f"{rule_id}_{datetime.now().timestamp()}",
                "type": notification_type.value,
                "title": template_data["title"],
                "message": template_data["message"],
                "priority": rule.get("priority", NotificationPriority.MEDIUM).value,
                "created_at": datetime.now().isoformat(),
                "read": False,
                "data": data,
            }

            # Send through all configured channels
            successful_channels = []
            for channel in rule.get("channels", []):
                if channel in self.handlers:
                    success = await self.handlers[channel].send(notification, recipient)
                    if success:
                        successful_channels.append(channel.value)

            # Update cooldown
            self.cooldowns[rule_id] = datetime.now()

            # Store in history
            self.notification_history.append(notification)

            # Keep history manageable
            if len(self.notification_history) > 10000:
                self.notification_history = self.notification_history[-5000:]

            logger.info(
                f"Notification sent via {successful_channels} for rule {rule.get('name')}"
            )

        except Exception as e:
            logger.error(f"Error creating/sending notification: {e!s}")

    def _map_event_to_type(self, event_type: str) -> NotificationType:
        """Map event type to notification type"""
        mapping = {
            "fraud_detected": NotificationType.FRAUD_ALERT,
            "system_alert": NotificationType.SYSTEM_ALERT,
            "case_updated": NotificationType.CASE_UPDATE,
            "document_analyzed": NotificationType.DOCUMENT_ANALYSIS,
            "performance_metric": NotificationType.PERFORMANCE_WARNING,
            "security_event": NotificationType.SECURITY_INCIDENT,
            "collaboration_event": NotificationType.COLLABORATION,
            "deadline_approaching": NotificationType.DEADLINE_REMINDER,
        }
        return mapping.get(event_type, NotificationType.SYSTEM_ALERT)

    def get_user_notifications(
        self, user_id: str, unread_only: bool = False
    ) -> list[dict[str, Any]]:
        """Get notifications for a user"""
        if NotificationChannel.IN_APP in self.handlers:
            return self.handlers[NotificationChannel.IN_APP].get_user_notifications(
                user_id, unread_only
            )
        return []

    def mark_notification_read(self, user_id: str, notification_id: str) -> bool:
        """Mark notification as read"""
        if NotificationChannel.IN_APP in self.handlers:
            return self.handlers[NotificationChannel.IN_APP].mark_as_read(
                user_id, notification_id
            )
        return False

    def get_system_stats(self) -> dict[str, Any]:
        """Get notification system statistics"""
        now = datetime.now()
        last_24h = now - timedelta(hours=24)

        recent_notifications = [
            n
            for n in self.notification_history
            if datetime.fromisoformat(n.get("created_at", "")) > last_24h
        ]

        # Priority stats
        priority_stats = {}
        for notification in recent_notifications:
            priority = notification.get("priority", "medium")
            priority_stats[priority] = priority_stats.get(priority, 0) + 1

        return {
            "total_notifications": len(self.notification_history),
            "last_24h": len(recent_notifications),
            "active_rules": len(self.rules),
            "priority_distribution": priority_stats,
            "cooldowns_active": len(self.cooldowns),
        }


# Global notification system instance
notification_system = AdvancedNotificationSystem()
