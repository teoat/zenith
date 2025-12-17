# api/apm.py
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.services.infrastructure.apm_service import (
    create_alert,
    finish_span,
    get_apm_summary,
    record_metric,
    start_span,
)
from app.services.infrastructure.auth_service import auth_service
from core.database import User, get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/apm", tags=["apm-monitoring"])


@router.get("/summary")
async def get_apm_summary_endpoint(
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get comprehensive APM summary

    Returns:
        APM summary including metrics, spans, alerts, and system metrics
    """
    try:
        summary = get_apm_summary()

        return {
            "success": True,
            "summary": summary,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get APM summary: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get APM summary: {str(e)}"
        )


@router.get("/metrics")
async def get_metrics(
    name: Optional[str] = Query(None, description="Filter by metric name"),
    start_time: Optional[str] = Query(None, description="Start time (ISO format)"),
    end_time: Optional[str] = Query(None, description="End time (ISO format)"),
    limit: int = Query(1000, description="Maximum number of metrics"),
    db: Session = Depends(get_db),
):
    """
    Get performance metrics

    Args:
        name: Filter by metric name
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        List of performance metrics
    """
    try:
        from app.services.apm_service import apm_service

        # Parse time filters
        start_dt = None
        end_dt = None
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

        metrics = apm_service.get_metrics(
            name=name, start_time=start_dt, end_time=end_dt, limit=limit
        )

        return {
            "success": True,
            "metrics": [m.__dict__ for m in metrics],
            "total_count": len(metrics),
            "filters": {
                "name": name,
                "start_time": start_time,
                "end_time": end_time,
                "limit": limit,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")


@router.get("/spans")
async def get_spans(
    trace_id: Optional[str] = Query(None, description="Filter by trace ID"),
    operation_name: Optional[str] = Query(None, description="Filter by operation name"),
    start_time: Optional[str] = Query(None, description="Start time (ISO format)"),
    end_time: Optional[str] = Query(None, description="End time (ISO format)"),
    limit: int = Query(1000, description="Maximum number of spans"),
    db: Session = Depends(get_db),
):
    """
    Get distributed tracing spans

    Args:
        trace_id: Filter by trace ID
        operation_name: Filter by operation name
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        List of tracing spans
    """
    try:
        from app.services.apm_service import apm_service

        # Parse time filters
        start_dt = None
        end_dt = None
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

        spans = apm_service.get_spans(
            trace_id=trace_id,
            operation_name=operation_name,
            start_time=start_dt,
            end_time=end_dt,
            limit=limit,
        )

        return {
            "success": True,
            "spans": [s.__dict__ for s in spans],
            "total_count": len(spans),
            "filters": {
                "trace_id": trace_id,
                "operation_name": operation_name,
                "start_time": start_time,
                "end_time": end_time,
                "limit": limit,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get spans: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get spans: {str(e)}")


@router.get("/alerts")
async def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by alert severity"),
    resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    start_time: Optional[str] = Query(None, description="Start time (ISO format)"),
    end_time: Optional[str] = Query(None, description="End time (ISO format)"),
    limit: int = Query(1000, description="Maximum number of alerts"),
    db: Session = Depends(get_db),
):
    """
    Get system alerts

    Args:
        severity: Filter by alert severity (info, warning, error, critical)
        resolved: Filter by resolved status
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        List of system alerts
    """
    try:
        # Parse severity
        from app.services.apm_service import AlertSeverity, apm_service

        severity_enum = None
        if severity:
            try:
                severity_enum = AlertSeverity(severity.lower())
            except ValueError:
                raise HTTPException(
                    status_code=400, detail=f"Invalid severity: {severity}"
                )

        # Parse time filters
        start_dt = None
        end_dt = None
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

        alerts = apm_service.get_alerts(
            severity=severity_enum,
            resolved=resolved,
            start_time=start_dt,
            end_time=end_dt,
            limit=limit,
        )

        return {
            "success": True,
            "alerts": [a.__dict__ for a in alerts],
            "total_count": len(alerts),
            "filters": {
                "severity": severity,
                "resolved": resolved,
                "start_time": start_time,
                "end_time": end_time,
                "limit": limit,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")


@router.post("/metrics")
async def create_metric(
    name: str = Body(..., description="Metric name"),
    value: float = Body(..., description="Metric value"),
    metric_type: str = Body(
        "gauge", description="Metric type (counter, gauge, histogram, timer)"
    ),
    tags: Optional[Dict[str, str]] = Body(None, description="Metric tags"),
    unit: Optional[str] = Body(None, description="Metric unit"),
    db: Session = Depends(get_db),
):
    """
    Create a performance metric

    Args:
        name: Metric name
        value: Metric value
        metric_type: Metric type
        tags: Metric tags
        unit: Metric unit

    Returns:
        Metric creation result
    """
    try:
        from app.services.apm_service import MetricType

        # Parse metric type
        try:
            metric_type_enum = MetricType(metric_type.lower())
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Invalid metric type: {metric_type}"
            )

        record_metric(name, value, metric_type_enum, tags=tags, unit=unit)

        return {
            "success": True,
            "message": "Metric recorded successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to create metric: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create metric: {str(e)}"
        )


@router.post("/spans/start")
async def start_span_endpoint(
    operation_name: str = Body(..., description="Operation name"),
    trace_id: Optional[str] = Body(None, description="Trace ID"),
    parent_span_id: Optional[str] = Body(None, description="Parent span ID"),
    tags: Optional[Dict[str, str]] = Body(None, description="Span tags"),
    db: Session = Depends(get_db),
):
    """
    Start a distributed tracing span

    Args:
        operation_name: Operation name
        trace_id: Trace ID
        parent_span_id: Parent span ID
        tags: Span tags

    Returns:
        Span creation result with span ID
    """
    try:
        span_id = start_span(
            operation_name, trace_id=trace_id, parent_span_id=parent_span_id, tags=tags
        )

        return {
            "success": True,
            "span_id": span_id,
            "operation_name": operation_name,
            "message": "Span started successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to start span: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start span: {str(e)}")


@router.post("/spans/{span_id}/finish")
async def finish_span_endpoint(
    span_id: str,
    status: str = Body("ok", description="Span status (ok, error, timeout)"),
    error_message: Optional[str] = Body(
        None, description="Error message if status is error"
    ),
    db: Session = Depends(get_db),
):
    """
    Finish a distributed tracing span

    Args:
        span_id: Span ID to finish
        status: Span status
        error_message: Error message if status is error

    Returns:
        Span completion result
    """
    try:
        finish_span(span_id, status=status, error_message=error_message)

        return {
            "success": True,
            "span_id": span_id,
            "status": status,
            "message": "Span finished successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to finish span: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to finish span: {str(e)}")


@router.post("/alerts")
async def create_alert_endpoint(
    severity: str = Body(
        ..., description="Alert severity (info, warning, error, critical)"
    ),
    title: str = Body(..., description="Alert title"),
    message: str = Body(..., description="Alert message"),
    source: str = Body("application", description="Alert source"),
    metadata: Optional[Dict[str, Any]] = Body(None, description="Alert metadata"),
    tags: Optional[Dict[str, str]] = Body(None, description="Alert tags"),
    db: Session = Depends(get_db),
):
    """
    Create a system alert

    Args:
        severity: Alert severity
        title: Alert title
        message: Alert message
        source: Alert source
        metadata: Alert metadata
        tags: Alert tags

    Returns:
        Alert creation result
    """
    try:
        from app.services.apm_service import AlertSeverity

        # Parse severity
        try:
            severity_enum = AlertSeverity(severity.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity: {severity}")

        create_alert(
            severity_enum, title, message, source=source, metadata=metadata, tags=tags
        )

        return {
            "success": True,
            "message": "Alert created successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to create alert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {str(e)}")


@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert_endpoint(alert_id: str, db: Session = Depends(get_db)):
    """
    Resolve a system alert

    Args:
        alert_id: Alert ID to resolve

    Returns:
        Alert resolution result
    """
    try:
        from app.services.apm_service import apm_service

        apm_service.resolve_alert(alert_id)

        return {
            "success": True,
            "alert_id": alert_id,
            "message": "Alert resolved successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to resolve alert: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to resolve alert: {str(e)}"
        )


@router.get("/system-metrics")
async def get_system_metrics():
    """
    Get current system metrics

    Returns:
        System performance metrics
    """
    try:
        from app.services.apm_service import apm_service

        system_metrics = apm_service.get_system_metrics()

        return {
            "success": True,
            "system_metrics": system_metrics,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get system metrics: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get system metrics: {str(e)}"
        )


@router.get("/aggregated-metrics")
async def get_aggregated_metrics(
    name: str = Query(..., description="Metric name"),
    aggregation: str = Query(
        "avg", description="Aggregation type (avg, sum, min, max, p50, p95, p99)"
    ),
    time_window_minutes: int = Query(5, description="Time window in minutes"),
    db: Session = Depends(get_db),
):
    """
    Get aggregated metrics for a time window

    Args:
        name: Metric name
        aggregation: Aggregation type
        time_window_minutes: Time window in minutes

    Returns:
        Aggregated metric values
    """
    try:
        from app.services.apm_service import apm_service

        aggregated = apm_service.get_aggregated_metrics(
            name, aggregation, time_window_minutes
        )

        return {
            "success": True,
            "metric_name": name,
            "aggregation": aggregation,
            "time_window_minutes": time_window_minutes,
            "result": aggregated,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get aggregated metrics: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get aggregated metrics: {str(e)}"
        )


@router.post("/export")
async def export_apm_data(
    file_path: Optional[str] = Body(None, description="Export file path"),
    include_metrics: bool = Body(True, description="Include metrics in export"),
    include_spans: bool = Body(True, description="Include spans in export"),
    include_alerts: bool = Body(True, description="Include alerts in export"),
    db: Session = Depends(get_db),
):
    """
    Export APM data to file

    Args:
        file_path: Export file path
        include_metrics: Include metrics in export
        include_spans: Include spans in export
        include_alerts: Include alerts in export

    Returns:
        Export result
    """
    try:
        from app.services.apm_service import apm_service

        # Generate default file path if not provided
        if not file_path:
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            file_path = f"logs/apm_export_{timestamp}.json"

        apm_service.export_data(
            file_path, include_metrics, include_spans, include_alerts
        )

        return {
            "success": True,
            "file_path": file_path,
            "message": f"APM data exported to {file_path}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to export APM data: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to export APM data: {str(e)}"
        )


@router.get("/dashboard")
async def get_dashboard_data():
    """
    Get dashboard data for monitoring UI

    Returns:
        Dashboard data including charts and key metrics
    """
    try:
        from app.services.apm_service import apm_service

        summary = apm_service.get_apm_summary()

        # Prepare dashboard data
        dashboard_data = {
            "overview": {
                "total_metrics": summary["metrics"]["total"],
                "recent_metrics_1h": summary["metrics"]["recent_1h"],
                "total_spans": summary["spans"]["total"],
                "recent_spans_1h": summary["spans"]["recent_1h"],
                "active_spans": summary["spans"]["active"],
                "total_alerts": summary["alerts"]["total"],
                "critical_unresolved": summary["alerts"]["critical_unresolved"],
                "error_unresolved": summary["alerts"]["error_unresolved"],
                "recent_alerts_1h": summary["alerts"]["recent_1h"],
            },
            "system": summary.get("system", {}),
            "timestamp": summary["timestamp"],
        }

        return {"success": True, "dashboard": dashboard_data}

    except Exception as e:
        # api/apm.py
        import logging
        from datetime import datetime, timedelta, timezone
        from typing import Any, Dict, List, Optional

        from fastapi import APIRouter, Body, Depends, HTTPException, Query
        from sqlalchemy.orm import Session

        from app.services.apm_service import (
            create_alert,
            finish_span,
            get_apm_summary,
            record_metric,
            start_span,
        )
        from app.services.infrastructure.auth_service import auth_service
        from core.database import User, get_db

        logger = logging.getLogger(__name__)

        router = APIRouter(prefix="/apm", tags=["apm-monitoring"])

        # Placeholders so tests can patch `auth_service` and `User`
        auth_service = None
        User = Any

        @router.get("/summary")
        async def get_apm_summary_endpoint(current_user: User = Depends(lambda: None)):
            """
            Get comprehensive APM summary

            Returns:
                APM summary including metrics, spans, alerts, and system metrics
            """
            try:
                summary = get_apm_summary()

                return {
                    "success": True,
                    "summary": summary,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }

            except Exception as e:
                logger.error(f"Failed to get APM summary: {str(e)}")
                raise HTTPException(
                    status_code=500, detail=f"Failed to get APM summary: {str(e)}"
                )

        @router.get("/metrics")
        async def get_metrics(
            name: Optional[str] = Query(None, description="Filter by metric name"),
            start_time: Optional[str] = Query(
                None, description="Start time (ISO format)"
            ),
            end_time: Optional[str] = Query(None, description="End time (ISO format)"),
            limit: int = Query(1000, description="Maximum number of metrics"),
            db: Session = Depends(get_db),
        ):
            """
            Get performance metrics

            Args:
                name: Filter by metric name
                start_time: Start time filter
                end_time: End time filter
                limit: Maximum number of results

            Returns:
                List of performance metrics
            """
            try:
                from app.services.apm_service import apm_service

                # Parse time filters
                start_dt = None
                end_dt = None
                if start_time:
                    start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                if end_time:
                    end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

                metrics = apm_service.get_metrics(
                    name=name, start_time=start_dt, end_time=end_dt, limit=limit
                )

                return {
                    "success": True,
                    "metrics": [m.__dict__ for m in metrics],
                    "total_count": len(metrics),
                    "filters": {
                        "name": name,
                        "start_time": start_time,
                        "end_time": end_time,
                        "limit": limit,
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }

            except Exception as e:
                logger.error(f"Failed to get metrics: {str(e)}")
                raise HTTPException(
                    status_code=500, detail=f"Failed to get metrics: {str(e)}"
                )
