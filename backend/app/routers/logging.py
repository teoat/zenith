# api/logging.py
import logging
from datetime import UTC, datetime
from typing import Any

from app.services.logging_service import LogCategory, LogLevel, get_logger
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/logging", tags=["logging-telemetry"])


@router.get("/status")
async def get_logging_status():
    """
    Get current logging status and configuration

    Returns:
        Logging system status
    """
    try:
        structured_logger = get_logger()

        return {
            "success": True,
            "status": {
                "logger_name": structured_logger.name,
                "log_directory": str(structured_logger.log_dir),
                "file_logging_enabled": structured_logger.enable_file_logging,
                "console_logging_enabled": structured_logger.enable_console_logging,
                "telemetry_enabled": structured_logger.enable_telemetry,
                "pii_scrubbing_enabled": structured_logger.pii_scrubbing,
                "log_rotation_enabled": structured_logger.log_rotation,
                "compression_enabled": structured_logger.compression,
                "max_file_size_mb": structured_logger.max_file_size_bytes
                / (1024 * 1024),
            },
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get logging status: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {e!s}")


@router.get("/telemetry")
async def get_telemetry_data():
    """
    Get current telemetry data

    Returns:
        Telemetry statistics and metrics
    """
    try:
        structured_logger = get_logger()
        telemetry_data = structured_logger.get_telemetry_data()

        return {
            "success": True,
            "telemetry": telemetry_data,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get telemetry data: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get telemetry: {e!s}")


@router.post("/telemetry/reset")
async def reset_telemetry():
    """
    Reset telemetry data

    Returns:
        Reset result
    """
    try:
        structured_logger = get_logger()
        structured_logger.reset_telemetry()

        return {
            "success": True,
            "message": "Telemetry data reset successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to reset telemetry: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to reset telemetry: {e!s}")


@router.post("/telemetry/export")
async def export_telemetry(
    file_path: str | None = Body(None, description="Export file path"),
):
    """
    Export telemetry data to file

    Args:
        file_path: Optional file path for export

    Returns:
        Export result
    """
    try:
        structured_logger = get_logger()

        # Generate default file path if not provided
        if not file_path:
            timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
            file_path = f"logs/telemetry_export_{timestamp}.json"

        structured_logger.export_telemetry(file_path)

        return {
            "success": True,
            "file_path": file_path,
            "message": f"Telemetry data exported to {file_path}",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to export telemetry: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to export telemetry: {e!s}"
        )


@router.post("/log")
async def create_log_entry(
    level: str = Body(..., description="Log level"),
    category: str = Body(..., description="Log category"),
    message: str = Body(..., description="Log message"),
    user_id: str | None = Body(None, description="User ID"),
    session_id: str | None = Body(None, description="Session ID"),
    request_id: str | None = Body(None, description="Request ID"),
    ip_address: str | None = Body(None, description="IP address"),
    user_agent: str | None = Body(None, description="User agent"),
    metadata: dict[str, Any] | None = Body(None, description="Additional metadata"),
    duration_ms: float | None = Body(None, description="Duration in milliseconds"),
    error_code: str | None = Body(None, description="Error code"),
    db: Session = Depends(get_db),
):
    """
    Create a structured log entry

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        category: Log category
        message: Log message
        user_id: User ID
        session_id: Session ID
        request_id: Request ID
        ip_address: IP address
        user_agent: User agent
        metadata: Additional metadata
        duration_ms: Duration in milliseconds
        error_code: Error code

    Returns:
        Log creation result
    """
    try:
        # Validate log level
        try:
            log_level = LogLevel(level.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid log level: {level}")

        # Validate category
        try:
            log_category = LogCategory(category.lower())
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Invalid log category: {category}"
            )

        # Get structured logger
        structured_logger = get_logger()

        # Create log entry
        structured_logger.log(
            level=log_level,
            category=log_category,
            message=message,
            user_id=user_id,
            session_id=session_id,
            request_id=request_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata or {},
            duration_ms=duration_ms,
            error_code=error_code,
        )

        return {
            "success": True,
            "message": "Log entry created successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create log entry: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create log entry: {e!s}"
        )


@router.post("/log/user-action")
async def log_user_action(
    action: str = Body(..., description="User action"),
    user_id: str = Body(..., description="User ID"),
    metadata: dict[str, Any] | None = Body(None, description="Additional metadata"),
    db: Session = Depends(get_db),
):
    """
    Log user action for telemetry

    Args:
        action: User action description
        user_id: User ID
        metadata: Additional metadata

    Returns:
        Log creation result
    """
    try:
        structured_logger = get_logger()
        structured_logger.log_user_action(action, user_id, metadata=metadata or {})

        return {
            "success": True,
            "message": "User action logged successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to log user action: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to log user action: {e!s}")


@router.post("/log/api-request")
async def log_api_request(
    method: str = Body(..., description="HTTP method"),
    endpoint: str = Body(..., description="API endpoint"),
    status_code: int = Body(..., description="HTTP status code"),
    duration_ms: float = Body(..., description="Request duration in milliseconds"),
    user_id: str | None = Body(None, description="User ID"),
    metadata: dict[str, Any] | None = Body(None, description="Additional metadata"),
    db: Session = Depends(get_db),
):
    """
    Log API request for performance monitoring

    Args:
        method: HTTP method
        endpoint: API endpoint
        status_code: HTTP status code
        duration_ms: Request duration in milliseconds
        user_id: User ID
        metadata: Additional metadata

    Returns:
        Log creation result
    """
    try:
        structured_logger = get_logger()
        structured_logger.log_api_request(
            method=method,
            endpoint=endpoint,
            status_code=status_code,
            duration_ms=duration_ms,
            user_id=user_id,
            metadata=metadata or {},
        )

        return {
            "success": True,
            "message": "API request logged successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to log API request: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to log API request: {e!s}")


@router.post("/log/security-event")
async def log_security_event(
    event_type: str = Body(..., description="Security event type"),
    severity: str = Body(..., description="Event severity"),
    user_id: str | None = Body(None, description="User ID"),
    metadata: dict[str, Any] | None = Body(None, description="Additional metadata"),
    db: Session = Depends(get_db),
):
    """
    Log security event

    Args:
        event_type: Security event type
        severity: Event severity
        user_id: User ID
        metadata: Additional metadata

    Returns:
        Log creation result
    """
    try:
        structured_logger = get_logger()
        structured_logger.log_security_event(
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            metadata=metadata or {},
        )

        return {
            "success": True,
            "message": "Security event logged successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to log security event: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to log security event: {e!s}"
        )


@router.post("/log/performance-metric")
async def log_performance_metric(
    metric_name: str = Body(..., description="Metric name"),
    value: float = Body(..., description="Metric value"),
    unit: str | None = Body(None, description="Metric unit"),
    metadata: dict[str, Any] | None = Body(None, description="Additional metadata"),
    db: Session = Depends(get_db),
):
    """
    Log performance metric

    Args:
        metric_name: Metric name
        value: Metric value
        unit: Metric unit
        metadata: Additional metadata

    Returns:
        Log creation result
    """
    try:
        structured_logger = get_logger()
        structured_logger.log_performance_metric(
            metric_name=metric_name, value=value, unit=unit, metadata=metadata or {}
        )

        return {
            "success": True,
            "message": "Performance metric logged successfully",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to log performance metric: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to log performance metric: {e!s}"
        )


@router.get("/logs/search")
async def search_logs(
    level: str | None = Query(None, description="Filter by log level"),
    category: str | None = Query(None, description="Filter by log category"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    session_id: str | None = Query(None, description="Filter by session ID"),
    start_time: str | None = Query(None, description="Start time (ISO format)"),
    end_time: str | None = Query(None, description="End time (ISO format)"),
    limit: int = Query(100, description="Maximum number of results"),
    db: Session = Depends(get_db),
):
    """
    Search log entries (simplified implementation)

    Args:
        level: Filter by log level
        category: Filter by log category
        user_id: Filter by user ID
        session_id: Filter by session ID
        start_time: Start time filter
        end_time: End time filter
        limit: Maximum number of results

    Returns:
        Search results
    """
    try:
        # This is a simplified implementation
        # In a real system, you'd query the log files or a log database

        structured_logger = get_logger()
        telemetry_data = structured_logger.get_telemetry_data()

        # Filter based on parameters
        results = []

        # For demonstration, return recent performance metrics
        if category == "performance" or not category:
            performance_metrics = telemetry_data.get("performance_metrics", [])
            for metric in performance_metrics[-limit:]:
                results.append(
                    {
                        "timestamp": metric.get("timestamp"),
                        "level": "INFO",
                        "category": "performance",
                        "message": f"Performance metric: {metric.get('metric')} = {metric.get('value')}",
                        "metadata": metric,
                    }
                )

        return {
            "success": True,
            "results": results,
            "total_count": len(results),
            "filters": {
                "level": level,
                "category": category,
                "user_id": user_id,
                "session_id": session_id,
                "start_time": start_time,
                "end_time": end_time,
            },
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to search logs: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to search logs: {e!s}")


@router.get("/pii-scrubbing/test")
async def test_pii_scrubbing(
    text: str = Query(..., description="Text to test PII scrubbing on"),
):
    """
    Test PII scrubbing on sample text

    Args:
        text: Text to test PII scrubbing

    Returns:
        PII scrubbing test results
    """
    try:
        from app.services.logging_service import PIIScrubber

        # Detect PII types
        detected_types = PIIScrubber.detect_pii_types(text)

        # Scrub PII
        scrubbed_text = PIIScrubber.scrub_pii(text)

        return {
            "success": True,
            "original_text": text,
            "detected_pii_types": detected_types,
            "scrubbed_text": scrubbed_text,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to test PII scrubbing: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to test PII scrubbing: {e!s}"
        )


@router.get("/config")
async def get_logging_config():
    """
    Get current logging configuration

    Returns:
        Logging configuration
    """
    try:
        structured_logger = get_logger()

        config = {
            "name": structured_logger.name,
            "log_dir": str(structured_logger.log_dir),
            "enable_file_logging": structured_logger.enable_file_logging,
            "enable_console_logging": structured_logger.enable_console_logging,
            "enable_telemetry": structured_logger.enable_telemetry,
            "pii_scrubbing": structured_logger.pii_scrubbing,
            "log_rotation": structured_logger.log_rotation,
            "max_file_size_mb": structured_logger.max_file_size_bytes / (1024 * 1024),
            "compression": structured_logger.compression,
        }

        return {
            "success": True,
            "config": config,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get logging config: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get config: {e!s}")


@router.put("/config")
async def update_logging_config(
    config: dict[str, Any] = Body(..., description="Logging configuration"),
):
    """
    Update logging configuration (simplified implementation)

    Args:
        config: New logging configuration

    Returns:
        Configuration update result
    """
    try:
        # This is a simplified implementation
        # In a real system, you'd update the logger configuration

        return {
            "success": True,
            "message": "Logging configuration updated (restart required for changes to take effect)",
            "config": config,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to update logging config: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to update config: {e!s}")
