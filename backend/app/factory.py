from dotenv import load_dotenv
from fastapi import FastAPI

from app.config import setup_middleware, setup_routers
from app.constants import DESCRIPTION, PROJECT_NAME, VERSION
from app.lifespan import lifespan
from core.api_documentation import setup_api_documentation
from core.logging import logger

# Load environment variables
load_dotenv()


def create_app() -> FastAPI:
    """Application Factory Pattern"""
    app = FastAPI(
        title=PROJECT_NAME,
        description=DESCRIPTION,
        version=VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # 1. Setup Middleware (including Exception Handlers)
    setup_middleware(app)

    # 2. Setup Routers
    setup_routers(app)

    # 3. Setup API Documentation (from core)
    app = setup_api_documentation(app)

    # 4. Phase 21: OpenTelemetry Distributed Tracing
    try:
        from app.services.infrastructure.tracing import setup_opentelemetry

        setup_opentelemetry(app)
    except ImportError:
        logger.warning("OpenTelemetry dependencies not found, skipping tracing setup")
    except Exception as e:
        logger.warning(f"Failed to initialize OpenTelemetry: {e}")

    return app
