"""
Health check router for Workflow + Regulatory Service
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "workflow-regulatory-service",
    }
