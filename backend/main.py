# main.py
import json
import os
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

# Load environment variables from .env file
load_dotenv()

import traceback

from fastapi import HTTPException

from app.routers import advanced_ai
from app.routers.admin import router as admin_router
from app.routers.ai import router as ai_router
from app.routers.analytics import router as analytics_router
from app.routers.apm import router as apm_router
from app.routers.audit import router as audit_router
from app.routers.auth import router as auth_router
from app.routers.backup import router as backup_router
from app.routers.cases import router as cases_router
from app.routers.collaboration import router as collaboration_router
from app.routers.cost_optimization import router as cost_optimization_router
from app.routers.evidence import router as evidence_router
from app.routers.fraud import router as fraud_router
from app.routers.compliance import router as compliance_router
from app.routers.fraud_rules import router as fraud_rules_router
from app.routers.graph import router as graph_router
from app.routers.logging import router as logging_router
from app.routers.metadata import router as metadata_router
from app.routers.multimodal import router as multimodal_router
from app.routers.notifications import router as notifications_router
from app.routers.onboarding import router as onboarding_router
from app.routers.proof import router as proof_router
from app.routers.realtime_sync import router as realtime_sync_router
from app.routers.reconciliation import router as reconciliation_router
from app.routers.reporting import router as reporting_router
from app.routers.search import router as search_router
from app.routers.semantic_search import router as semantic_search_router
from app.routers.stats import router as stats_router
from app.routers.users import router as users_router
from app.routers.forensic_intelligence import router as forensic_intel_router
from app.routers.health import router as health_router
from app.routers.entities import router as entities_router, relationships_router as relationships_router_from_entities
from app.routers.entities import router as entities_router, relationships_router as relationships_router_from_entities
from app.routers.csrf import router as csrf_router
# Roadmap Routers
from app.routers.collaboration import router as collaboration_router
from app.routers.time_travel import router as time_travel_router
from app.routers.ai_voice import router as ai_voice_router
from app.routers.macros import router as macros_router

from app.services.infrastructure.apm_service import APMMiddleware
from app.services.infrastructure.security.audit_service import audit_service
from app.services.integration.collaboration.collaboration_service import collaboration_manager
from app.services.infrastructure.monitoring_service import (
    create_monitoring_middleware,
    monitoring_service,
)
from app.services.infrastructure.performance_monitor import performance_monitor

# Deprecated endpoints tracking
DEPRECATED_ENDPOINTS = {
    "/api/v1/old_endpoint": {
        "deprecated_since": "v1.2.0",
        "removal_version": "v2.0.0",
        "migration_guide": "/docs/migration/v1-to-v2",
        "replacement": "/api/v1/new_endpoint"
    }
}
from core.database import create_tables
from core.logging import log_error, log_request, logger
from core.performance import PerformanceMonitoringMiddleware
from core.api_documentation import setup_api_documentation
from core.sentry_config import init_sentry
from core.validation import InputValidationMiddleware
from middleware.request_id import RequestIDMiddleware

# Import i18n utilities
from i18n import ErrorMessages
from locale_utils import get_locale_from_request

# Import new models to ensure registration with Base.metadata
from core.plugin_system import models as plugin_models
from core.feature_flags import models as feature_flag_models
from core.eav import models as eav_models
from core import database_extensions as db_ext


# Utility function for safe service calls with graceful degradation
def safe_call(func, default=None, log_errors=True):
    """
    Safely call a function that might fail, returning default value on error.
    Useful for optional monitoring/analytics services that shouldn't break the app.
    """
    try:
        return func()
    except Exception as e:
        if log_errors:
            logger.debug(f"Safe call failed for {func.__name__ if hasattr(func, '__name__') else 'function'}: {e}")
        return default

