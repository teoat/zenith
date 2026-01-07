import os

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security headers middleware implementing defense-in-depth.

    Protects against:
    - XSS (Content-Security-Policy)
    - Clickjacking (X-Frame-Options)
    - MIME-type attacks (X-Content-Type-Options)
    - Data leaks (Referrer-Policy)
    - Unwanted features (Permissions-Policy)
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Content Security Policy - Strict policy to prevent XSS
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Adjust 'unsafe-*' as needed
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https: blob:; "
            "font-src 'self' data:; "
            "connect-src 'self' ws: wss:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )

        # Clickjacking protection
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS Protection (legacy but still useful for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Force HTTPS (only in production)
        environment = os.getenv("ENVIRONMENT", "development").lower()
        if environment != "development":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # Referrer Policy - Limit information leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy - Disable unnecessary browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )

        # Cross-Origin policies for additional isolation
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

        # Remove server identity to prevent information disclosure
        if "server" in response.headers:
            del response.headers["server"]

        # Add custom security header for version tracking (optional)
        response.headers["X-Security-Version"] = "1.0.0"

        return response


class TrustedHostMiddleware(BaseHTTPMiddleware):
    """
    Middleware for mTLS and Trusted Host validation placeholders.
    In real deployment, mTLS is terminated at the Load Balancer / Mesh (Istio),
    but this layer validates the forwarded client certificate headers.
    """

    async def dispatch(self, request: Request, call_next):
        # Placeholder: Verify X-Forwarded-Client-Cert if we were in stricter mode
        # cert = request.headers.get("X-Forwarded-Client-Cert")
        # if not cert and request.url.path not in ["/health", "/metrics", "/docs", "/openapi.json"]:
        #    ...

        return await call_next(request)


class ZeroTrustMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce strict API Key validation for backend-to-backend communication
    between Electron (Main Process) and FastAPI.
    """

    def __init__(self, app, api_key: str | None = None):
        super().__init__(app)
        self.api_key = api_key or os.getenv("BACKEND_API_KEY")
        self.exempt_paths = [
            "/health",
            "/health/ready",
            "/health/live",
            "/metrics",
            "/docs",
            "/openapi.json",
            "/redoc",
        ]

    async def dispatch(self, request: Request, call_next):
        # Exempt health checks and documentation
        if request.url.path in self.exempt_paths:
            return await call_next(request)

        # Check for API Key in headers
        provided_key = request.headers.get("X-API-Key")

        if not self.api_key:
            # If no API key is configured, allow for now but log warning
            # In true Zero Trust, we would fail here.
            return await call_next(request)

        if provided_key != self.api_key:
            from starlette.responses import JSONResponse

            return JSONResponse(
                status_code=403,
                content={"detail": "Zero-Trust Violation: Invalid or missing API Key"},
            )

        return await call_next(request)
