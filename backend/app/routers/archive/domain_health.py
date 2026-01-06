"""
Domain Health Router
Public health endpoints for all domain routers
"""

from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/investigation/health", tags=["Health"])
async def investigation_health() -> dict[str, str]:
    """Public health check for investigation hub"""
    return {
        "service": "investigation-hub",
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/intelligence/health", tags=["Health"])
async def intelligence_health() -> dict[str, str]:
    """Public health check for intelligence center"""
    return {
        "service": "intelligence-center",
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/compliance/health", tags=["Health"])
async def compliance_health() -> dict[str, str]:
    """Public health check for compliance suite"""
    return {
        "service": "compliance-suite",
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/platform-admin/health", tags=["Health"])
async def platform_admin_health() -> dict[str, str]:
    """Public health check for platform admin"""
    return {
        "service": "platform-admin",
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/identity/health", tags=["Health"])
async def identity_health() -> dict[str, str]:
    """Public health check for identity system"""
    return {
        "service": "identity-system",
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/integration/health", tags=["Health"])
async def integration_health() -> dict[str, str]:
    """Public health check for integration layer"""
    return {
        "service": "integration-layer",
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/ai-analytics/health", tags=["Health"])
async def ai_analytics_health() -> dict[str, str]:
    """Public health check for AI analytics"""
    return {
        "service": "ai-analytics",
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }
