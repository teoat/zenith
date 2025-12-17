
from enum import Enum
from typing import Dict, Any, List

class NotificationChannel(Enum):
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"
    SLACK = "slack"
    WEBHOOK = "webhook"

class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationType(Enum):
    SYSTEM_ALERT = "system_alert"
    FRAUD_DETECTED = "fraud_detected"
    CASE_UPDATED = "case_updated"
    DOCUMENT_ANALYZED = "document_analyzed"
    PERFORMANCE_METRIC = "performance_metric"
    SECURITY_EVENT = "security_event"
    COLLABORATION_EVENT = "collaboration_event"
    DEADLINE_APPROACHING = "deadline_approaching"
    TASK_ASSIGNED = "task_assigned"
    REPORT_GENERATED = "report_generated"

class NotificationSystem:
    """Mock Notification System"""
    
    def get_user_notifications(self, user_id, unread_only=False):
        return []

    def mark_notification_read(self, user_id, notification_id):
        return True

    def process_event(self, event_type, data, recipient):
        pass

    def get_system_stats(self):
        return {
            "sent_last_hour": 0,
            "failed_last_hour": 0,
            "active_channels": 4
        }

notification_system = NotificationSystem()
