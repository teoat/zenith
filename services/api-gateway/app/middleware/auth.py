"""
Authentication middleware for API Gateway
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import structlog

logger = structlog.get_logger()


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware"""

    async def dispatch(self, request, call_next):
        # Skip auth for health checks and public routes
        if request.url.path.startswith("/health") or request.url.path.startswith(
            "/api/v1/auth"
        ):
            return await call_next(request)

        # Check for authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "error": {
                        "code": "MISSING_AUTH",
                        "message": "Authorization header required",
                    },
                },
            )

        # TODO: Validate JWT token
        # For now, just pass through
        logger.debug("Auth check passed", path=request.url.path)

        return await call_next(request)
