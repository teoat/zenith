# 🔧 Service Debugging Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-08
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Debugging Architecture](#debugging-architecture)
3. [Container-Specific Debugging](#container-specific-debugging)
4. [Distributed Tracing](#distributed-tracing)
5. [Log Analysis](#log-analysis)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Tools & Utilities](#tools--utilities)
8. [Best Practices](#best-practices)

---

## Overview

This guide provides comprehensive debugging procedures for the 4-container Railway architecture and Vercel Edge Gateway integration.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Gateway                       │
│                    (Global Edge Network)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                 Railway Infrastructure                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│  │ API Gateway │ │ AI/ML Svc   │ │ Fraud+Intel │ │Workflow ││
│  │  (512MB)    │ │ (2GB+GPU)   │ │  (1GB)      │ │(512MB)  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
│                         │                                    │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │  PostgreSQL + PGBouncer + Redis (Shared Services)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Debugging Architecture

### Service Discovery

Each container registers with Railway's service discovery:

```python
# Service endpoints (from service discovery)
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway.railway.internal:8000")
AI_ML_SERVICE_URL = os.getenv("AI_ML_SERVICE_URL", "http://ai-ml-service.railway.internal:8001")
FRAUD_INTEL_URL = os.getenv("FRAUD_INTEL_URL", "http://fraud-intel-service.railway.internal:8002")
WORKFLOW_URL = os.getenv("WORKFLOW_URL", "http://workflow-regulatory.railway.internal:8003")
```

### Health Check Endpoints

Every service exposes standard health endpoints:

| Service | Health Endpoint | Metrics Endpoint | Ready Endpoint |
|---------|-----------------|------------------|----------------|
| API Gateway | `/health` | `/metrics` | `/ready` |
| AI/ML | `/health` | `/metrics` | `/ready` |
| Fraud+Intel | `/health` | `/metrics` | `/ready` |
| Workflow | `/health` | `/metrics` | `/ready` |

---

## Container-Specific Debugging

### 1. API Gateway Container (512MB)

**Check container logs:**

```bash
# Railway CLI
railway logs --service api-gateway --follow

# Or via Railway dashboard
```

**Common debugging commands:**

```bash
# Check service status
curl http://api-gateway.railway.internal:8000/health

# Check route configuration
curl http://api-gateway.railway.internal:8000/routes

# Check middleware status
curl http://api-gateway.railway.internal:8000/middleware/status
```

**Debug environment variables:**

```python
import os
debug_vars = {
    "DATABASE_URL": os.getenv("DATABASE_URL", "NOT SET"),
    "REDIS_URL": os.getenv("REDIS_URL", "NOT SET"),
    "JWT_SECRET": "***" if os.getenv("JWT_SECRET") else "NOT SET",
    "LOG_LEVEL": os.getenv("LOG_LEVEL", "INFO")
}
```

### 2. AI/ML Service Container (2GB + GPU)

**GPU Status Check:**

```python
import torch

def check_gpu_status():
    return {
        "cuda_available": torch.cuda.is_available(),
        "cuda_version": torch.version.cuda if torch.cuda.is_available() else None,
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "current_device": torch.cuda.current_device() if torch.cuda.is_available() else None,
        "device_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "memory_allocated": torch.cuda.memory_allocated() if torch.cuda.is_available() else 0,
        "memory_cached": torch.cuda.memory_reserved() if torch.cuda.is_available() else 0
    }
```

**Model Loading Debug:**

```python
# Check model registry
curl http://ai-ml-service.railway.internal:8001/models

# Check inference status
curl http://ai-ml-service.railway.internal:8001/inference/status

# Debug embedding service
curl -X POST http://ai-ml-service.railway.internal:8001/debug/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "test embedding"}'
```

### 3. Fraud + Intelligence Service Container (1GB)

**Graph Analytics Debug:**

```python
# Check graph status
curl http://fraud-intel-service.railway.internal:8002/graph/status

# Debug network analysis
curl http://fraud-intel-service.railway.internal:8002/debug/network

# Check pattern detection
curl http://fraud-intel-service.railway.internal:8002/patterns/status
```

**Transaction Processing Debug:**

```bash
# Check transaction queue
curl http://fraud-intel-service.railway.internal:8002/queue/status

# Debug fraud detection pipeline
curl http://fraud-intel-service.railway.internal:8002/debug/pipeline
```

### 4. Workflow + Regulatory Service Container (512MB)

**Workflow Engine Debug:**

```bash
# Check workflow status
curl http://workflow-regulatory.railway.internal:8003/workflows/status

# Debug case management
curl http://workflow-regulatory.railway.internal:8003/cases/debug

# Check compliance status
curl http://workflow-regulatory.railway.internal:8003/compliance/status
```

---

## Distributed Tracing

### Trace ID Propagation

All services propagate trace IDs through headers:

```python
# Header format
X-Trace-ID: uuid-v4-trace-id
X-Span-ID: uuid-v4-span-id
X-Parent-Span-ID: uuid-v4-parent-span-id
```

### Tracing Query Examples

```bash
# Find all spans for a trace
curl "http://api-gateway.railway.internal:8000/traces/{trace_id}"

# Get trace timeline
curl "http://api-gateway.railway.internal:8000/traces/{trace_id}/timeline"

# Export trace for analysis
curl "http://api-gateway.railway.internal:8000/traces/{trace_id}/export" > trace.json
```

### OpenTelemetry Configuration

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Configure tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Add OTLP exporter
otlp_exporter = OTLPSpanExporter(
    endpoint=os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(otlp_exporter)
)
```

---

## Log Analysis

### Log Format

All services use structured JSON logging:

```json
{
  "timestamp": "2026-01-08T04:08:38.000Z",
  "level": "INFO",
  "service": "api-gateway",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "Request processed",
  "duration_ms": 45,
  "status_code": 200,
  "method": "GET",
  "path": "/api/cases"
}
```

### Log Aggregation Queries

```bash
# Find errors in last hour
railway logs --service api-gateway --since 1h | jq 'select(.level == "ERROR")'

# Find slow requests (>300ms)
railway logs --service api-gateway | jq 'select(.duration_ms > 300)'

# Find requests by trace ID
railway logs --service api-gateway | jq 'select(.trace_id == "abc123")'
```

### Log Levels

| Level | Use Case |
|-------|----------|
| DEBUG | Detailed debugging information |
| INFO | General operational events |
| WARN | Non-critical issues |
| ERROR | Errors requiring attention |
| CRITICAL | System-critical failures |

---

## Common Issues & Solutions

### Issue 1: Service Not Responding

**Symptoms:**

- Health check fails
- Connection timeout
- 502 Bad Gateway errors

**Debug Steps:**

```bash
# 1. Check service is running
railway status --service api-gateway

# 2. Check container health
curl http://api-gateway.railway.internal:8000/health

# 3. Check resource usage
railway metrics --service api-gateway

# 4. Check logs for errors
railway logs --service api-gateway --tail 100 | grep -i error
```

**Solutions:**

1. Restart service if unhealthy
2. Scale up resources if OOM
3. Check network connectivity
4. Verify environment variables

### Issue 2: Database Connection Errors

**Symptoms:**

- `connection refused` errors
- `too many connections` errors
- Slow queries

**Debug Steps:**

```bash
# 1. Check PGBouncer status
curl http://pgbouncer.railway.internal:6432/stats

# 2. Check active connections
psql -h pgbouncer.railway.internal -p 6432 -c "SHOW POOLS"

# 3. Check query performance
psql -h postgres.railway.internal -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"
```

**Solutions:**

1. Increase pool size if exhausted
2. Optimize slow queries
3. Add query caching
4. Check for connection leaks

### Issue 3: Redis Cache Issues

**Symptoms:**

- Cache misses
- High latency
- Memory warnings

**Debug Steps:**

```bash
# 1. Check Redis status
redis-cli -h redis.railway.internal ping

# 2. Check memory usage
redis-cli -h redis.railway.internal info memory

# 3. Check cache hit rate
redis-cli -h redis.railway.internal info stats | grep hit

# 4. Monitor real-time commands
redis-cli -h redis.railway.internal monitor
```

**Solutions:**

1. Increase Redis memory
2. Adjust cache TTLs
3. Implement cache warming
4. Check key expiration policies

### Issue 4: GPU Not Available (AI/ML Service)

**Symptoms:**

- `CUDA not available` errors
- Slow inference times
- Model loading failures

**Debug Steps:**

```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA devices: {torch.cuda.device_count()}")
if torch.cuda.is_available():
    print(f"Current device: {torch.cuda.current_device()}")
    print(f"Device name: {torch.cuda.get_device_name(0)}")
```

**Solutions:**

1. Verify GPU add-on is enabled
2. Check CUDA driver compatibility
3. Restart container to reinitialize GPU
4. Fall back to CPU if GPU unavailable

### Issue 5: Inter-Service Communication Failures

**Symptoms:**

- Circuit breaker open
- Retry exhaustion
- Timeout errors

**Debug Steps:**

```bash
# 1. Check circuit breaker status
curl http://api-gateway.railway.internal:8000/circuit-breakers/status

# 2. Test inter-service connectivity
curl http://api-gateway.railway.internal:8000/test-connectivity

# 3. Check service discovery
curl http://api-gateway.railway.internal:8000/services
```

**Solutions:**

1. Reset circuit breaker manually
2. Increase timeout values
3. Check service health
4. Verify network policies

---

## Tools & Utilities

### CLI Tools

```bash
# Railway CLI
railway login
railway logs --service <service-name>
railway status
railway metrics

# Docker debugging (local)
docker logs <container-id> --follow
docker exec -it <container-id> /bin/sh
docker stats

# Curl for API testing
curl -v http://localhost:8000/health
curl -X POST -H "Content-Type: application/json" -d '{}' http://localhost:8000/api
```

### Debug Endpoints

Each service exposes debug endpoints in non-production environments:

| Endpoint | Description |
|----------|-------------|
| `/debug/config` | Current configuration |
| `/debug/routes` | Active routes |
| `/debug/connections` | Database connections |
| `/debug/cache` | Cache statistics |
| `/debug/memory` | Memory usage |
| `/debug/threads` | Active threads |

### Monitoring Dashboards

- **Railway Dashboard:** Container metrics, logs, deployments
- **Grafana:** Custom metrics visualization
- **Prometheus:** Metrics collection and alerting

---

## Best Practices

### 1. Logging Best Practices

```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, service_name: str):
        self.service = service_name
        self.logger = logging.getLogger(service_name)
    
    def log(self, level: str, message: str, **kwargs):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "service": self.service,
            "message": message,
            **kwargs
        }
        print(json.dumps(log_entry))
```

### 2. Error Handling Best Practices

```python
from functools import wraps
import traceback

def with_error_logging(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(
                "Function failed",
                function=func.__name__,
                error=str(e),
                traceback=traceback.format_exc()
            )
            raise
    return wrapper
```

### 3. Health Check Best Practices

```python
from fastapi import FastAPI, Response

app = FastAPI()

@app.get("/health")
async def health_check():
    checks = {
        "database": await check_database(),
        "redis": await check_redis(),
        "gpu": check_gpu() if IS_AI_SERVICE else None
    }
    
    all_healthy = all(v for v in checks.values() if v is not None)
    status_code = 200 if all_healthy else 503
    
    return Response(
        content=json.dumps({"status": "healthy" if all_healthy else "unhealthy", "checks": checks}),
        status_code=status_code,
        media_type="application/json"
    )
```

### 4. Circuit Breaker Monitoring

```python
# Monitor circuit breaker state changes
@circuit_breaker.on_state_change
def on_state_change(old_state, new_state):
    logger.warning(
        "Circuit breaker state changed",
        old_state=old_state,
        new_state=new_state,
        service="target-service"
    )
    
    if new_state == "open":
        send_alert("Circuit breaker opened for target-service")
```

---

## Quick Reference

### Emergency Commands

```bash
# Restart all services
railway restart --all

# Scale down problematic service
railway scale --service api-gateway --replicas 0

# Force redeploy
railway deploy --service api-gateway --force

# Get current resource usage
railway metrics --service api-gateway --format json
```

### Debug Checklist

- [ ] Check service health endpoints
- [ ] Review recent logs for errors
- [ ] Verify environment variables
- [ ] Check database connectivity
- [ ] Verify Redis connection
- [ ] Check circuit breaker states
- [ ] Review resource usage (CPU, Memory)
- [ ] Verify network connectivity between services
- [ ] Check for recent deployments
- [ ] Review configuration changes

---

**Document Maintained By:** Platform Engineering Team
**Contact:** <platform-eng@zenith.dev>
