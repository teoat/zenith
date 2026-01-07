"""
HTTP client for inter-service communication.
Provides circuit breaker, retry, and caching capabilities.
"""

import asyncio
import logging
from typing import Any, Optional
from datetime import datetime

import httpx
from redis.asyncio import Redis

from app.utils.config import settings

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """Circuit breaker for service resilience."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = {}
        self.last_failure = {}

    async def call(self, service: str, func):
        if await self._is_open(service):
            raise Exception(f"Circuit breaker open for {service}")

        try:
            result = await func()
            await self._record_success(service)
            return result
        except Exception as e:
            await self._record_failure(service)
            raise

    async def _is_open(self, service: str) -> bool:
        if service not in self.failures:
            return False
        if self.failures[service] < self.failure_threshold:
            return False
        time_since_failure = datetime.now() - self.last_failure[service]
        return time_since_failure.total_seconds() < self.recovery_timeout

    async def _record_success(self, service: str):
        self.failures.pop(service, None)
        self.last_failure.pop(service, None)

    async def _record_failure(self, service: str):
        self.failures[service] = self.failures.get(service, 0) + 1
        self.last_failure[service] = datetime.now()


class RailwayHttpClient:
    """HTTP client for Railway service communication."""

    def __init__(self):
        self.clients: dict[str, httpx.AsyncClient] = {}
        self.circuit_breaker = CircuitBreaker()
        self._redis: Optional[Redis] = None

    async def _get_redis(self) -> Optional[Redis]:
        if self._redis is None and settings.REDIS_URL:
            self._redis = Redis.from_url(settings.REDIS_URL)
        return self._redis

    async def _get_client(self, base_url: str) -> httpx.AsyncClient:
        if base_url not in self.clients:
            self.clients[base_url] = httpx.AsyncClient(
                base_url=base_url,
                timeout=30.0,
                follow_redirects=True,
            )
        return self.clients[base_url]

    async def proxy_request(
        self,
        url: str,
        method: str = "GET",
        headers: Optional[dict] = None,
        body: Optional[bytes] = None,
    ) -> dict[str, Any]:
        """Proxy a request to a backend service."""
        try:
            client = await self._get_client("")
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=body,
            )
            return {
                "status": response.status_code,
                "data": response.json() if response.headers.get("content-type", "").startswith("application/json") else {},
            }
        except httpx.TimeoutException:
            logger.error(f"Timeout requesting {url}")
            raise
        except httpx.ConnectError as e:
            logger.error(f"Connection error to {url}: {e}")
            raise

    async def get(self, url: str, params: Optional[dict] = None) -> dict[str, Any]:
        """GET request with caching."""
        redis = await self._get_redis()
        cache_key = f"cache:{url}"

        if redis:
            cached = await redis.get(cache_key)
            if cached:
                return {"data": cached, "cached": True}

        client = await self._get_client("")
        response = await client.get(url, params=params)
        result = {"status": response.status_code, "data": response.json()}

        if redis and response.status_code == 200:
            await redis.setex(cache_key, settings.CACHE_TTL, str(result.get("data", {})))

        return result

    async def close(self):
        """Close all HTTP clients."""
        for client in self.clients.values():
            await client.aclose()
        if self._redis:
            await self._redis.close()
