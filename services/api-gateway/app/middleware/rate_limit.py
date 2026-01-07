"""Rate limiting middleware."""

import time
from collections import defaultdict
from dataclasses import dataclass
from typing import DefaultDict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.utils.config import settings


@dataclass
class RateLimitConfig:
    requests: int
    window: int


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using sliding window algorithm."""

    def __init__(self):
        super().__init__()
        self.requests: DefaultDict[str, list[float]] = defaultdict(list)
        self.config = RateLimitConfig(
            requests=settings.RATE_LIMIT_REQUESTS,
            window=settings.RATE_LIMIT_WINDOW,
        )

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        requests = self.requests[client_ip]
        window_start = current_time - self.config.window

        requests = [t for t in requests if t > window_start]
        self.requests[client_ip] = requests

        if len(requests) >= self.config.requests:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many requests",
                    "retry_after": int(requests[0] - window_start) if requests else self.config.window,
                },
            )

        requests.append(current_time)

        response = await call_next(request)
        return response
