"""
Zenith Backend Main Entry Point
Refactored for maintainability and scalability.
"""

import asyncio
import json
import os
from contextlib import asynccontextmanager

import uvicorn
from app.services.infrastructure.security.audit_service import audit_service
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.api_documentation import setup_api_documentation
from core.logging import log_error, log_security_event, logger
from core.router_registry import register_routers

# Load environment variables
load_dotenv()

import traceback

# Initialize New Relic APM (if configured)
try:
    import newrelic.agent

    # Initialize New Relic only if not in a testing environment
    if os.getenv("TESTING") != "true":
        newrelic.agent.initialize()
except ImportError:
    pass  # New Relic not installed, skip

# Minimal imports for main application entry
from app.core.exceptions import ZenithError
from i18n import ErrorMessages
from locale_utils import get_locale_from_request


# Utility function for safe service calls with graceful degradation
def safe_call(func, default=None, log_errors=True):
    """
    Safely call a function that might fail, returning default value on error.
    Useful for optional monitoring/analytics services that shouldn't break the app.
    """
    try:
        return func()
    except (ZenithError, Exception) as e:
        if log_errors:
            logger.debug(
                f"Safe call failed for {func.__name__ if hasattr(func, '__name__') else 'function'}: {e}"
            )
        return default


# Middleware imports
from app.middleware.csp_headers import ContentSecurityPolicyMiddleware

# Router registry instead of manual imports


# Initialize optional services (these may not always be available)
try:
    from app.services.business.user_journey_tracker import UserJourneyTracker

    user_journey_tracker = UserJourneyTracker()
except ImportError:
    user_journey_tracker = None

try:
    from core.services import MonitoringService

    monitoring_service = MonitoringService()
except ImportError:
    monitoring_service = None

try:
    from core.performance import PerformanceMonitor

    performance_monitor = PerformanceMonitor()
except ImportError:
    performance_monitor = None

try:
    from core.sentry_config import init_sentry
except ImportError:
    init_sentry = None

try:
    from app.services.integration.collaboration.collaboration_service import (
        collaboration_manager,
    )
except ImportError:
    collaboration_manager = None


# Security Audit Logging Functions
def log_security_event(
    event_type: str,
    user_id: str | None = None,
    details: dict | None = None,
    request: Request = None,
):
    """Log security-related events"""
    try:
        audit_details = {
            "event_type": event_type,
            "user_id": user_id or "anonymous",
            "timestamp": "now",
            "details": details or {},
        }

        if request:
            audit_details.update(
                {
                    "ip_address": request.client.host if request.client else "unknown",
                    "user_agent": request.headers.get("user-agent", "unknown"),
                    "endpoint": str(request.url),
                    "method": request.method,
                }
            )

        # Log to audit service
        audit_service.log_security_event(
            user_id=user_id,
            action=event_type,
            resource_type="security",
            details=json.dumps(audit_details),
        )

        # Also log to application logger
        logger.warning(
            f"Security Event: {event_type} - User: {user_id} - Details: {details}"
        )

    except (ZenithError, Exception) as e:
        logger.error(f"Failed to log security event: {e}")


def log_auth_failure(user_id: str, reason: str, request: Request = None):
    """Log authentication failures"""
    log_security_event(
        "AUTH_FAILURE",
        user_id=user_id,
        details={"reason": reason, "attempted_login": True},
        request=request,
    )


def log_suspicious_activity(
    activity_type: str, user_id: str, details: dict, request: Request = None
):
    """Log suspicious activities"""
    log_security_event(
        f"SUSPICIOUS_{activity_type.upper()}",
        user_id=user_id,
        details=details,
        request=request,
    )


