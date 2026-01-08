# 📊 Monitoring & Observability Guide

**Version:** 1.0.0  |  **Updated:** 2026-01-08  |  **Status:** Production Ready

---

## Overview

### Three Pillars of Observability

1. **Metrics** - Prometheus + Grafana
2. **Logs** - Structured JSON logging
3. **Traces** - OpenTelemetry distributed tracing

---

## Metrics Collection

### Key Metrics

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| `http_requests_total` | Counter | - |
| `http_request_duration_seconds` | Histogram | P95 > 300ms |
| `http_requests_in_flight` | Gauge | > 100 |
| `db_pool_connections` | Gauge | > 45 |
| `cache_hit_ratio` | Gauge | < 0.8 |
| `error_rate` | Gauge | > 0.001 |

### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8000']
    metrics_path: /metrics
    
  - job_name: 'ai-ml-service'
    static_configs:
      - targets: ['ai-ml-service:8001']
```

### Custom Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

REQUEST_COUNT = Counter('http_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'Request latency', ['endpoint'])
ACTIVE_REQUESTS = Gauge('http_requests_in_flight', 'Active requests')
```

---

## Logging

### Log Format

```json
{
  "timestamp": "2026-01-08T04:08:38.000Z",
  "level": "INFO",
  "service": "api-gateway",
  "trace_id": "abc123",
  "message": "Request processed",
  "duration_ms": 45,
  "status_code": 200
}
```

### Log Queries

```bash
# Errors in last hour
railway logs --since 1h | jq 'select(.level == "ERROR")'

# Slow requests
railway logs | jq 'select(.duration_ms > 300)'

# By trace ID
railway logs | jq 'select(.trace_id == "abc123")'
```

---

## Distributed Tracing

### Trace Headers

```
X-Trace-ID: uuid-v4
X-Span-ID: uuid-v4
X-Parent-Span-ID: uuid-v4
```

### OpenTelemetry Setup

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("operation") as span:
    span.set_attribute("key", "value")
```

---

## Dashboards

### System Overview Dashboard

- Request rate by service
- Error rate trend
- Latency percentiles (P50, P95, P99)
- Active connections

### Service Health Dashboard

- Container CPU/Memory
- Health check status
- Circuit breaker states
- Queue depths

### Business Metrics Dashboard

- Cases processed per hour
- AI inference latency
- Fraud detection rate
- Compliance report status

---

## Health Checks

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Overall health |
| `/ready` | Ready for traffic |
| `/live` | Container alive |
| `/metrics` | Prometheus metrics |

### Health Check Response

```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "redis": true,
    "dependencies": true
  },
  "version": "1.2.3",
  "uptime_seconds": 3600
}
```

---

## Quick Commands

```bash
# Check service health
curl http://service/health | jq

# View Prometheus metrics
curl http://service/metrics

# Tail logs
railway logs --service api-gateway --follow

# Check resource usage
railway metrics --service api-gateway
```

---

**Contact:** <platform-eng@zenith.dev>
