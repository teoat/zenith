"""
Rate limiting middleware for API Gateway
"""

import time
from collections import defaultdict
from typing import Dict
import structlog

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.utils.config import settings

logger = structlog.get_logger()


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using sliding window"""

    def __init__(self, app):
        super().__init__(app)
        self.requests: Dict[str, list] = defaultdict(list)
        self.max_requests = settings.RATE_LIMIT_REQUESTS
        self.window_seconds = settings.RATE_LIMIT_WINDOW

    async def dispatch(self, request: Request, call_next):
        # Get client identifier (IP address)
        client_ip = self._get_client_ip(request)

        # Clean old requests
        self._clean_old_requests(client_ip)

        # Check rate limit
        if len(self.requests[client_ip]) >= self.max_requests:
            logger.warning("Rate limit exceeded", client_ip=client_ip)
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many requests. Limit: {self.max_requests} per {self.window_seconds} seconds",
                    },
                },
                headers={
                    "Retry-After": str(self.window_seconds),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + self.window_seconds)),
                },
            )

        # Record request
        self.requests[client_ip].append(time.time())

        # Add rate limit headers
        response = await call_next(request)
        remaining = max(0, self.max_requests - len(self.requests[client_ip]))

        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(
            int(time.time() + self.window_seconds)
        )

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request"""
        # Check X-Forwarded-For header (from proxies/load balancers)
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            # Take the first IP (original client)
            return x_forwarded_for.split(",")[0].strip()

        # Check X-Real-IP header (from nginx)
        x_real_ip = request.headers.get("X-Real-IP")
        if x_real_ip:
            return x_real_ip

        # Fallback to direct connection
        return request.client.host if request.client else "unknown"

    def _clean_old_requests(self, client_ip: str):
        """Remove requests outside the time window"""
        current_time = time.time()
        window_start = current_time - self.window_seconds

        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip] if req_time > window_start
        ]
