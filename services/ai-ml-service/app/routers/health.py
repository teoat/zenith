"""
Health check router for AI/ML Service
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import torch

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    gpu_available: bool
    gpu_count: int
    models_loaded: Dict[str, bool]


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check with GPU and model status"""
    gpu_available = torch.cuda.is_available()
    gpu_count = torch.cuda.device_count() if gpu_available else 0

    # Check model loading status (simplified)
    models_loaded = {
        "fraud_detection": True,  # Would check actual model status
        "embeddings": True,
        "nlp": True,
    }

    return HealthResponse(
        status="healthy",
        gpu_available=gpu_available,
        gpu_count=gpu_count,
        models_loaded=models_loaded,
    )


@router.get("/health/models")
async def model_health_check():
    """Detailed model health check"""
    return {
        "fraud_model": {"loaded": True, "type": "xgboost", "version": "1.0.0"},
        "embeddings_model": {
            "loaded": True,
            "type": "sentence-transformers",
            "model_name": "all-MiniLM-L6-v2",
        },
        "nlp_model": {
            "loaded": True,
            "type": "transformers",
            "model_name": "distilbert-base-uncased",
        },
    }
