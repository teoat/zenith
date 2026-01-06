import time

from fastapi import Response
from prometheus_client import (
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

# Use a dedicated CollectorRegistry for this module to avoid duplicate
# registration across test runs and import shims. Tests that require the
# global registry can still import prometheus_client.REGISTRY directly.
registry = CollectorRegistry()

# Metrics (registered into the dedicated `registry`)
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
    registry=registry,
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    registry=registry,
)

fraud_detections_total = Counter(
    "fraud_detections_total",
    "Total fraud detections",
    ["detection_type"],
    registry=registry,
)

active_cases = Gauge(
    "active_cases_total", "Number of active fraud cases", registry=registry
)

db_connection_pool_size = Gauge(
    "db_connection_pool_size", "Database connection pool size", registry=registry
)


class PrometheusMiddleware:
    def __init__(self, app=None):
        # Accept optional app for tests that instantiate without arguments
        self.app = app

    async def dispatch(self, request, call_next):
        """Compatibility dispatch method used by unit tests that call
        middleware.dispatch(mock_request, call_next)."""
        method = getattr(request, "method", "GET")
        path = (
            getattr(getattr(request, "url", None), "path", "/")
            if hasattr(request, "url")
            else getattr(request, "path", "/")
        )

        start_time = time.time()
        try:
            response = await call_next(request)
            status_code = getattr(response, "status_code", 200)
        except Exception:
            status_code = 500
            raise
        finally:
            duration = time.time() - start_time
            try:
                http_requests_total.labels(
                    method=method, endpoint=path, status=str(status_code)
                ).inc()
                http_request_duration_seconds.labels(
                    method=method, endpoint=path
                ).observe(duration)
            except Exception:
                # Metric recording should not break tests
                pass

        return response

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        method = scope["method"]
        path = scope["path"]

        start_time = time.time()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code = message["status"]
                duration = time.time() - start_time

                # Record metrics
                http_requests_total.labels(
                    method=method, endpoint=path, status=status_code
                ).inc()

                http_request_duration_seconds.labels(
                    method=method, endpoint=path
                ).observe(duration)

            await send(message)

        await self.app(scope, receive, send_wrapper)


def get_metrics():
    """Returns Prometheus metrics in text format"""
    return Response(content=generate_latest(registry), media_type="text/plain")
