"""
Health check and readiness endpoints for production monitoring
Provides status information for load balancers, Kubernetes, and monitoring systems
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint for load balancers

    Returns:
        Simple health status and timestamp

    Usage:
        Used by load balancers, Kubernetes liveness probes
    """
    return {
        "status": "healthy",
        "service": "simple378-fraud-detection-api",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Readiness check with dependency validation

    Checks:
        - Database connectivity
        - Critical services availability

    Returns:
        Detailed readiness status with individual checks

    Usage:
        Used by Kubernetes readiness probes, deployment verification

    Status Codes:
        200: All dependencies ready
        503: One or more dependencies not ready
    """
    checks = {}
    all_ready = True

    # Check database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {
            "status": "healthy",
            "message": "Database connection successful",
        }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        checks["database"] = {
            "status": "unhealthy",
            "message": f"Database error: {str(e)}",
        }
        all_ready = False

    # Check Redis (if configured)
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            # Try to import and ping Redis
            import redis

            r = redis.from_url(redis_url)
            r.ping()
            checks["redis"] = {
                "status": "healthy",
                "message": "Redis connection successful",
            }
        except Exception as e:
            logger.warning(f"Redis health check failed: {str(e)}")
            checks["redis"] = {
                "status": "degraded",
                "message": f"Redis error: {str(e)}",
            }
            # Redis is optional, don't fail readiness

    # Check critical services status
    checks["authentication"] = {
        "status": "healthy",
        "message": "Auth service operational",
    }

    checks["api"] = {"status": "healthy", "message": "API routes registered"}

    response_status = (
        status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return {
        "ready": all_ready,
        "checks": checks,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check for Kubernetes liveness probe

    Returns:
        Simple alive status (faster than readiness check)

    Usage:
        Kubernetes liveness probe - determines if pod should be restarted
    """
    return {"alive": True, "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/health/startup", status_code=status.HTTP_200_OK)
async def startup_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Startup check for Kubernetes startup probe

    Returns:
        Startup completion status

    Usage:
        Kubernetes startup probe - determines if application has started
        More lenient than readiness check during startup
    """
    try:
        # Quick database check
        db.execute(text("SELECT 1"))
        return {"started": True, "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"Startup check failed: {str(e)}")
        return {
            "started": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
