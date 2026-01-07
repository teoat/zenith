import os
import time
import uuid
from datetime import datetime
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.constants import DEPRECATED_ENDPOINTS
from core.logging import logger, log_request, log_error
from app.services.infrastructure.security.audit_service import audit_service
from app.exceptions import setup_exception_handlers

# Middleware imports
from core.validation import InputValidationMiddleware
from core.rate_limiting import RateLimitExceeded as CoreRateLimitExceeded, RateLimitingMiddleware
from app.middleware.security import ZeroTrustMiddleware
from core.csrf_protection import CSRFProtectionMiddleware
from middleware.request_id import RequestIDMiddleware
from app.middleware.deprecated_monitor import DeprecatedEndpointMonitor
from app.services.infrastructure.apm_service import APMMiddleware
from core.performance import PerformanceMonitoringMiddleware

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

async def request_logging_middleware(request: Request, call_next):
    """
    Middleware for logging all requests with comprehensive audit trail and deprecated endpoint tracking.
    """
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
                "client_ip": client_ip,
            },
        )

    # Extract user ID from JWT token (simplified for now)
    user_id = None
    session_id = str(uuid.uuid4())  # Generate session ID for tracking

    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            # In a real implementation, you'd decode the JWT to get user info
            # For now, simulate user extraction
            user_id = "authenticated_user"  # Placeholder
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
            "replacement": deprecated_info["replacement"],
        }

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

        # Add deprecation warning headers if applicable
        if deprecated_info:
            response.headers["X-Deprecated-Endpoint"] = "true"
            response.headers["X-Deprecation-Info"] = (
                f"Deprecated since {deprecated_info['deprecated_since']}. Use {deprecated_info['replacement']} instead."
            )
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
            f"Request failed: {e!s}",
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

def setup_middleware(app: FastAPI):
    # Setup Exception Handlers
    setup_exception_handlers(app)

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
            ],
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
        allowed_origins = ["https://app.zenith.com", "https://api.zenith.com"]

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

    # Security Headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Response compression middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Add input validation middleware
    app.add_middleware(InputValidationMiddleware)

    # Zero-Trust Implementation: Strict API Key validation
    app.add_middleware(ZeroTrustMiddleware)

    # CSRF protection middleware - RE-ENABLED for production security
    app.add_middleware(CSRFProtectionMiddleware)

    # Request ID middleware - distributed tracing (runs early)
    app.add_middleware(RequestIDMiddleware)

    # Deprecated endpoint monitoring
    app.add_middleware(DeprecatedEndpointMonitor)

    # Request logging middleware
    app.middleware("http")(request_logging_middleware)
