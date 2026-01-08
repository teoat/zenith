"""
Fraud + Intelligence Service
FastAPI application providing fraud detection and intelligence analysis
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
import structlog

from app.services.graph_service import GraphService
from app.services.evidence_service import EvidenceService
from app.services.forensic_intelligence import ForensicIntelligence
from app.utils.config import settings
from app.routers import health, fraud, intelligence, graph

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
    logger.info("Starting Fraud + Intelligence service")

    # Initialize services
    app.state.graph_service = GraphService()
    app.state.evidence_service = EvidenceService()
    app.state.forensic_intelligence = ForensicIntelligence()

    yield

    # Shutdown
    logger.info("Shutting down Fraud + Intelligence service")


# Create FastAPI application
app = FastAPI(
    title="Zenith Fraud Detection - Fraud + Intelligence Service",
    description="Fraud detection and intelligence analysis service",
    version="1.0.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(fraud.router, prefix="/api/v1", tags=["fraud"])
app.include_router(intelligence.router, prefix="/api/v1", tags=["intelligence"])
app.include_router(graph.router, prefix="/api/v1", tags=["graph"])


@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "fraud-intel-service",
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
