"""
Backend Metrics Endpoint
Exposes Prometheus-compatible metrics for monitoring
"""

import time
from datetime import datetime

import psutil
from fastapi import APIRouter, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

router = APIRouter()

# HTTP Metrics
http_requests_total = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

# Business Metrics
fraud_cases_detected_total = Counter(
    "fraud_cases_detected_total", "Total fraud cases detected", ["severity"]
)

ai_prediction_confidence = Histogram(
    "ai_prediction_confidence", "AI prediction confidence scores"
)

pending_cases_total = Gauge("pending_cases_total", "Number of pending cases")

approval_queue_size = Gauge("approval_queue_size", "Number of items in approval queue")

# System Metrics
db_query_duration_seconds = Histogram(
    "db_query_duration_seconds", "Database query duration in seconds", ["query_type"]
)

cache_requests_total = Counter(
    "cache_requests_total", "Total cache requests", ["result"]  # hit or miss
)

websocket_connections = Gauge(
    "websocket_connections", "Number of active WebSocket connections"
)

# Application startup time
app_start_time = Gauge(
    "app_start_time_seconds", "Application start time in seconds since epoch"
)
app_start_time.set(time.time())


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint
    Returns metrics in Prometheus text format
    """
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@router.get("/health/detailed")
async def detailed_health():
    """
    Detailed health check with system metrics
    """
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2),
        },
        "application": {
            "uptime_seconds": int(time.time() - app_start_time._value._value)
        },
    }


# Helper function to record HTTP metrics
def record_request_metrics(
    method: str, endpoint: str, status_code: int, duration: float
):
    """Record metrics for an HTTP request"""
    http_requests_total.labels(
        method=method, endpoint=endpoint, status=status_code
    ).inc()
    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(
        duration
    )


# Helper function to record fraud detection
def record_fraud_detection(severity: str = "medium"):
    """Record a fraud case detection"""
    fraud_cases_detected_total.labels(severity=severity).inc()


# Helper function to record AI prediction
def record_ai_prediction(confidence: float):
    """Record AI prediction confidence"""
    ai_prediction_confidence.observe(confidence)


# Helper function to update pending cases
def update_pending_cases(count: int):
    """Update pending cases gauge"""
    pending_cases_total.set(count)


# Helper function to update approval queue
def update_approval_queue(count: int):
    """Update approval queue size"""
    approval_queue_size.set(count)


# Helper function to record DB query
def record_db_query(query_type: str, duration: float):
    """Record database query metrics"""
    db_query_duration_seconds.labels(query_type=query_type).observe(duration)


# Helper function to record cache access
def record_cache_access(hit: bool):
    """Record cache hit or miss"""
    result = "hit" if hit else "miss"
    cache_requests_total.labels(result=result).inc()


# Helper function to update WebSocket connections
def update_websocket_connections(count: int):
    """Update active WebSocket connections count"""
    websocket_connections.set(count)
