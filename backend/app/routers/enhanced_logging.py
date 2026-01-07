# Enhanced Backend Logging Router

from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

from app.schemas.logging import (
    ErrorForwardRequest,
    ErrorForwardResponse,
    HealthStatusRequest,
    LoggingStatusResponse,
    PerformanceMetricsRequest,
)
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session


from app.services.logging_service import LogCategory, LogLevel, create_log_entry, get_logger
from core.database import get_db

# Error schemas imported from app.schemas.logging


# Logging Status
class LoggingStatus(BaseModel):
    status: str
    message: str
    components: Optional[Dict[str, Any]] = None
    details: Optional[Dict[str, Any]] = None


# Enhanced Logging Service
class EnhancedLoggingService:
    def __init__(self):
        self.logger = get_logger("frontend_integration", LogCategory.FRONTEND)

    async def log_frontend_error(self, error_data: ErrorForwardRequest) -> ErrorForwardResponse:
        """Log frontend error with full context"""
        # Create comprehensive log entry
        log_entry = create_log_entry(
            logger=self.logger,
            level=LogLevel.ERROR,
            category=LogCategory.FRONTEND,
            message=f"Frontend {error_data.type}: {error_data.message}",
            details={
                "source": "frontend",
                "component": error_data.component,
                "route": error_data.route,
                "user_agent": error_data.browser_info.get("userAgent", "Unknown"),
                "user_id": error_data.user_id,
                "session_id": error_data.session_id,
                "ip_address": error_data.get("ip_address", "Unknown"),
                "severity": error_data.severity,
                "error_type": error_data.type,
                "stack_trace": error_data.stack_trace,
            },
        )

        # Log the error
        try:
            self.logger.error("Frontend error logged", extra=log_entry)
            return ErrorForwardResponse(
                success=True, message="Frontend error logged successfully", correlation_id=log_entry["correlation_id"]
            )
        except Exception as e:
            self.logger.error(f"Failed to log frontend error: {e!s}")
            return ErrorForwardResponse(success=False, message=f"Failed to log frontend error: {e!s}")

    async def log_performance_metric(self, metric_data: PerformanceMetricsRequest) -> bool:
        """Log frontend performance metric"""
        # Create performance log entry
        log_entry = create_log_entry(
            logger=self.logger,
            level=LogLevel.INFO,
            category=LogCategory.PERFORMANCE,
            message=f"Performance metric: {metric_data.component} - {metric_data.metric}: {metric_data.value}",
            details={
                "source": "frontend",
                "component": metric_data.component,
                "metric": metric_data.metric,
                "value": metric_data.value,
                "unit": metric_data.unit,
                "user_context": metric_data.user_context,
                "session_id": metric_data.session_id,
                "ip_address": await self._get_client_ip(),
                "timestamp": metric_data.timestamp,
                "tags": metric_data.tags,
            },
        )

        try:
            self.logger.info("Performance metric logged", extra=log_entry)
            return True
        except Exception as e:
            self.logger.error(f"Failed to log performance metric: {e!s}")
            return False

    async def get_recent_errors(self, limit: int = 100, hours: int = 24) -> List[Dict[str, Any]]:
        """Get recent frontend errors for monitoring dashboard"""
        try:
            # This would query the database for recent errors
            # For now, return mock data
            errors = [
                {
                    "id": "error-1",
                    "type": "validation_error",
                    "message": "Form validation failed",
                    "component": "InvestigationWizard",
                    "severity": "medium",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "user_id": "user-123",
                },
                {
                    "id": "error-2",
                    "type": "network_error",
                    "message": "API request failed",
                    "component": "CodeReviewDashboard",
                    "severity": "high",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "user_id": "user-123",
                },
            ]
            return errors
        except Exception as e:
            self.logger.error(f"Failed to get recent errors: {e!s}")
            return []

    async def _get_client_ip(self) -> str:
        """Get client IP address from request context"""
        try:
            # In a real implementation, this would get from request context
            return await self._get_from_request_context("client_ip")
        except Exception:
            return "unknown"

    async def _get_from_request_context(self, key: str) -> Any:
        """Extract context from request for logging"""
        # This would integrate with FastAPI Request/Response context
        # For now, return default value
        return getattr(self, key, None, {})


# API Routes
router = APIRouter(prefix="/api/logs", tags=["frontend-logging", "monitoring"], dependencies=[Depends(get_db)])


@router.post("/errors", response_model=ErrorForwardResponse)
async def log_frontend_error(request: ErrorForwardRequest, db: Session = Depends(get_db)):
    """Log frontend error with comprehensive context"""
    logging_service = EnhancedLoggingService()

    result = await logging_service.log_frontend_error(request)
    return result


@router.post("/performance", response_model=bool)
async def log_performance_metric(request: PerformanceMetricsRequest, db: Session = Depends(get_db)):
    """Log frontend performance metric"""
    logging_service = EnhancedLoggingService()

    result = await logging_service.log_performance_metric(request)
    return result


@router.get("/status", response_model=LoggingStatusResponse)
async def get_logging_status():
    """Get current logging system status and health"""
    logging_service = EnhancedLoggingService()

    try:
        status = await logging_service.get_logging_status()
        return LoggingStatusResponse(
            success=True,
            message="Logging system operational",
            status=status,
            components=status["components"],
            details=status["details"],
        )
    except Exception as e:
        return LoggingStatusResponse(success=False, message=f"Failed to get logging status: {e!s}")


@router.get("/errors", response_model=List[Dict[str, Any]])
async def get_recent_errors(limit: int = Query(100, le=1000), hours: int = Query(24, le=86400), db: Session = Depends(get_db)):
    """Get recent frontend errors for monitoring dashboard"""
    logging_service = EnhancedLoggingService()

    errors = await logging_service.get_recent_errors(limit=limit, hours=hours)
    return errors


@router.get("/monitoring", response_model=Dict[str, Any])
async def get_system_health():
    """Get overall system health including frontend logging"""
    # This would aggregate health across all system components
    logging_service = EnhancedLoggingService()

    health_status = await logging_service.get_logging_status()

    return {
        "status": health_status.get("status", "healthy"),
        "logging_health": health_status.get("components", {}).get("logging_service", {}).get("status", "healthy"),
        "database_health": "healthy",  # Would check actual DB health
        "api_gateway_health": "healthy",  # Would check API health
        "overall_health": health_status.get("status", "healthy"),
        "components": health_status["components"],
        "details": health_status["details"],
        "last_updated": datetime.now(UTC).isoformat(),
    }


# Health Check Endpoint for Frontend
@router.get("/frontend-health", response_model=Dict[str, Any])
async def get_frontend_health():
    """Check frontend application health"""
    # This would perform various frontend health checks
    return {
        "status": "healthy",
        "checks": {
            "api_connectivity": True,
            "error_boundaries": True,
            "performance_metrics": True,
            "logging_status": "healthy",
        },
        "last_check": datetime.now(UTC).isoformat(),
        "user_agent": {"name": "Frontend Health Check", "version": "1.0.0"},
        "component_status": {
            "CodeReviewDashboard": "healthy",
            "InvestigationWizard": "healthy",
            "AIAssistant": "healthy",
        },
    }


# Dependencies
def get_logging_service():
    """Factory function for logging service"""
    return EnhancedLoggingService()


# Export
__all__ = [
    "router",
    "get_logging_service",
    "EnhancedLoggingService",
    "ErrorForwardRequest",
    "ErrorForwardResponse",
    "PerformanceMetricsRequest",
    "HealthStatusRequest",
    "LoggingStatusResponse",
    "create_log_entry",
]
