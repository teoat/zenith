"""
Unified Rate Limiting System

Consolidates all rate limiting implementations into a single, cohesive system.
Supports both in-memory (development) and Redis-based (production) rate limiting.
"""

import time
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

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
    "/api/v1/transactions/upload": {
        "requests": 5,
        "window": 3600,
    },  # 5 uploads per hour
    # Search endpoints - moderate limits
    "/api/v1/search": {"requests": 20, "window": 60},  # 20 searches per minute
    # Default for unmatched routes
    "default": {"requests": 100, "window": 60},  # 100 requests per minute
}


class RateLimitExceeded(HTTPException):
    """Custom exception for rate limit exceeded"""

    def __init__(self, retry_after: int, endpoint: str = "unknown"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded for {endpoint}. Try again in {retry_after} seconds.",
                    "category": "security_error",
                    "retry_after": retry_after,
                    "endpoint": endpoint,
                }
            },
            headers={"Retry-After": str(retry_after)},
        )


class RateLimitStore:
    """Abstract base class for rate limit storage"""

    async def get_request_count(self, key: str, window: int) -> int:
        """Get current request count for a key within the window"""
        raise NotImplementedError

    async def increment_request(self, key: str, window: int, ttl: int) -> int:
        """Increment request count and return new count"""
        raise NotImplementedError

    async def reset_key(self, key: str) -> bool:
        """Reset rate limit for a specific key"""
        raise NotImplementedError


class InMemoryRateLimitStore(RateLimitStore):
    """In-memory rate limit store for development"""

    def __init__(self):
        self.store: Dict[str, List[float]] = defaultdict(list)

    async def get_request_count(self, key: str, window: int) -> int:
        """Get current request count for a key within the window"""
        current_time = time.time()
        window_start = current_time - window

        requests = self.store.get(key, [])
        active_requests = [req_time for req_time in requests if req_time > window_start]

        # Update store with cleaned requests
        self.store[key] = active_requests
        return len(active_requests)

    async def increment_request(self, key: str, window: int, ttl: int) -> int:
        """Increment request count and return new count"""
        current_time = time.time()

        if key not in self.store:
            self.store[key] = []

        # Clean old requests
        window_start = current_time - window
        self.store[key] = [req_time for req_time in self.store[key] if req_time > window_start]

        # Add current request
        self.store[key].append(current_time)

        # Clean up old entries periodically
        if len(self.store) > 1000:
            self._cleanup_old_entries()

        return len(self.store[key])

    async def reset_key(self, key: str) -> bool:
        """Reset rate limit for a specific key"""
        if key in self.store:
            del self.store[key]
            return True
        return False

    def _cleanup_old_entries(self):
        """Clean up old rate limit entries to prevent memory leaks"""
        current_time = time.time()
        max_window = max(limits["window"] for limits in RATE_LIMITS.values())
        cutoff_time = current_time - max_window

        for key in list(self.store.keys()):
            self.store[key] = [req_time for req_time in self.store[key] if req_time > cutoff_time]
            if not self.store[key]:
                del self.store[key]


class RedisRateLimitStore(RateLimitStore):
    """Redis-based rate limit store for production"""

    def __init__(self, redis_client):
        self.redis = redis_client

    async def get_request_count(self, key: str, window: int) -> int:
        """Get current request count for a key within the window"""
        try:
            count = await self.redis.get(key)
            return int(count) if count else 0
        except Exception as e:
            logger.error(f"Redis get request count failed: {e}")
            return 0

    async def increment_request(self, key: str, window: int, ttl: int) -> int:
        """Increment request count and return new count"""
        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, ttl)
            results = await pipe.execute()
            return results[0]
        except Exception as e:
            logger.error(f"Redis increment request failed: {e}")
            return 0

    async def reset_key(self, key: str) -> bool:
        """Reset rate limit for a specific key"""
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis reset key failed: {e}")
            return False