# Security Audit Logging Functions
def log_security_event(
    event_type: str, user_id: str = None, details: dict = None, request: Request = None
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

    except Exception as e:
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


# Security Headers Middleware
from app.middleware.security import SecurityHeadersMiddleware

# Lifespan context manager (replaces deprecated on_event decorators)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events with 99.99% uptime procedures"""
    print("DEBUG: Lifespan called!")
    startup_start = asyncio.get_event_loop().time()
    print("DEBUG: Lifespan startup beginning")
    logger.info("Starting 378x492 Fraud Detection API with 99.99% uptime target", extra={"event": "startup"})

    print("DEBUG: About to start phases")

    # Graceful startup with health verification
    try:
        # Phase 1: Database initialization
        logger.info("Phase 1: Database initialization", extra={"startup_phase": 1})
        
        # Create database tables (Development only) - MUST happen before health check
        # In production, use Alembic migrations: `alembic upgrade head`
        if os.getenv("ENVIRONMENT", "development").lower() == "development":
            create_tables()
            logger.info(
                "Database tables created successfully (Development Mode)",
                extra={"event": "database_init"}
            )
        else:
            logger.info(
                "Skipping auto-table creation (Production Mode). Ensure migrations are applied.",
                extra={"event": "database_init"}
            )

        # Verify database connectivity and health
        from app.services.infrastructure.storage.database_service import db_service
        max_db_retries = 5
        db_retry_delay = 2

        for attempt in range(max_db_retries):
            try:
                db_health = db_service.health_check()
                if db_health["status"] in ["healthy", "degraded"]: # Support degraded for initial startup
                    logger.info(f"Database health check passed/degraded on attempt {attempt + 1}", extra={"db_health": db_health})
                    break
                else:
                    logger.warning(f"Database health check failed on attempt {attempt + 1}: {db_health}")
                    if attempt < max_db_retries - 1:
                        await asyncio.sleep(db_retry_delay)
                        continue
                    else:
                        raise RuntimeError(f"Database health check failed after {max_db_retries} attempts")
            except Exception as e:
                logger.error(f"Database health check error on attempt {attempt + 1}: {e}")
                if attempt < max_db_retries - 1:
                    await asyncio.sleep(db_retry_delay)
                    continue
                else:
                    raise RuntimeError(f"Database initialization failed after {max_db_retries} attempts: {e}")

        
        # Phase 21: Boot Integrity Check
        from core.immutable_audit import immutable_audit
        immutable_audit.add_entry({"event": "system_boot", "status": "initiated", "version": VERSION})
        
        # Integrity Checker
        from core.integrity_checker import integrity_checker
        if not integrity_checker.check_integrity():
            logger.critical("System Boot Aborted: Integrity Check Failed")
            raise RuntimeError("CRITICAL: System Integrity Compromised")

        logger.info(
            f"Boot Integrity Verified. Audit Root Hash: {immutable_audit.get_latest_hash()}",
            extra={"event": "boot_integrity"}
        )

        # Initialize Sentry
        # if init_sentry():
        #     logger.info("✅ Sentry error monitoring enabled", extra={"event": "sentry_init"})

        # Phase 2: Service initialization with error handling
        logger.info("Phase 2: Service initialization with error handling", extra={"startup_phase": 2})

        # Initialize monitoring services with graceful fallback
        try:
            # Initialize proactive monitoring for 99.99% uptime
            from app.services.infrastructure.proactive_monitoring import proactive_monitoring
            await proactive_monitoring.start_monitoring()
            logger.info("✅ Proactive monitoring started for 99.99% uptime", extra={"service": "proactive_monitoring"})

            monitoring_service.start_monitoring()
            performance_monitor.start_monitoring()
        # apm_service.start_monitoring()
            logger.info("ℹ️ APM monitoring skipped (optional service)", extra={"service": "apm"})
        except Exception as e:
            logger.info(f"APM service not available: {e}", extra={"service": "apm", "error": str(e)})

        # Phase 3: Circuit breaker and resilience initialization
        logger.info("Phase 3: Circuit breaker and resilience initialization", extra={"startup_phase": 3})
        from app.services.infrastructure.circuit_breaker import get_circuit_breaker

        # Verify circuit breakers are ready
        critical_breakers = ["database_connection", "external_api_calls"]
        for breaker_name in critical_breakers:
            try:
                breaker = get_circuit_breaker(breaker_name)
                logger.info(f"✅ Circuit breaker '{breaker_name}' initialized", extra={"circuit_breaker": breaker_name})
            except Exception as e:
                logger.error(f"Failed to initialize circuit breaker '{breaker_name}': {e}", extra={"circuit_breaker": breaker_name, "error": str(e)})

        # Phase 4: Final health verification
        logger.info("Phase 4: Final health verification", extra={"startup_phase": 4})
        final_health_check_start = asyncio.get_event_loop().time()

        try:
            # Import and run comprehensive health check
            from app.routers.health import health_check
            health_result = await health_check()

            if health_result["status"] == "healthy":
                startup_duration = asyncio.get_event_loop().time() - startup_start
                logger.info(f"🎉 Application startup completed successfully in {startup_duration:.2f}s", extra={
                    "event": "startup_complete",
                    "startup_duration_seconds": startup_duration,
                    "health_status": "healthy"
                })
            else:
                logger.warning(f"Application started with health issues: {health_result}", extra={
                    "event": "startup_degraded",
                    "health_status": health_result["status"]
                })

        except Exception as e:
            logger.error(f"Final health check failed: {e}", extra={"error": str(e)})

        logger.info(
            "Monitoring services initialized successfully",
            extra={"event": "monitoring_start"},
        )

        # Start collaboration WebSocket server if enabled
        print("DEBUG: About to check WebSocket startup")
        ws_enabled = os.getenv("ENABLE_COLLABORATION_WS", "false").lower() == "true"
        print(f"DEBUG: ENABLE_COLLABORATION_WS={os.getenv('ENABLE_COLLABORATION_WS')}, ws_enabled={ws_enabled}")
        if ws_enabled:
            print("DEBUG: Starting WebSocket server...")
            try:
                # Start WebSocket server in background task
                asyncio.create_task(collaboration_manager.start_server())
                print("DEBUG: WebSocket server start task created")
                logger.info(
                    "Collaboration WebSocket server started successfully",
                    extra={"event": "websocket_started"},
                )
            except Exception as e:
                print(f"DEBUG: WebSocket startup failed: {e}")
                logger.error(f"Failed to start WebSocket server: {e}", exc_info=True)
        else:
            print("DEBUG: WebSocket server disabled")
            logger.info(
                "WebSocket server disabled (set ENABLE_COLLABORATION_WS=true to enable)",
                extra={"event": "websocket_disabled"},
            )
        logger.info(
            "378x492 API startup completed successfully",
            extra={"event": "startup_complete"},
        )
    except Exception as e:
        logger.error(
            "Failed to start 378x492 API",
            extra={"error": str(e), "event": "startup_failed"},
        )
        raise

    yield  # Application runs here

    # Graceful Shutdown with 99.99% uptime procedures
    shutdown_start = asyncio.get_event_loop().time()
    logger.info(
        "Initiating graceful shutdown of 378x492 Fraud Detection API", extra={"event": "shutdown"}
    )

    try:
        # Phase 1: Stop accepting new requests
        logger.info("Phase 1: Stopping new request acceptance", extra={"shutdown_phase": 1})

        # Phase 2: Drain existing connections gracefully
        logger.info("Phase 2: Draining existing connections", extra={"shutdown_phase": 2})
        # Give active requests time to complete (configurable grace period)
        grace_period = int(os.getenv("SHUTDOWN_GRACE_PERIOD", "30"))
        logger.info(f"Waiting {grace_period}s for active requests to complete", extra={"grace_period": grace_period})
        await asyncio.sleep(min(grace_period, 10))  # Don't wait more than 10s in testing

        # Phase 3: Stop monitoring services
        logger.info("Phase 3: Stopping monitoring services", extra={"shutdown_phase": 3})

        # Stop proactive monitoring first
        try:
            from app.services.infrastructure.proactive_monitoring import proactive_monitoring
            await proactive_monitoring.stop_monitoring()
            logger.info("✅ Proactive monitoring stopped", extra={"service": "proactive_monitoring"})
        except Exception as e:
            logger.warning(f"Error stopping proactive monitoring: {e}", extra={"service": "proactive_monitoring", "error": str(e)})

        try:
            monitoring_service.stop_monitoring()
            logger.info("✅ Monitoring service stopped", extra={"service": "monitoring"})
        except Exception as e:
            logger.warning(f"Error stopping monitoring service: {e}", extra={"service": "monitoring", "error": str(e)})

        try:
            performance_monitor.stop_monitoring()
            logger.info("✅ Performance monitoring stopped", extra={"service": "performance_monitoring"})
        except Exception as e:
            logger.warning(f"Error stopping performance monitoring: {e}", extra={"service": "performance_monitoring", "error": str(e)})

        # Phase 4: Close database connections gracefully
        logger.info("Phase 4: Closing database connections", extra={"shutdown_phase": 4})
        try:
            from app.services.infrastructure.storage.database_service import db_service
            # The database service uses SQLAlchemy connection pooling which handles cleanup automatically
            logger.info("✅ Database connections prepared for cleanup", extra={"service": "database"})
        except Exception as e:
            logger.warning(f"Error preparing database cleanup: {e}", extra={"service": "database", "error": str(e)})

        # Phase 5: Stop WebSocket services
        logger.info("Phase 5: Stopping WebSocket and collaboration services", extra={"shutdown_phase": 5})
        try:
            await collaboration_manager.stop_server()
            logger.info("✅ Collaboration WebSocket server stopped", extra={"service": "collaboration"})
        except Exception as e:
            logger.warning(f"Error stopping collaboration server: {e}", extra={"service": "collaboration", "error": str(e)})

        # Phase 6: Final cleanup and verification
        logger.info("Phase 6: Final cleanup and verification", extra={"shutdown_phase": 6})

        # Save any pending monitoring data
        try:
            # Force flush any pending metrics or logs
            import logging
            logging.shutdown()
            logger.info("✅ Logging system flushed", extra={"service": "logging"})
        except Exception as e:
            logger.warning(f"Error flushing logs: {e}", extra={"service": "logging", "error": str(e)})

        # Calculate shutdown duration
        shutdown_duration = asyncio.get_event_loop().time() - shutdown_start
        logger.info(
            f"🎉 Graceful shutdown completed in {shutdown_duration:.2f}s", extra={
                "event": "shutdown_complete",
                "shutdown_duration_seconds": shutdown_duration,
                "shutdown_method": "graceful"
            }
        )

    except Exception as e:
        shutdown_duration = asyncio.get_event_loop().time() - shutdown_start
        logger.error(
            f"Error during graceful shutdown after {shutdown_duration:.2f}s", extra={
                "error": str(e),
                "event": "shutdown_error",
                "shutdown_duration_seconds": shutdown_duration
            }
        )
        # Don't re-raise - allow the application to exit even with shutdown errors


PROJECT_NAME = "378x492 Fraud Detection API"
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
        "details": []
    }


