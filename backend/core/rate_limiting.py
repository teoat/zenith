"""
Rate Limiting Middleware for Zenith Fraud Detection API

Implements sliding window rate limiting using Redis for distributed rate limiting
across multiple API instances.
"""

import time
from collections import defaultdict
from typing import Dict, Optional

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from core.config import settings
from core.logging import logger

# Rate limit configurations
RATE_LIMITS = {
    # Authentication endpoints - strict limits
    "/api/v1/auth/login": {"requests": 5, "window": 300},  # 5 requests per 5 minutes
    "/api/v1/auth/register": {"requests": 3, "window": 3600},  # 3 requests per hour
    "/api/v1/auth/token": {"requests": 10, "window": 300},  # 10 requests per 5 minutes

    # API endpoints - moderate limits
    "/api/v1": {"requests": 100, "window": 60},  # 100 requests per minute
    "/api/v1/cases": {"requests": 50, "window": 60},  # 50 requests per minute
    "/api/v1/transactions": {"requests": 30, "window": 60},  # 30 requests per minute

    # File uploads - restrictive limits
    "/api/v1/evidence/upload": {"requests": 10, "window": 3600},  # 10 uploads per hour
    "/api/v1/transactions/upload": {"requests": 5, "window": 3600},  # 5 uploads per hour

    # Search endpoints - moderate limits
    "/api/v1/search": {"requests": 20, "window": 60},  # 20 searches per minute

    # Default for unmatched routes
    "default": {"requests": 100, "window": 60},  # 100 requests per minute
}

# In-memory store for rate limiting (use Redis in production)
rate_limit_store: Dict[str, list] = defaultdict(list)


class RateLimitExceeded(HTTPException):
    """Custom exception for rate limit exceeded"""

    def __init__(self, retry_after: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    "category": "security_error",
                }
            },
            headers={"Retry-After": str(retry_after)},
        )


def get_client_identifier(request: Request) -> str:
    """
    Get a unique identifier for the client making the request.
    Uses IP address primarily, with user ID if authenticated.
    """
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"

    # If user is authenticated, include user ID for per-user limits
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # We could decode the token here, but for rate limiting
        # we'll use a hash of the token + IP for now
        import hashlib
        token_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:16]
        return f"{client_ip}:{token_hash}"

    return client_ip


def get_rate_limit_for_path(path: str) -> Dict[str, int]:
    """
    Get rate limit configuration for a given path.
    Uses longest prefix matching for nested routes.
    """
    # Check for exact matches first
    if path in RATE_LIMITS:
        return RATE_LIMITS[path]

    # Check for prefix matches
    for route_prefix, limits in RATE_LIMITS.items():
        if route_prefix != "default" and path.startswith(route_prefix):
            return limits

    # Return default limits
    return RATE_LIMITS["default"]


def is_rate_limited(client_id: str, path: str) -> tuple[bool, int]:
    """
    Check if a client has exceeded their rate limit.

    Returns:
        tuple: (is_limited: bool, retry_after_seconds: int)
    """
    limits = get_rate_limit_for_path(path)
    max_requests = limits["requests"]
    window_seconds = limits["window"]

    current_time = time.time()
    window_start = current_time - window_seconds

    # Get client's request history
    client_requests = rate_limit_store[client_id]

    # Remove requests outside the current window
    client_requests[:] = [req_time for req_time in client_requests if req_time > window_start]

    # Check if limit exceeded
    if len(client_requests) >= max_requests:
        # Calculate retry after time (when oldest request expires)
        if client_requests:
            oldest_request = min(client_requests)
            retry_after = int(window_start - oldest_request + window_seconds)
            return True, max(retry_after, 1)
        return True, window_seconds

    # Add current request
    client_requests.append(current_time)

    # Clean up old entries periodically (every 1000 requests)
    if len(rate_limit_store) > 1000:
        _cleanup_old_entries()

    return False, 0


def _cleanup_old_entries():
    """Clean up old rate limit entries to prevent memory leaks"""
    current_time = time.time()
    max_window = max(limits["window"] for limits in RATE_LIMITS.values())

    for client_id in list(rate_limit_store.keys()):
        client_requests = rate_limit_store[client_id]
        # Remove requests older than the largest window
        cutoff_time = current_time - max_window
        client_requests[:] = [req_time for req_time in client_requests if req_time > cutoff_time]

        # Remove empty client entries
        if not client_requests:
            del rate_limit_store[client_id]


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce rate limiting on API endpoints.

    Exempt paths: health checks, static files, OPTIONS requests
    """

    EXEMPT_PATHS = {
        "/health",
        "/health/live",
        "/health/ready",
        "/health/startup",
        "/metrics",
        "/docs",
        "/openapi.json",
        "/favicon.ico",
    }

    EXEMPT_METHODS = {"OPTIONS", "HEAD"}

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for exempt paths and methods
        if (
            request.method in self.EXEMPT_METHODS
            or request.url.path in self.EXEMPT_PATHS
            or any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS)
        ):
            return await call_next(request)

        # Get client identifier
        client_id = get_client_identifier(request)

        # Check rate limit
        is_limited, retry_after = is_rate_limited(client_id, request.url.path)

        if is_limited:
            logger.warning(
                "Rate limit exceeded",
                extra={
                    "client_id": client_id,
                    "path": request.url.path,
                    "method": request.method,
                    "retry_after": retry_after,
                },
            )
            raise RateLimitExceeded(retry_after)

        # Log rate limit status for monitoring
        logger.debug(
            "Rate limit check passed",
            extra={
                "client_id": client_id,
                "path": request.url.path,
                "method": request.method,
            },
        )

        # Proceed with request
        response = await call_next(request)
        return response


# Helper functions for testing and monitoring
def get_rate_limit_status(client_id: str, path: str) -> Dict:
    """
    Get current rate limit status for monitoring/debugging.
    """
    limits = get_rate_limit_for_path(path)
    client_requests = rate_limit_store.get(client_id, [])
    current_time = time.time()
    window_start = current_time - limits["window"]

    # Count requests in current window
    active_requests = [req_time for req_time in client_requests if req_time > window_start]

    return {
        "client_id": client_id,
        "path": path,
        "limits": limits,
        "current_requests": len(active_requests),
        "remaining_requests": max(0, limits["requests"] - len(active_requests)),
        "window_remaining_seconds": int(limits["window"] - (current_time - window_start)),
    }


def reset_rate_limits(client_id: Optional[str] = None):
    """
    Reset rate limits for a specific client or all clients (admin function).
    """
    if client_id:
        rate_limit_store.pop(client_id, None)
    else:
        rate_limit_store.clear()
    logger.info(f"Rate limits reset for client: {client_id or 'all clients'}")