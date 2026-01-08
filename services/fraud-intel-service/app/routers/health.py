"""
Health check router for Fraud + Intelligence Service
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "fraud-intel-service",
    }
