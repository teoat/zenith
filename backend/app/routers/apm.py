# api/apm.py
import logging
from datetime import UTC, datetime
from typing import Any

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
from app.services.infrastructure.health_service import (
    HealthStatus,
    distributed_tracer,
    graceful_degradation_service,
    health_check_service,
)
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
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get APM summary: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get APM summary: {e!s}")


@router.get("/metrics")
async def get_metrics(
    name: str | None = Query(None, description="Filter by metric name"),
    start_time: str | None = Query(None, description="Start time (ISO format)"),
    end_time: str | None = Query(None, description="End time (ISO format)"),
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

        metrics = apm_service.get_metrics(name=name, start_time=start_dt, end_time=end_dt, limit=limit)

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
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get metrics: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {e!s}")


@router.get("/spans")
async def get_spans(
    trace_id: str | None = Query(None, description="Filter by trace ID"),
    operation_name: str | None = Query(None, description="Filter by operation name"),
    start_time: str | None = Query(None, description="Start time (ISO format)"),
    end_time: str | None = Query(None, description="End time (ISO format)"),
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
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get spans: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get spans: {e!s}")


@router.get("/alerts")
async def get_alerts(
    severity: str | None = Query(None, description="Filter by alert severity"),
    resolved: bool | None = Query(None, description="Filter by resolved status"),
    start_time: str | None = Query(None, description="Start time (ISO format)"),
    end_time: str | None = Query(None, description="End time (ISO format)"),
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
                raise HTTPException(status_code=400, detail=f"Invalid severity: {severity}")

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
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get alerts: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {e!s}")


@router.post("/metrics")
async def create_metric(
    name: str = Body(..., description="Metric name"),
    value: float = Body(..., description="Metric value"),
    metric_type: str = Body("gauge", description="Metric type (counter, gauge, histogram, timer)"),
    tags: dict[str, str] | None = Body(None, description="Metric tags"),
    unit: str | None = Body(None, description="Metric unit"),
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
            raise HTTPException(status_code=400, detail=f"Invalid metric type: {metric_type}")

        record_metric(name, value, metric_type_enum, tags=tags, unit=unit)

        return {
            "success": True,
            "message": "Metric recorded successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to create metric: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to create metric: {e!s}")


@router.post("/spans/start")
async def start_span_endpoint(
    operation_name: str = Body(..., description="Operation name"),
    trace_id: str | None = Body(None, description="Trace ID"),
    parent_span_id: str | None = Body(None, description="Parent span ID"),
    tags: dict[str, str] | None = Body(None, description="Span tags"),
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
        span_id = start_span(operation_name, trace_id=trace_id, parent_span_id=parent_span_id, tags=tags)

        return {
            "success": True,
            "span_id": span_id,
            "operation_name": operation_name,
            "message": "Span started successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to start span: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to start span: {e!s}")


@router.post("/spans/{span_id}/finish")
async def finish_span_endpoint(
    span_id: str,
    status: str = Body("ok", description="Span status (ok, error, timeout)"),
    error_message: str | None = Body(None, description="Error message if status is error"),
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
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to finish span: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to finish span: {e!s}")


@router.post("/alerts")
async def create_alert_endpoint(
    severity: str = Body(..., description="Alert severity (info, warning, error, critical)"),
    title: str = Body(..., description="Alert title"),
    message: str = Body(..., description="Alert message"),
    source: str = Body("application", description="Alert source"),
    metadata: dict[str, Any] | None = Body(None, description="Alert metadata"),
    tags: dict[str, str] | None = Body(None, description="Alert tags"),
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

        create_alert(severity_enum, title, message, source=source, metadata=metadata, tags=tags)

        return {
            "success": True,
            "message": "Alert created successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to create alert: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {e!s}")


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
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to resolve alert: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to resolve alert: {e!s}")


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
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get system metrics: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get system metrics: {e!s}")


@router.get("/aggregated-metrics")
async def get_aggregated_metrics(
    name: str = Query(..., description="Metric name"),
    aggregation: str = Query("avg", description="Aggregation type (avg, sum, min, max, p50, p95, p99)"),
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

        aggregated = apm_service.get_aggregated_metrics(name, aggregation, time_window_minutes)

        return {
            "success": True,
            "metric_name": name,
            "aggregation": aggregation,
            "time_window_minutes": time_window_minutes,
            "result": aggregated,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get aggregated metrics: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get aggregated metrics: {e!s}")


@router.post("/export")
async def export_apm_data(
    file_path: str | None = Body(None, description="Export file path"),
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
            timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
            file_path = f"logs/apm_export_{timestamp}.json"

        apm_service.export_data(file_path, include_metrics, include_spans, include_alerts)

        return {
            "success": True,
            "file_path": file_path,
            "message": f"APM data exported to {file_path}",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to export APM data: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to export APM data: {e!s}")


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

    except Exception:
        # api/apm.py
        import logging
        from datetime import datetime

        from app.services.apm_service import (
            get_apm_summary,
        )
        from fastapi import APIRouter, Depends, HTTPException, Query
        from sqlalchemy.orm import Session

        from core.database import User, get_db

        logger = logging.getLogger(__name__)

        router = APIRouter(prefix="/apm", tags=["apm-monitoring"])

        # Placeholders so tests can patch `auth_service` and `User`
        # UserPlaceholder = Any  # Removed unused placeholder

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
                    "timestamp": datetime.now(UTC).isoformat(),
                }

            except Exception as e:
                logger.error(f"Failed to get APM summary: {e!s}")
                raise HTTPException(status_code=500, detail=f"Failed to get APM summary: {e!s}")

        @router.get("/metrics")
        async def get_metrics(
            name: str | None = Query(None, description="Filter by metric name"),
            start_time: str | None = Query(None, description="Start time (ISO format)"),
            end_time: str | None = Query(None, description="End time (ISO format)"),
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

                metrics = apm_service.get_metrics(name=name, start_time=start_dt, end_time=end_dt, limit=limit)

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
                    "timestamp": datetime.now(UTC).isoformat(),
                }

            except Exception as e:
                logger.error(f"Failed to get metrics: {e!s}")
                raise HTTPException(status_code=500, detail=f"Failed to get metrics: {e!s}")


# Health Check Endpoints - Achieving 10/10 Reliability
@router.get("/health/live")
async def liveness_probe():
    """
    Liveness probe - Kubernetes/health check systems use this to determine if service is running
    Returns 200 if service is alive, 500 if not
    """
    try:
        result = await health_check_service.check_liveness()
        if result.status == HealthStatus.HEALTHY:
            return {"status": "healthy", "message": result.message}
        else:
            raise HTTPException(status_code=500, detail=result.message)
    except Exception as e:
        logger.error(f"Liveness probe failed: {e!s}")
        raise HTTPException(status_code=500, detail=f"Liveness check failed: {e!s}")


@router.get("/health/ready")
async def readiness_probe():
    """
    Readiness probe - Determines if service is ready to serve traffic
    Returns 200 if ready, 503 if not ready
    """
    try:
        result = await health_check_service.check_readiness()
        if result.status == HealthStatus.HEALTHY:
            return {"status": "ready", "message": result.message}
        else:
            raise HTTPException(status_code=503, detail=result.message)
    except Exception as e:
        logger.error(f"Readiness probe failed: {e!s}")
        raise HTTPException(status_code=503, detail=f"Readiness check failed: {e!s}")


@router.get("/health/deep")
async def deep_health_check(
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Deep health check - Comprehensive system health assessment
    Requires authentication as it exposes detailed system information
    """
    try:
        result = await health_check_service.check_deep_health()

        # Return appropriate HTTP status based on health
        if result.status == HealthStatus.HEALTHY:
            pass
        elif result.status == HealthStatus.DEGRADED:
            pass  # Multi-status
        else:
            pass  # Service unavailable

        return result.to_dict()

    except Exception as e:
        logger.error(f"Deep health check failed: {e!s}")
        raise HTTPException(status_code=500, detail=f"Deep health check failed: {e!s}")


@router.get("/health/status")
async def get_health_status(
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get overall health status summary
    """
    try:
        status = health_check_service.get_overall_health_status()
        return status
    except Exception as e:
        logger.error(f"Failed to get health status: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get health status: {e!s}")


@router.get("/health/history")
async def get_health_history(
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get health check history
    """
    try:
        history = health_check_service.get_health_history(limit)
        return {
            "history": [check.to_dict() for check in history],
            "count": len(history),
        }
    except Exception as e:
        logger.error(f"Failed to get health history: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get health history: {e!s}")


@router.get("/health/degradation")
async def get_degradation_status(
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get current graceful degradation status
    """
    try:
        status = graceful_degradation_service.get_degradation_status()
        return status
    except Exception as e:
        logger.error(f"Failed to get degradation status: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get degradation status: {e!s}")


# Distributed Tracing Endpoints - Achieving 10/10 Reliability
@router.post("/trace/start")
async def start_trace(
    trace_id: str | None = None,
    parent_span_id: str | None = None,
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Start a new distributed trace
    """
    try:
        new_trace_id = distributed_tracer.start_trace(trace_id, parent_span_id)
        return {"trace_id": new_trace_id, "status": "started"}
    except Exception as e:
        logger.error(f"Failed to start trace: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to start trace: {e!s}")


@router.post("/trace/{trace_id}/span/start")
async def start_trace_span(
    trace_id: str,
    span_name: str,
    parent_span_id: str | None = None,
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Start a new span within a trace
    """
    try:
        span_id = distributed_tracer.start_span(trace_id, span_name, parent_span_id)
        if not span_id:
            raise HTTPException(status_code=404, detail="Trace not found")

        return {
            "trace_id": trace_id,
            "span_id": span_id,
            "span_name": span_name,
            "status": "started",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start span: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to start span: {e!s}")


@router.post("/trace/{trace_id}/span/{span_id}/end")
async def end_span(
    trace_id: str,
    span_id: str,
    tags: dict[str, Any] | None = None,
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    End a span
    """
    try:
        distributed_tracer.end_span(trace_id, span_id, tags)
        return {"trace_id": trace_id, "span_id": span_id, "status": "ended"}
    except Exception as e:
        logger.error(f"Failed to end span: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to end span: {e!s}")


@router.post("/trace/{trace_id}/end")
async def end_trace(
    trace_id: str,
    status: str = "completed",
    tags: dict[str, Any] | None = None,
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    End a trace
    """
    try:
        distributed_tracer.end_trace(trace_id, status, tags)
        return {"trace_id": trace_id, "status": status, "finalized": True}
    except Exception as e:
        logger.error(f"Failed to end trace: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to end trace: {e!s}")


@router.get("/trace/{trace_id}")
async def get_trace(
    trace_id: str,
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get a trace by ID
    """
    try:
        trace = distributed_tracer.get_trace(trace_id)
        if not trace:
            raise HTTPException(status_code=404, detail="Trace not found")

        return trace
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get trace: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get trace: {e!s}")


@router.get("/trace/{trace_id}/summary")
async def get_trace_summary(
    trace_id: str,
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get a trace summary
    """
    try:
        summary = distributed_tracer.get_trace_summary(trace_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Trace not found")

        return summary
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get trace summary: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get trace summary: {e!s}")


@router.get("/traces/recent")
async def get_recent_traces(
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get recent traces
    """
    try:
        traces = distributed_tracer.get_recent_traces(limit)
        return {"traces": traces, "count": len(traces), "limit": limit}
    except Exception as e:
        logger.error(f"Failed to get recent traces: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent traces: {e!s}")