class UnifiedRateLimiter:
    """Unified rate limiting system"""

    def __init__(self, store: RateLimitStore):
        self.store = store

    def get_client_identifier(self, request: Request) -> str:
        """Get a unique identifier for the client making the request"""
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

    def get_rate_limit_for_path(self, path: str) -> Dict[str, int]:
        """Get rate limit configuration for a given path"""
        # Check for exact matches first
        if path in RATE_LIMITS:
            return RATE_LIMITS[path]

        # Check for prefix matches
        for route_prefix, limits in RATE_LIMITS.items():
            if route_prefix != "default" and path.startswith(route_prefix):
                return limits

        # Return default limits
        return RATE_LIMITS["default"]

    async def check_rate_limit(self, request: Request) -> Tuple[bool, int, Dict[str, int]]:
        """
        Check if a request should be rate limited.

        Returns:
            tuple: (is_limited: bool, retry_after_seconds: int, limits: dict)
        """
        path = request.url.path
        client_id = self.get_client_identifier(request)
        limits = self.get_rate_limit_for_path(path)

        max_requests = limits["requests"]
        window_seconds = limits["window"]

        # Create rate limit key
        key = f"rate_limit:{client_id}:{path}"

        # Get current count
        current_count = await self.store.get_request_count(key, window_seconds)

        if current_count >= max_requests:
            # Calculate retry after time
            retry_after = window_seconds
            return True, retry_after, limits

        # Increment request count
        new_count = await self.store.increment_request(key, window_seconds, window_seconds)

        if new_count > max_requests:
            return True, window_seconds, limits

        return False, 0, limits

    async def reset_rate_limit(self, client_id: Optional[str] = None, path: Optional[str] = None) -> bool:
        """Reset rate limit for a specific client or all clients"""
        if client_id and path:
            key = f"rate_limit:{client_id}:{path}"
            return await self.store.reset_key(key)
        return False


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Unified rate limiting middleware"""

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

    def __init__(self, app, store: Optional[RateLimitStore] = None):
        super().__init__(app)

        # Initialize store based on environment
        if store:
            self.store = store
        else:
            # Try to use Redis if available, fallback to in-memory
            try:
                import os

                if os.getenv("ENVIRONMENT", "development").lower() == "production":
                    # Try to initialize Redis
                    import redis.asyncio as redis

                    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
                    self.store = RedisRateLimitStore(redis_client)
                    logger.info("Using Redis for rate limiting")
                else:
                    raise ImportError("Use in-memory for development")
            except (ImportError, Exception):
                self.store = InMemoryRateLimitStore()
                logger.info("Using in-memory store for rate limiting")

        self.limiter = UnifiedRateLimiter(self.store)

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for exempt paths and methods
        if (
            request.method in self.EXEMPT_METHODS
            or request.url.path in self.EXEMPT_PATHS
            or any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS)
        ):
            return await call_next(request)

        # Check rate limit
        is_limited, retry_after, limits = await self.limiter.check_rate_limit(request)

        if is_limited:
            logger.warning(
                "Rate limit exceeded",
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "retry_after": retry_after,
                    "limits": limits,
                },
            )
            raise RateLimitExceeded(retry_after, request.url.path)

        # Log rate limit status for monitoring
        logger.debug(
            "Rate limit check passed",
            extra={
                "path": request.url.path,
                "method": request.method,
                "limits": limits,
            },
        )

        # Proceed with request
        response = await call_next(request)
        return response


# Factory function for creating rate limiter
def create_rate_limiter() -> UnifiedRateLimiter:
    """Create a rate limiter instance with appropriate store"""
    try:
        import os

        if os.getenv("ENVIRONMENT", "development").lower() == "production":
            import redis.asyncio as redis

            redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
            store = RedisRateLimitStore(redis_client)
            logger.info("Rate limiter using Redis store")
        else:
            raise ImportError("Use in-memory for development")
    except (ImportError, Exception):
        store = InMemoryRateLimitStore()
        logger.info("Rate limiter using in-memory store")

    return UnifiedRateLimiter(store)


# Helper functions for testing and monitoring
async def get_rate_limit_status(limiter: UnifiedRateLimiter, client_id: str, path: str) -> Dict:
    """Get current rate limit status for monitoring/debugging"""
    limits = limiter.get_rate_limit_for_path(path)
    key = f"rate_limit:{client_id}:{path}"

    current_count = await limiter.store.get_request_count(key, limits["window"])

    return {
        "client_id": client_id,
        "path": path,
        "limits": limits,
        "current_requests": current_count,
        "remaining_requests": max(0, limits["requests"] - current_count),
        "window_remaining_seconds": limits["window"],  # Simplified for now
    }


# Legacy compatibility functions
def get_client_identifier(request: Request) -> str:
    """Legacy function - use UnifiedRateLimiter.get_client_identifier instead"""
    limiter = UnifiedRateLimiter(InMemoryRateLimitStore())
    return limiter.get_client_identifier(request)


def get_rate_limit_for_path(path: str) -> Dict[str, int]:
    """Legacy function - use UnifiedRateLimiter.get_rate_limit_for_path instead"""
    limiter = UnifiedRateLimiter(InMemoryRateLimitStore())
    return limiter.get_rate_limit_for_path(path)


# Export main classes and functions
__all__ = [
    "RateLimitingMiddleware",
    "UnifiedRateLimiter",
    "RateLimitStore",
    "InMemoryRateLimitStore",
    "RedisRateLimitStore",
    "RateLimitExceeded",
    "create_rate_limiter",
    "get_rate_limit_status",
    # Legacy compatibility
    "get_client_identifier",
    "get_rate_limit_for_path",
]
