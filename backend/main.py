# main.py
import json
import os
from contextlib import asynccontextmanager
import asyncio

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse
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
from app.routers.evidence import router as evidence_router
from app.routers.fraud import router as fraud_router
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
from app.services.infrastructure.apm_service import APMMiddleware
from app.services.infrastructure.security.audit_service import audit_service
from app.services.integration.collaboration.collaboration_service import collaboration_manager
from app.services.infrastructure.monitoring_service import (
    create_monitoring_middleware,
    monitoring_service,
)
from app.services.infrastructure.performance_monitor import performance_monitor
from core.database import create_tables
from core.logging import log_error, log_request, logger
from core.performance import PerformanceMonitoringMiddleware
from core.api_documentation import setup_api_documentation
from core.sentry_config import init_sentry
from core.validation import InputValidationMiddleware
from middleware.request_id import RequestIDMiddleware

# Import new models to ensure registration with Base.metadata
from core.plugin_system import models as plugin_models
from core.feature_flags import models as feature_flag_models
from core.eav import models as eav_models


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
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https://api.378x492.com; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp

        # Remove server information (use del instead of pop for MutableHeaders)
        if "Server" in response.headers:
            del response.headers["Server"]
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]

        return response


# Lifespan context manager (replaces deprecated on_event decorators)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    # Startup
    logger.info("Starting 378x492 Fraud Detection API", extra={"event": "startup"})
    try:
        # Create database tables (Development only)
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

        # Initialize Sentry
        # if init_sentry():
        #     logger.info("✅ Sentry error monitoring enabled", extra={"event": "sentry_init"})

        # monitoring_service.start_monitoring()
        # performance_monitor.start_monitoring()
        # apm_service.start_monitoring()
        logger.info(
            "Monitoring services disabled for debugging",
            extra={"event": "monitoring_start"},
        )

        # Start collaboration WebSocket server if enabled (non-blocking for testing)
        if os.getenv("ENABLE_COLLABORATION_WS", "false").lower() == "true":
            # Start in background task to avoid blocking lifespan during testing
            asyncio.create_task(collaboration_manager.start_server())
            logger.info(
                "Collaboration WebSocket server starting on ws://localhost:8080",
                extra={"event": "collaboration_starting"},
            )
        else:
            logger.info(
                "Collaboration WebSocket server disabled (set ENABLE_COLLABORATION_WS=true to enable)",
                extra={"event": "collaboration_disabled"},
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

    # Shutdown
    logger.info(
        "Shutting down 378x492 Fraud Detection API", extra={"event": "shutdown"}
    )
    try:
        monitoring_service.stop_monitoring()
        performance_monitor.stop_monitoring()
        apm_service.stop_monitoring()
        logger.info("Monitoring services stopped", extra={"event": "monitoring_stop"})

        await collaboration_manager.stop_server()
        logger.info(
            "Collaboration WebSocket server stopped",
            extra={"event": "collaboration_stop"},
        )

        logger.info(
            "378x492 API shutdown completed", extra={"event": "shutdown_complete"}
        )
    except Exception as e:
        logger.error(
            "Error during shutdown", extra={"error": str(e), "event": "shutdown_error"}
        )


app = FastAPI(
    title="378x492 Fraud Detection API",
    version="1.0.0",
    description="Backend API for desktop fraud detection application",
    lifespan=lifespan,
)

# Setup comprehensive API documentation with custom OpenAPI schema
app = setup_api_documentation(app)

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
        "http://localhost:5173",  # React dev server
        "http://127.0.0.1:5173",
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

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# APM Monitoring
app.add_middleware(APMMiddleware)

# Performance monitoring middleware for Prometheus metrics
app.add_middleware(PerformanceMonitoringMiddleware)

# Response compression middleware (60-80% bandwidth reduction)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add input validation middleware
app.add_middleware(InputValidationMiddleware)

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# CSRF protection middleware - RE-ENABLED for production security
from core.csrf_protection import CSRFProtectionMiddleware

app.add_middleware(CSRFProtectionMiddleware)

# Request ID middleware - distributed tracing (runs early)
app.add_middleware(RequestIDMiddleware)


# Request logging middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """
    Middleware for logging all requests with comprehensive audit trail.
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

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

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
    reporting_router, prefix=f"/api/{API_VERSION}/reporting", tags=["Reporting"]
)
app.include_router(cases_router, prefix=f"/api/{API_VERSION}/cases", tags=["Cases"])
app.include_router(audit_router, prefix=f"/api/{API_VERSION}/audit", tags=["Audit"])
app.include_router(
    evidence_router, prefix=f"/api/{API_VERSION}/evidence", tags=["Evidence"]
)
app.include_router(fraud_router, prefix=f"/api/{API_VERSION}/fraud", tags=["Fraud"])

# AI & Intelligence
app.include_router(ai_router, prefix=f"/api/{API_VERSION}/ai", tags=["AI Intelligence"])
app.include_router(
    advanced_ai.router, prefix=f"/api/{API_VERSION}/advanced_ai", tags=["Advanced AI"]
)

# Additional Routers
app.include_router(
    multimodal_router, prefix=f"/api/{API_VERSION}/multimodal", tags=["Multimodal"]
)
app.include_router(
    semantic_search_router,
    prefix=f"/api/{API_VERSION}/semantic_search",
    tags=["Semantic Search"],
)
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


# Global exception handlers


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with structured logging"""
    log_error(
        "http_exception",
        f"HTTP {exc.status_code}: {exc.detail}",
        {
            "status_code": exc.status_code,
            "path": str(request.url),
            "method": request.method,
            "client_ip": request.client.host if request.client else None,
        },
    )

    # Return standard FastAPI error shape to match tests that expect a top-level 'detail' key
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with structured logging"""
    error_details = {
        "type": type(exc).__name__,
        "message": str(exc),
        "traceback": traceback.format_exc(),
        "path": str(request.url),
        "method": request.method,
        "client_ip": request.client.host if request.client else None,
    }

    log_error("unexpected_error", f"Unexpected error: {str(exc)}", error_details)

    # Don't expose internal error details in production
    if environment == "production":
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "type": "internal_server_error",
                    "status_code": 500,
                    "detail": "An unexpected error occurred. Please try again later.",
                }
            },
        )
    else:
        # Show full details in development
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "type": "unexpected_error",
                    "status_code": 500,
                    "detail": str(exc),
                    "traceback": traceback.format_exc(),
                }
            },
        )


@app.exception_handler(StarletteHTTPException)
async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle Starlette HTTP exceptions"""
    log_error(
        "starlette_exception",
        f"Starlette HTTP {exc.status_code}: {exc.detail}",
        {
            "status_code": exc.status_code,
            "path": str(request.url),
            "method": request.method,
        },
    )

    # Preserve the familiar FastAPI/Starlette response shape
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


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
