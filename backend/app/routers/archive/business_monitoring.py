"""
Business Monitoring Router
Provides API endpoints for business metrics dashboard and alerting.
"""

from typing import Any

from app.services.infrastructure.business_alerting_service import (
    AlertSeverity,
    alerting_service,
)
from app.services.infrastructure.business_metrics_service import (
    business_metrics_service,
)
from core.database_connection import SessionLocal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel


def get_db():
    """Get database session with proper cleanup"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.core.exceptions import ZenithError
from core.zlogging import logger

router = APIRouter(
    prefix="/api/v1/monitoring/business",
    tags=["Business Monitoring"],
    responses={404: {"description": "Not found"}},
)


class AlertResponse(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    status: str
    metric_name: str
    current_value: float
    threshold_value: float
    anomaly_score: float | None
    created_at: str
    tags: dict[str, str]


class AlertAcknowledgeRequest(BaseModel):
    user_id: str | None = None


@router.get("/dashboard", response_model=dict[str, Any])
async def get_business_dashboard(
    hours: int = Query(
        24, description="Hours of historical data to include", ge=1, le=168
    ),
):
    """
    Get comprehensive business metrics dashboard data.
    Returns KPIs, metrics trends, active alerts, and overall health score.
    """
    try:
        dashboard = business_metrics_service.get_business_metrics_dashboard()
        return {"status": "success", "data": dashboard}
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to get business dashboard: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve business dashboard"
        )


@router.get("/alerts", response_model=dict[str, Any])
async def get_alerts(
    status: str | None = Query(None, description="Filter by alert status"),
    severity: str | None = Query(None, description="Filter by severity"),
    limit: int = Query(
        50, description="Maximum number of alerts to return", ge=1, le=200
    ),
):
    """
    Get alerts with optional filtering.
    Status options: active, acknowledged, resolved, escalated
    Severity options: low, medium, high, critical
    """
    try:
        # Convert string filters to enums
        severity_filter = None
        if severity:
            try:
                severity_filter = AlertSeverity(severity.lower())
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid severity: {severity}. Must be one of: low, medium, high, critical",
                )
        # Get alerts (simplified - in production add status filtering)
        if severity_filter:
            alerts = alerting_service.get_active_alerts(severity_filter)
        else:
            alerts = alerting_service.get_active_alerts()
        # Limit results
        alerts = alerts[:limit]
        return {
            "status": "success",
            "data": {
                "alerts": [AlertResponse(**alert.__dict__) for alert in alerts],
                "count": len(alerts),
                "total_active": len(alerting_service.get_active_alerts()),
            },
        }
    except HTTPException:
        raise
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to get alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve alerts")


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str, request: AlertAcknowledgeRequest, db=Depends(get_db)
):
    """Acknowledge an alert"""
    try:
        alerting_service.acknowledge_alert(alert_id, request.user_id)
        logger.info(
            f"Alert acknowledged: {alert_id}",
            extra={"alert_id": alert_id, "user_id": request.user_id},
        )
        return {"status": "success", "message": f"Alert {alert_id} acknowledged"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to acknowledge alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to acknowledge alert")


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Resolve an alert"""
    try:
        alerting_service.resolve_alert(alert_id)
        logger.info(f"Alert resolved: {alert_id}", extra={"alert_id": alert_id})
        return {"status": "success", "message": f"Alert {alert_id} resolved"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to resolve alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve alert")


@router.get("/alerts/summary", response_model=dict[str, Any])
async def get_alerts_summary():
    """Get alerts summary statistics"""
    try:
        summary = alerting_service.get_alerts_summary()
        return {"status": "success", "data": summary}
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to get alerts summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve alerts summary")


@router.post("/test-alert")
async def trigger_test_alert():
    """Trigger a test alert for demonstration (development only)"""
    try:
        # Trigger a test alert by checking a high value against rules
        alerts = alerting_service.check_metric_against_rules(
            "fraud_detections",
            1000,
            {
                "test": "true",
                "source": "manual_trigger",
            },  # Very high value to trigger alert
        )
        if alerts:
            return {
                "status": "success",
                "message": f"Test alert triggered: {alerts[0].title}",
                "alert_id": alerts[0].id,
            }
        else:
            return {
                "status": "success",
                "message": "Test alert rules checked but no alert triggered",
            }
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to trigger test alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger test alert")


@router.get("/health")
async def business_monitoring_health():
    """Health check for business monitoring services"""
    try:
        # Check if services are running
        dashboard = business_metrics_service.get_business_metrics_dashboard()
        alert_summary = alerting_service.get_alerts_summary()
        return {
            "status": "healthy",
            "services": {"business_metrics": "operational", "alerting": "operational"},
            "metrics": {
                "health_score": dashboard.get("health_score", 0),
                "active_alerts": alert_summary.get("active_alerts", 0),
            },
        }
    except (ZenithError, Exception) as e:
        logger.error(f"Business monitoring health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}