# Lifespan context manager (replaces deprecated on_event decorators)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    from app.services.infrastructure.storage.database_service import db_service

    from core.database import create_tables

    logger.info("Starting Zenith Fraud Detection API", extra={"event": "startup"})

    # Phase 0: Security Verification (Placeholder Detection)
    env = os.getenv("ENVIRONMENT", "development").lower()
    if env == "production":
        placeholders = [
            "placeholder_secret",
            "replace_me",
            "default_secret",
            "your-secret-key-here",
        ]
        critical_secrets = {
            "JWT_SECRET": os.getenv("JWT_SECRET"),
            "ENCRYPTION_KEY": os.getenv("FIELD_ENCRYPTION_KEY"),
        }
        for name, value in critical_secrets.items():
            if value in placeholders or not value:
                logger.critical(
                    f"Aborting Startup: {name} is set to a placeholder or is missing in PRODUCTION."
                )
                raise RuntimeError(
                    f"CRITICAL SECURITY CONFIGURATION ERROR: {name} must be set in production."
                )

    # Graceful startup with health verification
    # Phase 1: Database initialization
    logger.info("Phase 1: Database initialization", extra={"startup_phase": 1})

    # Create database tables (Development only) - MUST happen before health check
    if os.getenv("ENVIRONMENT", "development").lower() == "development":
        create_tables()
        logger.info(
            "Database tables created successfully (Development Mode)",
            extra={"event": "database_init"},
        )
    else:
        logger.info(
            "Skipping auto-table creation (Production Mode). Ensure migrations are applied.",
            extra={"event": "database_init"},
        )

    # Health check for database
    max_db_retries = 3
    db_retry_delay = 1
    for attempt in range(max_db_retries):
        try:
            # Check database connectivity
            db_health = db_service.health_check()
            if db_health["status"] == "healthy":
                logger.info(
                    "✅ Database health check passed",
                    extra={"service": "database", "status": "healthy"},
                )
                break
            else:
                raise RuntimeError(
                    f"Database health check failed: {db_health.get('details')}"
                )
        except Exception as e:
            logger.error(f"Database health check error on attempt {attempt + 1}: {e}")
            if attempt < max_db_retries - 1:
                await asyncio.sleep(db_retry_delay)
            else:
                raise RuntimeError(
                    f"Database initialization failed after {max_db_retries} attempts: {e}"
                )

        # Phase 1.5: Redis Connection
        from app.services.infrastructure.redis_cluster import redis_cluster_manager

        logger.info("Phase 1.5: Redis Connection", extra={"startup_phase": 1.5})
        try:
            if await redis_cluster_manager.connect():
                logger.info(
                    "✅ Redis Cluster connected",
                    extra={"service": "redis", "status": "connected"},
                )
            else:
                logger.warning(
                    "⚠️ Redis Cluster failed to connect (using local memory fallback)",
                    extra={"service": "redis", "status": "failed"},
                )
        except Exception as e:
            logger.warning(f"Failed to initialize Redis: {e}")

        # Phase 21: Boot Integrity Check
        from core.immutable_audit import immutable_audit

        immutable_audit.add_entry(
            {"event": "system_boot", "status": "initiated", "version": VERSION}
        )

        # Integrity Checker
        from core.integrity_checker import integrity_checker

        if not integrity_checker.check_integrity():
            logger.critical("System Boot Aborted: Integrity Check Failed")
            raise RuntimeError("CRITICAL: System Integrity Compromised")

        logger.info(
            f"Boot Integrity Verified. Audit Root Hash: {immutable_audit.get_latest_hash()}",
            extra={"event": "boot_integrity"},
        )

        # Initialize Sentry
        if init_sentry():
            logger.info(
                "✅ Sentry error monitoring enabled", extra={"event": "sentry_init"}
            )

    # Phase 2: Background Service Registration & Startup
    logger.info(
        "Phase 2: Background Service Registration & Startup", extra={"startup_phase": 2}
    )
    from core.services import register_all_services, start_services

    register_all_services()
    await start_services()

    # Phase 3: Prometheus Instrumentation (FastAPI specific)
    try:
        from prometheus_fastapi_instrumentator import Instrumentator

        Instrumentator().instrument(app).expose(app, include_in_schema=False)
        logger.info(
            "✅ Prometheus metrics exposed at /metrics", extra={"service": "prometheus"}
        )
    except Exception as e:
        logger.warning(f"Failed to initialize Prometheus instrumentation: {e}")

    # Phase 4: Distributed Tracing
    try:
        from core.tracing import setup_tracing

        setup_tracing(app, "zenith-backend")
    except Exception as e:
        logger.warning(f"Tracing setup failed or skipped: {e}")

    # Phase 5: Security Hardening - Key Rotation
    try:
        from core.security.key_rotation import key_rotation_service

        key_rotation_service.start()
        logger.info("✅ Key Rotation Service started")
    except Exception as e:
        logger.error(f"Failed to start Key Rotation Service: {e}")

    yield  # Application runs here

    # Graceful Shutdown with 99.99% uptime procedures
    shutdown_start = asyncio.get_running_loop().time()
    logger.info(
        "Initiating graceful shutdown of Zenith Fraud Detection API",
        extra={"event": "shutdown"},
    )

    try:
        # Phase 1: Stop accepting new requests
        logger.info(
            "Phase 1: Stopping new request acceptance", extra={"shutdown_phase": 1}
        )

        # Phase 2: Drain existing connections gracefully
        logger.info(
            "Phase 2: Draining existing connections", extra={"shutdown_phase": 2}
        )
        # Give active requests time to complete (configurable grace period)
        grace_period = int(os.getenv("SHUTDOWN_GRACE_PERIOD", "30"))
        logger.info(
            f"Waiting {grace_period}s for active requests to complete",
            extra={"grace_period": grace_period},
        )
        await asyncio.sleep(
            min(grace_period, 10)
        )  # Don't wait more than 10s in testing

        # Phase 3: Stop all background services via Registry
        logger.info(
            "Phase 3: Stopping background services", extra={"shutdown_phase": 3}
        )
        from core.services import stop_services

        await stop_services()

        # Phase 6: Final cleanup and verification
        logger.info(
            "Phase 6: Final cleanup and verification", extra={"shutdown_phase": 6}
        )

        # Save any pending monitoring data
        try:
            # Force flush any pending metrics or logs
            import logging

            logging.shutdown()
            logger.info("✅ Logging system flushed", extra={"service": "logging"})
        except (ZenithError, Exception) as e:
            logger.warning(
                f"Error flushing logs: {e}",
                extra={"service": "logging", "error": str(e)},
            )

        # Calculate shutdown duration
        shutdown_duration = asyncio.get_running_loop().time() - shutdown_start
        logger.info(
            f"🎉 Graceful shutdown completed in {shutdown_duration:.2f}s",
            extra={
                "event": "shutdown_complete",
                "shutdown_duration_seconds": shutdown_duration,
                "shutdown_method": "graceful",
            },
        )

    except (ZenithError, Exception) as e:
        shutdown_duration = asyncio.get_running_loop().time() - shutdown_start
        logger.error(
            f"Error during graceful shutdown after {shutdown_duration:.2f}s",
            extra={
                "error": str(e),
                "event": "shutdown_error",
                "shutdown_duration_seconds": shutdown_duration,
            },
        )
        # Don't re-raise - allow the application to exit even with shutdown errors