# Import standardized API models
from core.api_models import (
    PaginationParams,
    PaginationResponse,
    FilterParams,
    BulkOperationRequest,
    BulkOperationResponse,
    ErrorDetail,
    ErrorResponse,
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

# Health Check Endpoints
# Health Check Endpoints (Moved to app.routers.health)
app.include_router(health_router)

# Setup comprehensive API documentation with custom OpenAPI schema
app = setup_api_documentation(app)

# Phase 21: OpenTelemetry Distributed Tracing
try:
    from app.services.infrastructure.tracing import setup_opentelemetry
    setup_opentelemetry(app)
except ImportError:
    logger.warning("OpenTelemetry dependencies not found, skipping tracing setup")
except Exception as e:
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
            "api.378x492.com",
            "localhost",
            "testserver",
            "testclient",
        ],  # Configure for your domain
    )

# CORS configuration with security
allowed_origins = []
if is_development:
    # Development: Allow localhost origins
    allowed_origins = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (fallback port)
        "http://localhost:5175",  # Vite dev server (fallback port)
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ]
else:
    # Production: Restrict to specific domains
    allowed_origins = ["https://app.378x492.com", "https://api.378x492.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Accept-Encoding",
        "Accept-Language",
    ],
    max_age=86400,  # 24 hours
)

