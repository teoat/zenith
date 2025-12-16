#!/usr/bin/env python3
"""
Minimal test server for E2E testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Simple378 Test API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Basic health check"""
    return {"status": "healthy", "service": "fraud-detection-backend", "version": "1.0.0"}

@app.get("/api/v1/collaboration/stats")
def collaboration_stats():
    """Mock collaboration stats"""
    return {
        "active_sessions": 0,
        "total_connections": 0,
        "total_participants": 0,
        "server_running": False
    }

@app.get("/api/v1/monitoring/metrics")
def monitoring_metrics():
    """Mock monitoring metrics"""
    return {
        "timestamp": "2025-12-09T04:54:00.000000Z",
        "cpu_usage": 25.5,
        "memory_usage": 45.2,
        "disk_usage": 30.1,
        "network_io": 15.3,
        "active_connections": 5,
        "response_time": 120.5,
        "error_rate": 0.1,
        "throughput": 150.2
    }

@app.get("/metrics")
def prometheus_metrics():
    """Mock Prometheus metrics"""
    return "# Mock metrics\nhttp_requests_total 100\n"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)