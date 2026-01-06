"""
Performance Monitoring and Metrics Collection
Tracks API response times, database queries, fraud detection latency
"""

import functools
import logging
import time
from collections.abc import Callable
from typing import Any

from fastapi import Request, Response
from prometheus_client import Counter, Gauge, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Prometheus Metrics
http_requests_total = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds", "HTTP request latency", ["method", "endpoint"]
)

fraud_detections_total = Counter(
    "fraud_detections_total", "Total fraud detections", ["risk_level"]
)

ai_predictions_total = Counter(
    "ai_predictions_total", "Total AI predictions made", ["model_type"]
)

pending_cases = Gauge("pending_cases", "Number of pending fraud cases")

database_query_duration = Histogram(
    "database_query_duration_seconds", "Database query execution time", ["query_type"]
)

cache_hits_total = Counter("cache_hits_total", "Total cache hits", ["cache_type"])

cache_misses_total = Counter("cache_misses_total", "Total cache misses", ["cache_type"])

websocket_connections = Gauge("websocket_connections", "Active WebSocket connections")


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor request performance"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timing
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Extract endpoint and method
        endpoint = request.url.path
        method = request.method
        status = response.status_code

        # Record metrics
        http_requests_total.labels(
            method=method, endpoint=endpoint, status=status
        ).inc()

        http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(
            duration
        )

        # Add performance headers
        response.headers["X-Response-Time"] = f"{duration:.4f}s"

        # Log slow requests
        if duration > 1.0:  # More than 1 second
            logger.warning(f"Slow request: {method} {endpoint} took {duration:.2f}s")

        return response


def track_performance(metric_name: str | None = None):
    """Decorator to track function performance"""

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                name = metric_name or func.__name__
                logger.debug(f"{name} took {duration:.4f}s")

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                name = metric_name or func.__name__
                logger.debug(f"{name} took {duration:.4f}s")

        # Return appropriate wrapper based on function type
        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def record_fraud_detection(risk_level: str):
    """Record fraud detection event"""
    fraud_detections_total.labels(risk_level=risk_level).inc()


def record_ai_prediction(model_type: str):
    """Record AI prediction event"""
    ai_predictions_total.labels(model_type=model_type).inc()


def update_pending_cases(count: int):
    """Update pending cases gauge"""
    pending_cases.set(count)


def record_db_query(query_type: str, duration: float):
    """Record database query performance"""
    database_query_duration.labels(query_type=query_type).observe(duration)


def record_cache_hit(cache_type: str = "default"):
    """Record cache hit"""
    cache_hits_total.labels(cache_type=cache_type).inc()


def record_cache_miss(cache_type: str = "default"):
    """Record cache miss"""
    cache_misses_total.labels(cache_type=cache_type).inc()


def increment_ws_connections():
    """Increment WebSocket connection count"""
    websocket_connections.inc()


def decrement_ws_connections():
    """Decrement WebSocket connection count"""
    websocket_connections.dec()


class PerformanceTracker:
    """Context manager for tracking operation performance"""

    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        logger.info(f"Performance: {self.operation_name} completed in {duration:.4f}s")

        # Record to Prometheus if it's a known metric
        if "fraud_detection" in self.operation_name.lower():
            # Record fraud detection timing
            pass
        elif "database" in self.operation_name.lower():
            record_db_query("general", duration)


# Helper function to get metrics
def get_metrics():
    """Get all Prometheus metrics"""
    return generate_latest()


# Example usage in endpoints:
"""
@app.get("/api/fraud/analyze")
@track_performance("fraud_analysis")
async def analyze_transaction(transaction: Transaction):
    with PerformanceTracker("fraud_detection_complete"):
        result = await fraud_service.analyze(transaction)
        record_fraud_detection(result.risk_level)
        return result
"""
