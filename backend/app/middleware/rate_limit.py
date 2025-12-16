from fastapi import Request, HTTPException
from collections import defaultdict
import time
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_per_minute: int = 100, burst_limit: int = 20):
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit  # Allow burst of requests
        self.requests = defaultdict(list)
        self.blocked_ips = set()

    def is_allowed(self, client_ip: str) -> bool:
        """Check if request is within rate limits with burst protection"""
        if client_ip in self.blocked_ips:
            return False

        current_time = time.time()
        window_start = current_time - 60  # 1 minute window

        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > window_start
        ]

        request_count = len(self.requests[client_ip])

        # Check burst limit (requests in last 10 seconds)
        burst_window = current_time - 10
        burst_count = sum(1 for req_time in self.requests[client_ip] if req_time > burst_window)

        if burst_count >= self.burst_limit:
            # Temporary block for burst abuse
            self.blocked_ips.add(client_ip)
            # Auto-unblock after 5 minutes
            import threading
            timer = threading.Timer(300, lambda: self.blocked_ips.discard(client_ip))
            timer.start()
            logger.warning(f"IP {client_ip} temporarily blocked for burst abuse")
            return False

        # Check sustained rate limit
        if request_count >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP {client_ip}")
            return False

        # Add current request
        self.requests[client_ip].append(current_time)
        return True

# Global rate limiter instance
rate_limiter = RateLimiter(requests_per_minute=100)  # 100 requests per minute

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    client_ip = request.client.host if request.client else "unknown"

    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )

    response = await call_next(request)
    return response