"""Security middleware for request validation."""

import re
from typing import Optional, Pattern

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware for request validation and sanitization."""

    SQL_INJECTION_PATTERN: Pattern[str] = re.compile(
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)|"
        r"(')|(--)|(\/\*)|(\*\/)|(%27)|(%3D)|(%3B)",
        re.IGNORECASE,
    )

    SCRIPT_PATTERN: Pattern[str] = re.compile(
        r"<script[^>]*>.*?</script>|<[^>]*on\w+\s*=\s*['\"][^'\"]*['\"][^>]*>",
        re.IGNORECASE | re.DOTALL,
    )

    def __init__(self, allow_patterns: Optional[list[Pattern[str]]] = None):
        super().__init__()
        self.allow_patterns = allow_patterns or []

    async def dispatch(self, request: Request, call_next):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        body = await request.body()
        if body:
            body_str = body.decode("utf-8", errors="ignore")

            if self.SQL_INJECTION_PATTERN.search(body_str):
                return JSONResponse(
                    status_code=400,
                    content={"error": "Potential SQL injection detected"},
                )

            if self.SCRIPT_PATTERN.search(body_str):
                return JSONResponse(
                    status_code=400,
                    content={"error": "Potential XSS attack detected"},
                )

        response = await call_next(request)
        return response
