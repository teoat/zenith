# Logging Router API

from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

from app.schemas.logging import (
    ErrorForwardRequest,
    ErrorForwardResponse,
    HealthStatusRequest,
    LoggingStatusResponse,
    PerformanceMetricsRequest,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.routers.auth import get_current_user
from app.services.logging_service import EnhancedLoggingService


# Dependency
def get_db():
    """Get database session"""
    from core.database import SessionLocal

    return SessionLocal()


# Create API router
router = APIRouter(prefix="/api/logs", tags=["frontend-logging", "monitoring"], dependencies=[Depends(get_db)])


# Error forwarding endpoint
@router.post("/errors", response_model=ErrorForwardResponse)
async def log_frontend_error(request: ErrorForwardRequest, db: Session = Depends(get_db)):
    """Log frontend error with comprehensive context"""
    logging_service = EnhancedLoggingService()

    try:
        await logging_service.log_frontend_error(request)

        return ErrorForwardResponse(success=True, message="Frontend error logged successfully", correlation_id=request.correlation_id)
    except HTTPException as e:
        await logging_service.log_frontend_error(
            {
                "type": "http_exception",
                "message": e.detail,
                "component": request.component,
                "status": e.status_code,
                "context": {
                    "user_id": await get_current_user(db),
                    "route": request.route,
                    "method": request.method,
                    "ip_address": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent", "Unknown"),
                },
            }
        )

        return ErrorForwardResponse(
            success=False, message=f"HTTP {e.status_code}: Failed to log error", correlation_id=request.correlation_id
        )
    except Exception as e:
        return ErrorForwardResponse(success=False, message=f"Internal server error: {str(e)}", correlation_id=request.correlation_id)


# Performance metrics endpoint
@router.post("/performance", response_model=bool)
async def log_performance_metric(request: PerformanceMetricsRequest, db: Session = Depends(get_db)):
    """Log performance metric from frontend"""
    logging_service = EnhancedLoggingService()

    try:
        await logging_service.log_performance_metric(request)
        return True
    except Exception:
        return False


# Health status endpoint
@router.get("/status", response_model=HealthStatusRequest)
async def get_system_health(db: Session = Depends(get_db), components: Optional[List[str]] = None, include_details: bool = False):
    """Get overall system health including logging"""
    logging_service = EnhancedLoggingService()

    try:
        # This would query actual health of all components
        health_status = {"status": "healthy", "components": {}, "last_updated": datetime.now(UTC).isoformat()}

        if components:
            for component_name in components:
                component_health = await logging_service.get_component_health(component_name)
                health_status["components"][component_name] = component_health["status"]
        else:
            health_status["components"] = {}

        return HealthStatusRequest(
            status=health_status["status"],
            message="System operational",
            components=health_status["components"],
            details=health_status["details"],
            timestamp=health_status["timestamp"],
        )

    except Exception as e:
        return HealthStatusRequest(status="error", message=f"Failed to get system health: {str(e)}", details={})


# Recent errors endpoint
@router.get("/errors", response_model=List[Dict[str, Any]])
async def get_recent_errors(request: Query, db: Session = Depends(get_db), limit: int = 100, hours: int = 24):
    """Get recent frontend errors for dashboard"""
    logging_service = EnhancedLoggingService()

    try:
        errors = await logging_service.get_recent_errors(limit=limit, hours=hours)
        return List[Dict[str, Any]](errors)
    except Exception:
        return []


# Real-time monitoring endpoint
@router.websocket("/monitoring")
async def get_realtime_logs():
    """WebSocket endpoint for real-time log streaming"""
    # This would implement WebSocket streaming of logs from backend
    # For now, return mock implementation
    return {"status": "operational", "endpoint": "/monitoring"}


# Export enhanced logging service
__all__ = [
    "router",
    "EnhancedLoggingService",
    "ErrorForwardRequest",
    "ErrorForwardResponse",
    "PerformanceMetricsRequest",
    "HealthStatusRequest",
    "LoggingStatusResponse",
]
