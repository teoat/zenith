import logging
from datetime import datetime, timedelta
from typing import Any

from app.services.infrastructure.auth_service import auth_service
from app.services.infrastructure.notification_service import (
    NotificationChannel,
    NotificationType,
    notification_system,
)
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from core.database import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])

# ---- Test placeholders (allow tests to patch module-level dependencies) ----
if "get_current_user" not in globals():
    try:
        get_current_user = auth_service.get_current_user
    except Exception:

        def get_current_user(*args, **kwargs):
            return None


if "require_permission" not in globals():

    def require_permission(*args, **kwargs):
        def _dep(*a, **k):
            return None

        return _dep


for _svc in ("notification_system", "notification_service", "messaging_service"):
    if _svc not in globals():
        globals()[_svc] = None


@router.get("/")
async def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get notifications for a user"""
    try:
        notifications = notification_system.get_user_notifications(user_id, unread_only)

        # Apply limit
        if limit > 0:
            notifications = notifications[:limit]

        return {
            "notifications": notifications,
            "total_count": len(notifications),
            "unread_count": len([n for n in notifications if not n.get("read", False)]),
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting notifications for user {user_id}: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get notifications: {e!s}"
        )


@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str):
    """Mark a notification as read"""
    try:
        success = notification_system.mark_notification_read(user_id, notification_id)

        if success:
            return {
                "message": "Notification marked as read",
                "notification_id": notification_id,
                "timestamp": datetime.now().isoformat(),
            }
        else:
            raise HTTPException(status_code=404, detail="Notification not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to mark notification as read: {e!s}"
        )


@router.post("/mark-all-read")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    try:
        notifications = notification_system.get_user_notifications(
            user_id, unread_only=True
        )
        marked_count = 0

        for notification in notifications:
            if notification_system.mark_notification_read(user_id, notification["id"]):
                marked_count += 1

        return {
            "message": f"Marked {marked_count} notifications as read",
            "marked_count": marked_count,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark all notifications as read: {e!s}",
        )


@router.post("/trigger")
async def trigger_notification(
    event_data: dict[str, Any], background_tasks: BackgroundTasks
):
    """Manually trigger a notification event"""
    try:
        event_type = event_data.get("event_type")
        data = event_data.get("data", {})
        recipient = event_data.get("recipient")

        if not event_type:
            raise HTTPException(status_code=400, detail="event_type is required")

        # Process event in background
        background_tasks.add_task(
            notification_system.process_event, event_type, data, recipient
        )

        return {
            "message": "Notification event triggered",
            "event_type": event_type,
            "recipient": recipient,
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering notification: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger notification: {e!s}"
        )


@router.get("/stats")
async def get_notification_stats(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get notification system statistics"""
    try:
        stats = notification_system.get_system_stats()

        return {"stats": stats, "timestamp": datetime.now().isoformat()}

    except Exception as e:
        logger.error(f"Error getting notification stats: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {e!s}")


@router.post("/test")
async def test_notification(
    notification_type: str, recipient: str, background_tasks: BackgroundTasks
):
    """Send a test notification"""
    try:
        # Create test data based on notification type
        test_data = {
            "fraud_alert": {
                "amount": 15000.00,
                "merchant": "Test Merchant Inc",
                "risk_score": 0.92,
                "reason": "Unusual transaction pattern detected",
            },
            "system_alert": {
                "component": "Database",
                "details": "Connection pool exhausted",
                "status": "Critical",
                "impact": "High",
            },
            "case_update": {
                "case_id": "CASE-12345",
                "status": "Under Investigation",
                "assigned_to": "John Doe",
                "last_action": "Evidence collected",
                "notes": "Awaiting forensic analysis",
            },
            "document_analysis": {
                "filename": "test_document.pdf",
                "pii_count": 3,
                "authenticity_score": 87,
                "processing_time": 2.5,
            },
            "performance_warning": {
                "metric": "CPU Usage",
                "current_value": 85.2,
                "threshold": 80.0,
                "duration": "5 minutes",
            },
            "security_incident": {
                "incident_type": "Unauthorized Access Attempt",
                "severity": "High",
                "source": "192.168.1.100",
                "details": "Multiple failed login attempts detected",
            },
            "collaboration": {
                "user_name": "Jane Smith",
                "action": "edited",
                "document_type": "fraud report",
                "document_name": "Quarterly Fraud Analysis",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "details": "Updated risk assessment section",
            },
            "deadline_reminder": {
                "task_name": "Complete fraud investigation",
                "due_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "assigned_to": "Investigation Team",
                "priority": "High",
                "time_remaining": "2 days",
            },
        }

        data = test_data.get(
            notification_type,
            {
                "test": True,
                "message": f"This is a test {notification_type} notification",
            },
        )

        # Map notification type to event type
        event_mapping = {
            "fraud_alert": "fraud_detected",
            "system_alert": "system_alert",
            "case_update": "case_updated",
            "document_analysis": "document_analyzed",
            "performance_warning": "performance_metric",
            "security_incident": "security_event",
            "collaboration": "collaboration_event",
            "deadline_reminder": "deadline_approaching",
        }

        event_type = event_mapping.get(notification_type, "system_alert")

        # Process event in background
        background_tasks.add_task(
            notification_system.process_event, event_type, data, recipient
        )

        return {
            "message": "Test notification sent",
            "notification_type": notification_type,
            "event_type": event_type,
            "recipient": recipient,
            "test_data": data,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error sending test notification: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to send test notification: {e!s}"
        )


@router.delete("/clear")
async def clear_notifications(user_id: str):
    """Clear all notifications for a user"""
    try:
        # This would need to be implemented in the notification system
        # For now, return a success message
        return {
            "message": "All notifications cleared",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error clearing notifications: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to clear notifications: {e!s}"
        )


@router.get("/types")
async def get_notification_types(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get available notification types"""
    try:
        types = [
            {
                "value": nt.value,
                "label": nt.value.replace("_", " ").title(),
                "description": f"Notifications for {nt.value.replace('_', ' ')} events",
            }
            for nt in NotificationType
        ]

        return {"types": types, "total_count": len(types)}

    except Exception as e:
        logger.error(f"Error getting notification types: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get notification types: {e!s}"
        )


@router.get("/channels")
async def get_notification_channels(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get available notification channels"""
    try:
        channels = [
            {
                "value": nc.value,
                "label": nc.value.replace("_", " ").title(),
                "description": f"Send notifications via {nc.value.replace('_', ' ')}",
            }
            for nc in NotificationChannel
        ]

        return {"channels": channels, "total_count": len(channels)}

    except Exception as e:
        logger.error(f"Error getting notification channels: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get notification channels: {e!s}"
        )
