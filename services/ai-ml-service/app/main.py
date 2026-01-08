"""
AI/ML Service
FastAPI application providing AI/ML inference capabilities for Zenith Fraud Detection
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
import structlog
import torch

from app.services.ai_service import AIService
from app.services.embeddings_service import EmbeddingsService
from app.models.model_cache import ModelCache
from app.utils.config import settings
from app.routers import health, inference, embeddings

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Startup
    logger.info("Starting AI/ML service")

    # Check GPU availability
    if torch.cuda.is_available():
        logger.info("GPU detected", gpu_count=torch.cuda.device_count())
        for i in range(torch.cuda.device_count()):
            logger.info(f"GPU {i}: {torch.cuda.get_device_name(i)}")
    else:
        logger.warning("No GPU detected, using CPU")

    # Initialize model cache
    app.state.model_cache = ModelCache()

    # Initialize AI service
    app.state.ai_service = AIService(app.state.model_cache)

    # Initialize embeddings service
    app.state.embeddings_service = EmbeddingsService(app.state.model_cache)

    # Preload critical models
    await preload_models(app)

    yield

    # Shutdown
    logger.info("Shutting down AI/ML service")


async def preload_models(app: FastAPI):
    """Preload critical ML models"""
    try:
        logger.info("Preloading ML models")

        # Preload fraud detection model
        await app.state.ai_service.load_fraud_model()

        # Preload embeddings model
        await app.state.embeddings_service.load_model()

        logger.info("ML models preloaded successfully")

    except Exception as e:
        logger.error("Failed to preload ML models", error=str(e))
        # Don't fail startup, but log the error


# Create FastAPI application
app = FastAPI(
    title="Zenith Fraud Detection - AI/ML Service",
    description="AI/ML inference service for fraud detection",
    version="1.0.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(inference.router, prefix="/api/v1", tags=["inference"])
app.include_router(embeddings.router, prefix="/api/v1", tags=["embeddings"])


@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "ai-ml-service",
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