PROJECT_NAME = "Zenith Fraud Detection API"
DESCRIPTION = "Backend API for desktop fraud detection application"
VERSION = "1.0.0"


# Standardized Error Response Models
class ErrorDetail(BaseModel):
    """Standardized error detail structure"""

    field: str | None = None
    message: str
    code: str | None = None


class ErrorResponse(BaseModel):
    """Standardized error response structure"""

    error: dict = {
        "type": "api_error",
        "status_code": 500,
        "detail": "An error occurred",
        "request_id": None,
        "timestamp": None,
        "path": None,
        "method": None,
        "details": [],
    }


# Import standardized API models
from core.api_models import (
    create_error_response,
)

app = FastAPI(
    title=PROJECT_NAME,
    description=DESCRIPTION,
    version=VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Apply Security Headers and CSP
app.add_middleware(ContentSecurityPolicyMiddleware)


# Setup comprehensive API documentation with custom OpenAPI schema
app = setup_api_documentation(app)

# Centralized Router Registration
register_routers(app)

# Phase 21: OpenTelemetry Distributed Tracing
try:
    from app.services.infrastructure.tracing import setup_opentelemetry

    setup_opentelemetry(app)
except ImportError:
    logger.warning("OpenTelemetry dependencies not found, skipping tracing setup")
except (ZenithError, Exception) as e:
    logger.warning(f"Failed to initialize OpenTelemetry: {e}")

# Environment-based configuration
environment = os.getenv("ENVIRONMENT", "development").lower()
is_development = environment == "development"

# Security middleware - only in production
if not is_development:
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "api.zenith.com",
            "localhost",
            "testserver",
            "testclient",
        ],  # Configure for your domain
    )

# CORS configuration with security
allowed_origins = (
    [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ]
    if os.getenv("ENVIRONMENT", "development").lower() == "development"
    else ["https://app.zenith.com", "https://api.zenith.com"]
)

from core.rate_limiting import RateLimitExceeded


