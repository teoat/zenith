import json

from fastapi import Request

from app.services.infrastructure.security.audit_service import audit_service
from core.logging import logger


# Utility function for safe service calls with graceful degradation
def safe_call(func, default=None, log_errors=True):
    """
    Safely call a function that might fail, returning default value on error.
    Useful for optional monitoring/analytics services that shouldn't break the app.
    """
    try:
        return func()
    except Exception as e:
        if log_errors:
            logger.debug(f"Safe call failed for {func.__name__ if hasattr(func, '__name__') else 'function'}: {e}")
        return default


# Security Audit Logging Functions
def log_security_event(
    event_type: str,
    user_id: str | None = None,
    details: dict | None = None,
    request: Request = None,
):
    """Log security-related events"""
    try:
        audit_details = {
            "event_type": event_type,
            "user_id": user_id or "anonymous",
            "timestamp": "now",
            "details": details or {},
        }

        if request:
            audit_details.update(
                {
                    "ip_address": request.client.host if request.client else "unknown",
                    "user_agent": request.headers.get("user-agent", "unknown"),
                    "endpoint": str(request.url),
                    "method": request.method,
                }
            )

        # Log to audit service
        audit_service.log_security_event(
            user_id=user_id,
            action=event_type,
            resource_type="security",
            details=json.dumps(audit_details),
        )

        # Also log to application log
        logger.warning(f"Security Event: {event_type} - User: {user_id} - Details: {details}")

    except Exception as e:
        logger.error(f"Failed to log security event: {e}")


def log_auth_failure(user_id: str, reason: str, request: Request = None):
    """Log authentication failures"""
    log_security_event(
        "AUTH_FAILURE",
        user_id=user_id,
        details={"reason": reason, "attempted_login": True},
        request=request,
    )


def log_suspicious_activity(activity_type: str, user_id: str, details: dict, request: Request = None):
    """Log suspicious activities"""
    log_security_event(
        f"SUSPICIOUS_{activity_type.upper()}",
        user_id=user_id,
        details=details,
        request=request,
    )