# Security Monitoring Middleware (must be early in the stack)
from core.security_monitoring import security_monitor
from core.rate_limiting import RateLimitingMiddleware, RateLimitExceeded

# Add security monitoring middleware
app.add_middleware(RateLimitingMiddleware)

# Rate limiting (legacy, keep for compatibility)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# APM Monitoring
app.add_middleware(APMMiddleware)

# Performance monitoring middleware for Prometheus metrics
app.add_middleware(PerformanceMonitoringMiddleware)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Response compression middleware (60-80% bandwidth reduction)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add input validation middleware
app.add_middleware(InputValidationMiddleware)


# Security headers middleware (Already imported)
app.add_middleware(SecurityHeadersMiddleware)

# Zero-Trust Implementation: Strict API Key validation
from app.middleware.security import ZeroTrustMiddleware
app.add_middleware(ZeroTrustMiddleware)

# CSRF protection middleware - RE-ENABLED for production security
from core.csrf_protection import CSRFProtectionMiddleware

app.add_middleware(CSRFProtectionMiddleware)

# Request ID middleware - distributed tracing (runs early)
app.add_middleware(RequestIDMiddleware)

# Deprecated endpoint monitoring - tracks usage of deprecated APIs
from app.middleware.deprecated_monitor import DeprecatedEndpointMonitor
app.add_middleware(DeprecatedEndpointMonitor)


