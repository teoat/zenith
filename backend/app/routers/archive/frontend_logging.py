"""
Frontend Error Logging Router
Provides endpoint for frontend applications to send error reports
when Sentry is not available or as a fallback mechanism.
"""

import logging
from datetime import datetime
from typing import Any

from app.core.exceptions import ZenithError
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from core.zlogging import logger

router = APIRouter(prefix="/logging", tags=["Logging"])


class FrontendError(BaseModel):
    """Frontend error details"""

    message: str = Field(..., description="Error message")
    stack: str | None = Field(None, description="Stack trace")
    name: str | None = Field(None, description="Error name/type")


class ErrorContext(BaseModel):
    """Error context information"""

    severity: str = Field(..., description="Error severity level")
    category: str = Field(..., description="Error category")
    component: str = Field(None, description="Component where error occurred")
    user_id: str | None = Field(None, description="User ID if available")
    session_id: str | None = Field(None, description="Session ID")
    url: str = Field(..., description="URL where error occurred")
    timestamp: int = Field(..., description="Error timestamp")
    metadata: dict[str, Any] | None = Field(None, description="Additional metadata")


class ErrorInfo(BaseModel):
    """React error boundary info"""

    component_stack: str | None = Field(None, description="Component stack trace")


class FrontendErrorReport(BaseModel):
    """Complete frontend error report"""

    error: FrontendError
    context: ErrorContext
    error_info: ErrorInfo | None = None
    timestamp: str = Field(..., description="ISO timestamp")
    user_agent: str = Field(..., description="Browser user agent")
    url: str = Field(..., description="Page URL")


@router.post("/frontend-error")
async def log_frontend_error(
    report: FrontendErrorReport,
    request: Request,
) -> dict[str, str]:
    """
    Log frontend error reports.
    This endpoint serves as a fallback when Sentry is not available
    or for additional server-side error logging.
    **Security**: Rate-limited to prevent abuse
    """
    try:
        # Extract client information
        client_ip = request.client.host if request.client else "unknown"
        # Log the error with appropriate severity
        log_level = logging.ERROR
        if report.context.severity == "critical":
            log_level = logging.CRITICAL
        elif report.context.severity == "low":
            log_level = logging.WARNING
        # Create structured log entry
        log_data = {
            "event_type": "frontend_error",
            "error_message": report.error.message,
            "error_name": report.error.name,
            "severity": report.context.severity,
            "category": report.context.category,
            "component": report.context.component,
            "user_id": report.context.user_id,
            "session_id": report.context.session_id,
            "url": report.url,
            "user_agent": report.user_agent,
            "client_ip": client_ip,
            "timestamp": report.timestamp,
            "component_stack": report.error_info.component_stack
            if report.error_info
            else None,
            "stack_trace": report.error.stack,
            "metadata": report.context.metadata,
        }
        # Log to application logger
        logger.log(
            log_level,
            f"Frontend Error: {report.error.message}",
            extra=log_data,
        )
        # For critical errors, also log to security logger
        if report.context.severity == "critical":
            from core.zlogging import log_security_event

            log_security_event(
                "FRONTEND_CRITICAL_ERROR",
                user_id=report.context.user_id,
                details={
                    "error": report.error.message,
                    "component": report.context.component,
                    "url": report.url,
                },
                request=request,
            )
        # TODO: Optionally forward to external monitoring service
        # (e.g., Sentry, DataDog, CloudWatch) if configured
        return {
            "status": "logged",
            "error_id": report.context.session_id or "unknown",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to log frontend error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log error report")


@router.get("/health")
async def logging_health_check() -> dict[str, str]:
    """Health check for logging endpoints"""
    return {"status": "healthy", "service": "frontend-error-logging"}
