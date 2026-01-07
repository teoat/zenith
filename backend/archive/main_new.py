"""
Zenith Backend Main Entry Point
Refactored for maintainability and scalability.
"""

import os

import uvicorn
from core.app_factory import create_app, lifespan_context, setup_error_handlers
from core.middleware_config import configure_middleware
from core.router_registry import register_routers
from dotenv import load_dotenv

from core.api_documentation import setup_api_documentation
from core.logging import zenith_logger

# Load environment variables
load_dotenv()

# Initialize APM if configured
try:
    import newrelic.agent

    newrelic.agent.initialize()
except ImportError:
    zenith_logger.info("New Relic APM not configured")

# Application creation and configuration
app = create_app()
app.lifespan = lifespan_context

# Configure middleware
configure_middleware(app)

# Register routers
register_routers(app)

# Setup error handlers
setup_error_handlers(app)

# Configure API documentation
app = setup_api_documentation(app)

# Setup OpenTelemetry tracing
try:
    from app.services.infrastructure.tracing import setup_opentelemetry

    setup_opentelemetry(app)
except ImportError:
    zenith_logger.warning(
        "OpenTelemetry dependencies not found, skipping tracing setup"
    )
except Exception as e:
    zenith_logger.warning("Failed to initialize OpenTelemetry", {"error": str(e)})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development",
        log_level="info",
    )
