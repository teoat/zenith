"""
Deprecation Monitoring API Endpoints

Provides endpoints for viewing deprecated endpoint usage statistics
and migration warnings.
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.middleware.deprecated_monitor import (
    DEPRECATED_ENDPOINTS,
    get_deprecated_usage_stats,
    get_deprecation_warnings,
    reset_usage_stats,
)

router = APIRouter(prefix="/deprecation", tags=["Deprecation Monitoring"])


@router.get("/stats")
async def get_deprecation_stats():
    """
    Get statistics on deprecated endpoint usage

    Returns usage counts, unique users, and timing information
    for all deprecated endpoints.
    """
    try:
        stats = get_deprecated_usage_stats()

        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "deprecated_endpoints": stats,
            "total_deprecated_calls": sum(s["count"] for s in stats.values()),
            "endpoints_with_usage": len([s for s in stats.values() if s["count"] > 0]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {e!s}")


@router.get("/warnings")
async def get_deprecation_warning_list():
    """
    Get list of active deprecation warnings

    Returns warnings for endpoints that:
    - Are still being used
    - Will be removed within 30 days
    - Ordered by urgency (days until removal)
    """
    try:
        warnings = get_deprecation_warnings()

        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "warnings": warnings,
            "critical_warnings": len(
                [w for w in warnings if w["severity"] == "critical"]
            ),
            "high_warnings": len([w for w in warnings if w["severity"] == "high"]),
            "action_required": len(warnings) > 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get warnings: {e!s}")


@router.get("/endpoints")
async def list_deprecated_endpoints():
    """
    Get list of all deprecated endpoints

    Returns comprehensive information about each deprecated endpoint
    including deprecation date, removal date, and replacement.
    """
    try:
        endpoints = []
        for path, info in DEPRECATED_ENDPOINTS.items():
            endpoints.append(
                {
                    "path": path,
                    "method": info["method"],
                    "deprecated_since": info["deprecated_since"],
                    "removal_date": info["removal_date"],
                    "replacement": info["replacement"],
                    "status": "deprecated",
                    "days_until_removal": (
                        datetime.fromisoformat(info["removal_date"]) - datetime.utcnow()
                    ).days,
                }
            )

        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "deprecated_endpoints": sorted(
                endpoints, key=lambda x: x["days_until_removal"]
            ),
            "total_count": len(endpoints),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list endpoints: {e!s}")


@router.post("/reset-stats")
async def reset_deprecation_stats():
    """
    Reset deprecation usage statistics

    Admin endpoint to clear usage counters.
    Use with caution - this will lose historical data.
    """
    try:
        reset_usage_stats()

        return {
            "success": True,
            "message": "Deprecation statistics have been reset",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset stats: {e!s}")


@router.get("/migration-guide")
async def get_migration_guide():
    """
    Get migration guide information

    Returns links and information about migrating from
    deprecated endpoints to their replacements.
    """
    try:
        migration_info = {}

        for path, info in DEPRECATED_ENDPOINTS.items():
            if info["replacement"]:
                migration_info[path] = {
                    "deprecated_endpoint": path,
                    "new_endpoint": info["replacement"],
                    "method": info["method"],
                    "removal_date": info["removal_date"],
                    "documentation": "/docs/api/SEMANTIC_SEARCH_MIGRATION_GUIDE.md",
                    "api_docs": "/docs#/ai",
                }

        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "migrations": migration_info,
            "documentation_url": "/docs/api/SEMANTIC_SEARCH_MIGRATION_GUIDE.md",
            "support_contact": "See /docs for support information",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get migration guide: {e!s}"
        )


@router.get("/health")
async def deprecation_monitoring_health():
    """
    Health check for deprecation monitoring system

    Returns status of the monitoring system and any critical alerts.
    """
    try:
        stats = get_deprecated_usage_stats()
        warnings = get_deprecation_warnings()

        critical_warnings = [w for w in warnings if w["severity"] == "critical"]
        high_warnings = [w for w in warnings if w["severity"] == "high"]

        status = "healthy"
        if len(critical_warnings) > 0:
            status = "critical"
        elif len(high_warnings) > 0:
            status = "warning"

        return {
            "success": True,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "monitoring_active": True,
            "deprecated_endpoints_count": len(DEPRECATED_ENDPOINTS),
            "endpoints_with_usage": len([s for s in stats.values() if s["count"] > 0]),
            "critical_warnings": len(critical_warnings),
            "high_warnings": len(high_warnings),
            "details": {
                "status_message": f"Monitoring {len(DEPRECATED_ENDPOINTS)} deprecated endpoints",
                "action_required": status != "healthy",
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {e!s}")