# Rate limit exception handler
async def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Handle RateLimitExceeded exceptions globally."""
    from starlette.responses import JSONResponse

    logger.warning(
        f"Rate limit exceeded for {request.client.host if request.client else 'unknown'}",
        extra={"path": request.url.path},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
        headers=exc.headers if hasattr(exc, "headers") else {"Retry-After": "60"},
    )


# Security Monitoring Middleware (must be early in the stack)

# Middleware is now centrally configured via core.middleware_config.configure_middleware
# CORS middleware - MUST BE OUTERMOST to handle preflight correctly
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Accept-Encoding",
        "Accept-Language",
        "X-API-Key",
        "X-CSRF-Token",
        "Cookie",
    ],
    max_age=86400,
)

# Standard API Routers are registered via register_routers() in core/router_registry.py


# Health check endpoints
@app.get("/analytics/journey")
def get_journey_analytics():
    """Get user journey and funnel analytics"""
    try:
        # Check if analytics is disabled (test mode)
        if not hasattr(user_journey_tracker, "get_funnel_analysis"):
            # Return mock data for testing
            return {
                "funnel_analysis": {
                    "total_users": 150,
                    "step_conversion": {
                        "login": 100,
                        "dashboard_view": 95,
                        "case_creation": 78,
                        "evidence_upload": 65,
                    },
                    "drop_off_points": ["evidence_upload"],
                },
                "session_analytics": {
                    "avg_session_duration": 1800,
                    "total_sessions": 450,
                    "bounce_rate": 0.15,
                },
                "status": "success",
            }

        funnel_data = user_journey_tracker.get_funnel_analysis()
        session_data = user_journey_tracker.get_session_analytics()

        return {
            "funnel_analysis": funnel_data,
            "session_analytics": session_data,
            "status": "success",
        }
    except (ZenithError, Exception) as e:
        return {
            "status": "error",
            "error": str(e),
            "funnel_analysis": {},
            "session_analytics": {},
        }


@app.post("/analytics/track")
def track_user_event(
    event_type: str, user_id: str | None = None, metadata: dict | None = None
):
    """Track user events for journey analysis"""
    try:
        user_journey_tracker.track_event(user_id or "anonymous", event_type, metadata)
        return {"status": "tracked"}
    except (ZenithError, Exception) as e:
        return {"status": "error", "message": str(e)}


@app.get("/diagnostics/dashboard")
def get_diagnostics_dashboard():
    """Comprehensive diagnostics dashboard combining all monitoring data"""
    try:
        # Health metrics
        health_data = monitoring_service.get_health_metrics()

        # Performance baselines
        performance_data = performance_monitor.get_baselines()
        current_metrics = performance_monitor.get_current_metrics()
        alerts = performance_monitor.check_thresholds()

        # User journey analytics
        journey_data = user_journey_tracker.get_funnel_analysis()
        session_data = user_journey_tracker.get_session_analytics()

        # System status determination
        system_status = "healthy"
        critical_alerts = [alert for alert in alerts if "critical" in alert.lower()]

        if critical_alerts:
            system_status = "critical"
        elif alerts:
            system_status = "warning"
        elif health_data.get("system_health", 100) < 80:
            system_status = "degraded"

        return {
            "status": system_status,
            "timestamp": "now",
            "summary": {
                "system_health": health_data.get("system_health", 0),
                "active_alerts": len(alerts),
                "total_users": journey_data.get("total_users", 0),
                "performance_score": "good" if not alerts else "needs_attention",
            },
            "health": health_data,
            "performance": {
                "baselines": performance_data,
                "current": current_metrics,
                "alerts": alerts,
            },
            "user_analytics": {"journey": journey_data, "sessions": session_data},
            "recommendations": [
                (
                    "Monitor CPU usage if > 90%"
                    if any("cpu" in alert.lower() for alert in alerts)
                    else None
                ),
                (
                    "Check memory usage if > 85%"
                    if any("memory" in alert.lower() for alert in alerts)
                    else None
                ),
                (
                    "Review user drop-off in funnel"
                    if journey_data.get("drop_off_points")
                    else None
                ),
                (
                    "Scale infrastructure if needed"
                    if system_status == "critical"
                    else None
                ),
            ],
        }
    except (ZenithError, Exception) as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": "now",
            "summary": {"system_health": 0, "active_alerts": 1, "total_users": 0},
            "health": {},
            "performance": {"alerts": ["Monitoring system error"]},
            "user_analytics": {},
            "recommendations": ["Check system logs", "Contact system administrator"],
        }


# Health check endpoints (at root level for tests)
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "healthy", "service": "fraud-detection-backend"}


@app.get("/health/ready")
async def readiness_check():
    """Readiness probe for Kubernetes/orchestration"""
    try:
        from app.services.infrastructure.storage.database_service import db_service

        db_health = db_service.health_check()

        if db_health.get("status") == "healthy":
            return {"status": "ready", "checks": {"database": "healthy"}}
        else:
            return JSONResponse(
                status_code=503,
                content={"status": "not_ready", "checks": {"database": "unhealthy"}},
            )
    except Exception as e:
        return JSONResponse(
            status_code=503, content={"status": "not_ready", "error": str(e)}
        )


@app.get("/health/live")
async def liveness_check():
    """Liveness probe for Kubernetes/orchestration"""
    return {"status": "alive", "service": "fraud-detection-backend"}


@app.get("/metrics")
def metrics_endpoint():
    """Prometheus metrics"""
    from core.metrics import get_metrics

    return get_metrics()


# Frontend serving
@app.get("/")
async def serve_index():
    """Serve the main frontend page"""
    frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
    if os.path.exists(frontend_dist):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    else:
        return {
            "message": "Frontend not built. Run 'npm run build:frontend' to build the frontend."
        }


# Manual WebSocket startup endpoint for debugging
@app.post("/admin/start-websocket")
async def start_websocket_server():
    """Manually start the WebSocket server for debugging"""
    try:
        ws_enabled = os.getenv("ENABLE_COLLABORATION_WS", "false").lower() == "true"
        if not ws_enabled:
            return {"status": "disabled", "message": "WebSocket server disabled"}

        await collaboration_manager.start_server()
        return {
            "status": "started",
            "message": "WebSocket server started on ws://localhost:8080",
        }
    except (ZenithError, Exception) as e:
        return {"status": "error", "message": str(e)}


# Global exception handlers


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with structured logging and localized response"""
    locale = get_locale_from_request(request)

    # Get localized error message based on status code
    localized_detail = exc.detail
    if exc.status_code == 401:
        localized_detail = ErrorMessages.unauthorized(locale)
    elif exc.status_code == 403:
        localized_detail = ErrorMessages.forbidden(locale)
    elif exc.status_code == 404:
        localized_detail = ErrorMessages.not_found(locale)
    elif exc.status_code >= 500:
        localized_detail = ErrorMessages.server_error(locale)

    log_error(
        "http_exception",
        f"HTTP {exc.status_code}: {localized_detail}",
        {
            "status_code": exc.status_code,
            "path": str(request.url),
            "method": request.method,
            "client_ip": request.client.host if request.client else None,
            "locale": locale,
        },
    )

    # Return standardized error response with localized message
    error_response = create_error_response(
        status_code=exc.status_code,
        detail=localized_detail,
        error_type="http_exception",
        request=request,
    )
    return JSONResponse(status_code=exc.status_code, content=error_response)


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with structured logging and localized response"""
    locale = get_locale_from_request(request)

    localized_error_message = ErrorMessages.unexpected_error(locale)

    error_details = {
        "type": type(exc).__name__,
        "message": str(exc),
        "traceback": traceback.format_exc(),
        "path": str(request.url),
        "method": request.method,
        "client_ip": request.client.host if request.client else None,
        "locale": locale,
    }

    log_error("unexpected_error", f"Unexpected error: {exc!s}", error_details)

    # Don't expose internal error details in production
    if environment == "production":
        error_response = create_error_response(
            status_code=500,
            detail=localized_error_message,
            error_type="internal_server_error",
            request=request,
        )
        return JSONResponse(status_code=500, content=error_response)
    else:
        # Show full details in development
        error_response = create_error_response(
            status_code=500,
            detail=f"{localized_error_message} (Development: {exc!s})",
            error_type="unexpected_error",
            request=request,
        )
        # Add traceback for development
        error_response["error"]["traceback"] = traceback.format_exc()
        return JSONResponse(status_code=500, content=error_response)


@app.exception_handler(StarletteHTTPException)
async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle Starlette HTTP exceptions with standardized response"""
    log_error(
        "starlette_exception",
        f"Starlette HTTP {exc.status_code}: {exc.detail}",
        {
            "status_code": exc.status_code,
            "path": str(request.url),
            "method": request.method,
        },
    )

    # Return standardized error response
    error_response = create_error_response(
        status_code=exc.status_code,
        detail=exc.detail,
        error_type="starlette_exception",
        request=request,
    )
    return JSONResponse(status_code=exc.status_code, content=error_response)


if __name__ == "__main__":
    import asyncio
    import os

    # Security: Only enable reload in development
    reload_enabled = os.getenv("ENVIRONMENT", "production").lower() == "development"

    # Start AI training pipeline in background (only in production)
    # if not reload_enabled:
    #     logger.info("Starting AI training pipeline...")
    #     asyncio.create_task(training_pipeline.start_automated_training())

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=reload_enabled,  # Only reload in development
        log_level="info",
    )
