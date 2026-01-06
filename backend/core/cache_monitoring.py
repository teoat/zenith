"""
Cache Performance Monitoring

This module provides cache hit/miss tracking and performance metrics
for monitoring cache effectiveness.
"""

import functools
import time
from collections.abc import Callable
from typing import Any

from prometheus_client import Counter, Gauge, Histogram

from core.logging import logger

# Prometheus metrics for cache
cache_hits = Counter(
    "cache_hits_total", "Number of cache hits", ["cache_name", "operation"]
)

cache_misses = Counter(
    "cache_misses_total", "Number of cache misses", ["cache_name", "operation"]
)

cache_set_errors = Counter(
    "cache_set_errors_total", "Number of cache set errors", ["cache_name"]
)

cache_get_errors = Counter(
    "cache_get_errors_total", "Number of cache get errors", ["cache_name"]
)

cache_latency = Histogram(
    "cache_operation_duration_seconds",
    "Cache operation latency",
    ["cache_name", "operation"],
)

cache_size = Gauge("cache_size_bytes", "Current cache size in bytes", ["cache_name"])

cache_entry_count = Gauge(
    "cache_entries_total", "Number of entries in cache", ["cache_name"]
)


class CacheMonitor:
    """
    Monitor cache performance with automatic metrics tracking.

    Usage:
        monitor = CacheMonitor("user_cache")

        # Record cache hit
        monitor.record_hit("get_user")

        # Record cache miss
        monitor.record_miss("get_user")

        # Monitor cache operation
        with monitor.operation_context("set_user"):
            cache.set(key, value)
    """

    def __init__(self, cache_name: str):
        self.cache_name = cache_name
        self._hit_count = 0
        self._miss_count = 0
        self._total_latency = 0.0
        self._operation_count = 0

    def record_hit(self, operation: str = "get"):
        """Record a cache hit"""
        cache_hits.labels(cache_name=self.cache_name, operation=operation).inc()
        self._hit_count += 1

        logger.debug(
            "Cache hit",
            extra={
                "cache_name": self.cache_name,
                "operation": operation,
                "hit_rate": self.get_hit_rate(),
            },
        )

    def record_miss(self, operation: str = "get"):
        """Record a cache miss"""
        cache_misses.labels(cache_name=self.cache_name, operation=operation).inc()
        self._miss_count += 1

        logger.debug(
            "Cache miss",
            extra={
                "cache_name": self.cache_name,
                "operation": operation,
                "hit_rate": self.get_hit_rate(),
            },
        )

    def record_error(self, operation: str, error: Exception):
        """Record a cache operation error"""
        if operation == "set":
            cache_set_errors.labels(cache_name=self.cache_name).inc()
        else:
            cache_get_errors.labels(cache_name=self.cache_name).inc()

        logger.error(
            "Cache error",
            extra={
                "cache_name": self.cache_name,
                "operation": operation,
                "error": str(error),
            },
        )

    def operation_context(self, operation: str):
        """
        Context manager for monitoring cache operations.

        Usage:
            with monitor.operation_context("get"):
                value = cache.get(key)
        """
        return _CacheOperationContext(self, operation)

    def update_size(self, size_bytes: int):
        """Update cache size metric"""
        cache_size.labels(cache_name=self.cache_name).set(size_bytes)

    def update_entry_count(self, count: int):
        """Update cache entry count metric"""
        cache_entry_count.labels(cache_name=self.cache_name).set(count)

    def get_hit_rate(self) -> float:
        """Calculate cache hit rate"""
        total = self._hit_count + self._miss_count
        if total == 0:
            return 0.0
        return self._hit_count / total

    def get_stats(self) -> dict:
        """Get cache statistics"""
        return {
            "cache_name": self.cache_name,
            "hits": self._hit_count,
            "misses": self._miss_count,
            "hit_rate": self.get_hit_rate(),
            "avg_latency_ms": (
                (self._total_latency / self._operation_count * 1000)
                if self._operation_count > 0
                else 0
            ),
        }


class _CacheOperationContext:
    """Context manager for cache operations"""

    def __init__(self, monitor: CacheMonitor, operation: str):
        self.monitor = monitor
        self.operation = operation
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time

        # Record latency
        cache_latency.labels(
            cache_name=self.monitor.cache_name, operation=self.operation
        ).observe(duration)

        self.monitor._total_latency += duration
        self.monitor._operation_count += 1

        # Record error if occurred
        if exc_type is not None:
            self.monitor.record_error(self.operation, exc_val)

        return False  # Don't suppress exceptions


def monitor_cache(cache_name: str, operation: str = "get"):
    """
    Decorator to monitor cached function calls.

    Usage:
        @monitor_cache("user_cache", "get_user")
        def get_user(user_id: int):
            # Try to get from cache
            cached = cache.get(f"user:{user_id}")
            if cached:
                return cached

            # Fetch from database
            user = db.query(User).get(user_id)
            cache.set(f"user:{user_id}", user)
            return user
    """

    def decorator(func: Callable) -> Callable:
        monitor = CacheMonitor(cache_name)

        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            with monitor.operation_context(operation):
                return func(*args, **kwargs)

        return wrapper

    return decorator


# In-memory cache stats (for development/testing)
_cache_stats = {}


def get_cache_stats(cache_name: str | None = None) -> dict:
    """
    Get cache performance statistics.

    Args:
        cache_name: Specific cache to get stats for (None for all)

    Returns:
        dict: Cache statistics
    """
    if cache_name:
        return _cache_stats.get(cache_name, {})
    return _cache_stats


def log_cache_performance():
    """Log cache performance statistics"""
    for cache_name, stats in _cache_stats.items():
        logger.info(
            "Cache performance report", extra={"cache_name": cache_name, **stats}
        )
