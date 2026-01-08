"""
Workflow + Regulatory Service
FastAPI application providing workflow management and regulatory compliance
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
import structlog

from app.services.workflow_engine import WorkflowEngine
from app.services.compliance_reporting import ComplianceReporting
from app.services.diagnostic_orchestrator import DiagnosticOrchestrator
from app.utils.config import settings
from app.routers import health, workflow, regulatory, diagnostics

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
    logger.info("Starting Workflow + Regulatory service")

    # Initialize services
    app.state.workflow_engine = WorkflowEngine()
    app.state.compliance_reporting = ComplianceReporting()
    app.state.diagnostic_orchestrator = DiagnosticOrchestrator()

    yield

    # Shutdown
    logger.info("Shutting down Workflow + Regulatory service")


# Create FastAPI application
app = FastAPI(
    title="Zenith Fraud Detection - Workflow + Regulatory Service",
    description="Workflow management and regulatory compliance service",
    version="1.0.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(workflow.router, prefix="/api/v1", tags=["workflow"])
app.include_router(regulatory.router, prefix="/api/v1", tags=["regulatory"])
app.include_router(diagnostics.router, prefix="/api/v1", tags=["diagnostics"])


@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "workflow-regulatory-service",
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