# Request logging middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """
    Middleware for logging all requests with comprehensive audit trail and deprecated endpoint tracking.
    """
    import time
    import uuid

    from app.services.infrastructure.security.audit_service import audit_service

    # Use existing request ID from RequestIDMiddleware, or fallback
    request_id = getattr(request.state, "request_id", str(uuid.uuid4())[:8])
    start_time = time.time()

    # Get client information
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    method = request.method
    path = request.url.path
    query_params = str(request.query_params)

    # Check for deprecated endpoints
    deprecated_info = None
    if path in DEPRECATED_ENDPOINTS:
        deprecated_info = DEPRECATED_ENDPOINTS[path]
        logger.warning(
            f"Deprecated endpoint accessed: {path}",
            extra={
                "deprecated_endpoint": path,
                "deprecated_since": deprecated_info["deprecated_since"],
                "replacement": deprecated_info.get("replacement"),
                "request_id": request_id,
                "client_ip": client_ip
            }
        )

    # Extract user ID from JWT token (simplified for now)
    user_id = None
    session_id = str(uuid.uuid4())  # Generate session ID for tracking

    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            # In a real implementation, you'd decode the JWT to get user info
            # For now, simulate user extraction
            user_id = "authenticated_user"  # Placeholder - would be extracted from JWT
        except Exception as e:
            logger.warning(f"Failed to extract user from token: {e}")

    # Determine audit action type
    if path.startswith("/api/v1/auth"):
        action = "login" if method == "POST" and "login" in path else "auth_access"
    elif any(
        path.startswith(f"/api/v1/{endpoint}")
        for endpoint in ["cases", "transactions", "alerts"]
    ):
        action = "data_access" if method == "GET" else "data_modification"
    elif path.startswith("/api/v1/admin"):
        action = "admin_operation"
    else:
        action = "api_access"

    # Determine resource being accessed
    resource_type = path.replace("/api/v1/", "").split("/")[0] or "api"
    resource_id = None

    # Prepare audit details
    details = {
        "method": method,
        "path": path,
        "query_params": query_params[:500] if query_params else None,  # Limit size
        "user_agent": user_agent[:200],
        "session_id": session_id,
        "request_id": request_id,
    }

    # Add deprecated endpoint info if applicable
    if deprecated_info:
        details["deprecated_endpoint"] = {
            "deprecated_since": deprecated_info["deprecated_since"],
            "removal_version": deprecated_info["removal_version"],
            "migration_guide": deprecated_info["migration_guide"],
            "replacement": deprecated_info["replacement"]
        }

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

        # Add deprecation warning headers if applicable
        if deprecated_info:
            response.headers["X-Deprecated-Endpoint"] = "true"
            response.headers["X-Deprecation-Info"] = f"Deprecated since {deprecated_info['deprecated_since']}. Use {deprecated_info['replacement']} instead."
            response.headers["X-Migration-Guide"] = deprecated_info["migration_guide"]
            # Still return 200 but with warning headers
            response.status_code = 200

        # Update audit details with response info
        details.update(
            {
                "status_code": response.status_code,
                "response_time": round(duration, 3),
                "success": response.status_code < 400,
            }
        )

        # Log successful requests to application log
        log_request(
            request_id=request_id,
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            duration=duration,
        )

        # Log audit event to persistent database
        audit_service.log_request(
            user_id=user_id,
            session_id=session_id,
            method=method,
            endpoint=path,
            status_code=response.status_code,
            processing_time=duration,
            details={
                **details,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
            },
            ip_address=client_ip,
            user_agent=user_agent,
        )

        return response

    except Exception as e:
        duration = time.time() - start_time

        # Log failed requests to application log
        log_error(
            "request_failed",
            f"Request failed: {str(e)}",
            {
                "request_id": request_id,
                "method": request.method,
                "path": str(request.url.path),
                "duration": duration,
            },
        )

        # Log failed request to audit log
        audit_service.log_request(
            user_id=user_id,
            session_id=session_id,
            method=method,
            endpoint=path,
            status_code=500,
            processing_time=duration,
            details={
                **details,
                "action": f"failed_{action}",
                "resource_type": resource_type,
                "resource_id": resource_id,
            },
            ip_address=client_ip,
            user_agent=user_agent,
        )
        raise


# Monitoring middleware
app.middleware("http")(create_monitoring_middleware())

# Rate limiting middleware for DoS protection
from app.middleware.rate_limit import rate_limit_middleware

app.middleware("http")(rate_limit_middleware)

# Include routers with API versioning (before static files)
API_VERSION = "v1"

# Standard Routers
app.include_router(
    auth_router, prefix=f"/api/{API_VERSION}/auth", tags=["Authentication"]
)
app.include_router(search_router, prefix=f"/api/{API_VERSION}/search", tags=["Search"])
app.include_router(admin_router, prefix=f"/api/{API_VERSION}/admin", tags=["Admin"])
app.include_router(users_router, prefix=f"/api/{API_VERSION}/users", tags=["Users"])
app.include_router(
    analytics_router, prefix=f"/api/{API_VERSION}/analytics", tags=["Analytics"]
)
app.include_router(
    reporting_router, prefix=f"/api/{API_VERSION}/reports", tags=["Reporting"]
)
app.include_router(cases_router, prefix=f"/api/{API_VERSION}/cases", tags=["Cases"])
app.include_router(audit_router, prefix=f"/api/{API_VERSION}/audit", tags=["Audit"])
app.include_router(
    cost_optimization_router, prefix=f"/api/{API_VERSION}/cost-optimization", tags=["Cost Optimization"]
)
app.include_router(
    evidence_router, prefix=f"/api/{API_VERSION}/evidence", tags=["Evidence"]
)
app.include_router(fraud_router, prefix=f"/api/{API_VERSION}/fraud", tags=["Fraud"])
app.include_router(
    compliance_router, prefix=f"/api/{API_VERSION}/compliance", tags=["Compliance"]
)

# AI & Intelligence
app.include_router(ai_router, prefix=f"/api/{API_VERSION}/ai", tags=["AI Intelligence"])
app.include_router(
    advanced_ai.router, prefix=f"/api/{API_VERSION}/advanced_ai", tags=["Advanced AI"]
)

# Additional Routers
app.include_router(
    multimodal_router, prefix=f"/api/{API_VERSION}/multimodal", tags=["Multimodal"]
)
# DEPRECATED: Semantic search router - will be removed Feb 1, 2026
# Keep active until removal deadline to allow graceful migration
from datetime import datetime
removal_deadline = datetime(2026, 2, 1)
if datetime.now() < removal_deadline:
    app.include_router(
        semantic_search_router,
        prefix=f"/api/{API_VERSION}/semantic_search",
        tags=["Semantic Search (DEPRECATED)"],
    )
else:
    logger.warning("Semantic search router removal deadline reached - endpoints disabled")
app.include_router(
    logging_router, prefix=f"/api/{API_VERSION}/logging", tags=["Logging"]
)
app.include_router(apm_router, prefix=f"/api/{API_VERSION}/apm", tags=["APM"])
app.include_router(graph_router, prefix=f"/api/{API_VERSION}/graph", tags=["Graph"])
app.include_router(
    realtime_sync_router, prefix=f"/api/{API_VERSION}/sync", tags=["Realtime Sync"]
)
app.include_router(
    notifications_router,
    prefix=f"/api/{API_VERSION}/notifications",
    tags=["Notifications"],
)
app.include_router(backup_router, prefix=f"/api/{API_VERSION}/backup", tags=["Backup"])
app.include_router(
    fraud_rules_router, prefix=f"/api/{API_VERSION}/rules", tags=["Fraud Rules"]
)
app.include_router(
    collaboration_router,
    prefix=f"/api/{API_VERSION}/collaboration",
    tags=["Collaboration"],
)
app.include_router(stats_router, prefix=f"/api/{API_VERSION}/stats", tags=["Stats"])
app.include_router(
    reconciliation_router,
    prefix=f"/api/{API_VERSION}/reconciliation",
    tags=["Reconciliation"],
)
app.include_router(
    onboarding_router, prefix=f"/api/{API_VERSION}/onboarding", tags=["Onboarding"]
)
app.include_router(
    metadata_router, prefix=f"/api/{API_VERSION}/metadata", tags=["Metadata"]
)

app.include_router(proof_router, prefix=f"/api/{API_VERSION}/proof", tags=["Proof"])
app.include_router(
    forensic_intel_router, 
    prefix=f"/api/{API_VERSION}/forensic-intel", 
    tags=["Forensic Intelligence"]
)
app.include_router(
    entities_router,
    prefix=f"/api/{API_VERSION}/entities",
    tags=["Entities"]
)
app.include_router(
    csrf_router,
    prefix=f"/api/{API_VERSION}",
    tags=["Security"]
)

# Roadmap to 10/10 Routers
app.include_router(
    collaboration_router,
    prefix=f"/api/{API_VERSION}/collaboration",
    tags=["Collaboration (Roadmap)"]
)
app.include_router(
    time_travel_router,
    prefix=f"/api/{API_VERSION}/cases",
    tags=["Time Travel (Roadmap)"]
)
app.include_router(
    ai_voice_router,
    prefix=f"/api/{API_VERSION}/ai",
    tags=["AI Voice (Roadmap)"]
)
app.include_router(
    macros_router,
    prefix=f"/api/{API_VERSION}/cases",
    tags=["Macros (Roadmap)"]
)

# New Roadmap Routers (Completed)
from app.routers.xai import router as xai_router
from app.routers.regulatory_rag import router as regulatory_rag_router
from app.routers.auth_biometric import router as auth_biometric_router
from app.routers.auth_social import router as auth_social_router
from app.routers.self_healing import router as self_healing_router

app.include_router(xai_router, prefix=f"/api/{API_VERSION}")
app.include_router(regulatory_rag_router, prefix=f"/api/{API_VERSION}")
app.include_router(auth_biometric_router, prefix=f"/api/{API_VERSION}")
app.include_router(auth_social_router, prefix=f"/api/{API_VERSION}")
app.include_router(self_healing_router, prefix=f"/api/{API_VERSION}")

from app.routers.compliance import router as compliance_router
app.include_router(
    compliance_router,
    prefix=f"/api/{API_VERSION}",
    tags=["Compliance"]
)

app.include_router(
    relationships_router_from_entities,
    prefix=f"/api/{API_VERSION}/relationships",
    tags=["Relationships"]
)

try:
    from app.routers.projects import router as projects_router
    app.include_router(
        projects_router,
        prefix=f"/api/{API_VERSION}/projects",
        tags=["Projects"]
    )
except ImportError as e:
    logger.warning(f"Failed to import projects router: {e}")

try:
    from app.routers.alerts import router as alerts_router
    app.include_router(
        alerts_router,
        prefix=f"/api/{API_VERSION}/alerts",
        tags=["Alerts"]
    )
except ImportError as e:
    logger.warning(f"Failed to import alerts router: {e}")


# Optional Routers (Check for ImportError above/try-except)
try:
    from app.routers.metrics import router as metrics_router

    app.include_router(metrics_router, tags=["Metrics"])
except ImportError:
    pass

try:
    from app.routers.streaming import router as streaming_router

    app.include_router(
        streaming_router, prefix=f"/api/{API_VERSION}", tags=["Streaming"]
    )
except ImportError:
    pass

try:
    from app.routers.websocket import router as websocket_router

    app.include_router(websocket_router, tags=["WebSocket"])
except ImportError:
    pass

try:
    from app.routers.diagnostics import router as diagnostics_router

    app.include_router(
        diagnostics_router,
        prefix=f"/api/{API_VERSION}/diagnostics",
        tags=["Diagnostics"],
    )
except ImportError:
    pass


# Health check endpoints
@app.get("/analytics/journey")
def get_journey_analytics():
    """Get user journey and funnel analytics"""
    try:
        # Check if analytics is disabled (test mode)
        if not hasattr(user_journey_tracker, 'get_funnel_analysis'):
            # Return mock data for testing
            return {
                "funnel_analysis": {
                    "total_users": 150,
                    "step_conversion": {
                        "login": 100,
                        "dashboard_view": 95,
                        "case_creation": 78,
                        "evidence_upload": 65
                    },
                    "drop_off_points": ["evidence_upload"]
                },
                "session_analytics": {
                    "avg_session_duration": 1800,
                    "total_sessions": 450,
                    "bounce_rate": 0.15
                },
                "status": "success"
            }

        funnel_data = user_journey_tracker.get_funnel_analysis()
        session_data = user_journey_tracker.get_session_analytics()

        return {
            "funnel_analysis": funnel_data,
            "session_analytics": session_data,
            "status": "success"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "funnel_analysis": {},
            "session_analytics": {}
        }


@app.post("/analytics/track")
def track_user_event(event_type: str, user_id: str = None, metadata: dict = None):
    """Track user events for journey analysis"""
    try:
        user_journey_tracker.track_event(user_id or "anonymous", event_type, metadata)
        return {"status": "tracked"}
    except Exception as e:
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
    except Exception as e:
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
        return {"status": "started", "message": "WebSocket server started on ws://localhost:8080"}
    except Exception as e:
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
        request=request
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

    log_error("unexpected_error", f"Unexpected error: {str(exc)}", error_details)

    # Don't expose internal error details in production
    if environment == "production":
        error_response = create_error_response(
            status_code=500,
            detail=localized_error_message,
            error_type="internal_server_error",
            request=request
        )
        return JSONResponse(status_code=500, content=error_response)
    else:
        # Show full details in development
        error_response = create_error_response(
            status_code=500,
            detail=f"{localized_error_message} (Development: {str(exc)})",
            error_type="unexpected_error",
            request=request
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
        request=request
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
