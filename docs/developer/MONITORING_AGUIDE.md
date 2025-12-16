# Monitoring & Observability Implementation Guide

## 🎯 Observability Strategy

Implement comprehensive monitoring, logging, and tracing to achieve **full system observability**. Enable proactive issue detection, rapid troubleshooting, and data-driven optimization.

---

## 📊 Three Pillars of Observability

### 1. Metrics (What's Happening)
**Purpose**: Quantitative measurements of system behavior over time

**Tools**: Prometheus + Grafana

### 2. Logs (Event Context)
**Purpose**: Detailed event records with context

**Tools**: Structured JSON logging + Elasticsearch/Loki

### 3. Traces (Request Flow)
**Purpose**: Request lifecycle tracking across services

**Tools**: OpenTelemetry + Jaeger

---

## 📈 Metrics Implementation

### Prometheus Setup

#### Installation (Docker Compose)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_password
      - GF_USERS_ALLOW_SIGN_UP=false

volumes:
  prometheus-data:
  grafana-data:
```

#### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: '378x492-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/alerts/*.yml'
```

### Backend Metrics Instrumentation

```python
# backend/app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge, Info
import time

# Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# Business metrics
cases_created_total = Counter(
    'cases_created_total',
    'Total cases created',
    ['priority', 'status']
)

fraud_analysis_duration_seconds = Histogram(
    'fraud_analysis_duration_seconds',
    'Fraud analysis processing time',
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0]
)

evidence_processed_total = Counter(
    'evidence_processed_total',
    'Total evidence processed',
    ['type', 'status']  # pdf, image, video; success, failed
)

# System metrics
active_users = Gauge(
    'active_users',
    'Number of currently active users'
)

database_connections = Gauge(
    'database_connections',
    'Number of active database connections'
)

cache_hit_ratio = Gauge(
    'cache_hit_ratio',
    'Redis cache hit ratio'
)

# Application info
app_info = Info('app_info', 'Application information')
app_info.info({
    'version': '1.0.0',
    'environment': 'production',
    'build_date': '2024-01-01'
})
```

### Metrics Middleware

```python
# backend/app/core/metrics.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

class PrometheusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        method = request.method
        path = request.url.path
        
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Record metrics
        duration = time.time() - start_time
        status = response.status_code
        
        http_requests_total.labels(
            method=method,
            endpoint=path,
            status=status
        ).inc()
        
        http_request_duration_seconds.labels(
            method=method,
            endpoint=path
        ).observe(duration)
        
        return response
```

### Business Metrics Integration

```python
# backend/app/services/case_service.py
from app.core.metrics import cases_created_total, fraud_analysis_duration_seconds

class CaseService:
    async def create_case(self, case_data: dict) -> Case:
        # Create case
        case = await self.repository.create(case_data)
        
        # Record metric
        cases_created_total.labels(
            priority=case.priority,
            status=case.status
        ).inc()
        
        return case
    
    async def analyze_fraud(self, case_id: str):
        start_time = time.time()
        
        try:
            # Run fraud analysis
            result = await self.fraud_engine.analyze(case_id)
            return result
        finally:
            # Record duration regardless of success/failure
            duration = time.time() - start_time
            fraud_analysis_duration_seconds.observe(duration)
```

### Key Metrics to Track

#### System Health Metrics
- CPU usage, memory usage, disk I/O
- Network throughput
- Process restarts, crashes
- Uptime percentage

#### Application Metrics
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx responses)
- Active connections

#### Business Metrics
- Cases created/updated/closed per hour
- Fraud detections per day
- Evidence uploads per hour
- User activity (logins, sessions)
- Average case resolution time

#### Database Metrics
- Query execution time
- Connection pool utilization
- Slow queries (> 1 second)
- Lock wait time
- Table sizes

#### Cache Metrics
- Hit/miss ratio
- Eviction rate
- Memory usage
- Average key TTL

---

## 📝 Logging Implementation

### Structured Logging Setup

```python
# backend/app/core/logging.py
import logging
import json
from datetime import datetime
from contextvars import ContextVar

# Request context for correlation IDs
request_id_var: ContextVar[str] = ContextVar('request_id', default=None)
user_id_var: ContextVar[str] = ContextVar('user_id', default=None)

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'request_id': request_id_var.get(),
            'user_id': user_id_var.get(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra'):
            log_data.update(record.extra)
        
        return json.dumps(log_data)

# Configure root logger
def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    
    return logger

logger = setup_logging()
```

### Request Logging Middleware

```python
# backend/app/middleware/logging.py
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger, request_id_var, user_id_var

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)
        
        # Extract user ID from JWT if available
        user_id = None
        if hasattr(request.state, 'user'):
            user_id = request.state.user.id
            user_id_var.set(user_id)
        
        # Log request
        logger.info(f"Request started", extra={
            'method': request.method,
            'path': request.url.path,
            'client_ip': request.client.host,
            'user_agent': request.headers.get('user-agent')
        })
        
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Log response
        logger.info(f"Request completed", extra={
            'method': request.method,
            'path': request.url.path,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2)
        })
        
        # Add request ID to response headers
        response.headers['X-Request-ID'] = request_id
        
        return response
```

### Application Logging

```python
# backend/app/services/fraud_detection.py
from app.core.logging import logger

class FraudDetectionService:
    async def analyze(self, case_id: str):
        logger.info(f"Starting fraud analysis", extra={
            'case_id': case_id,
            'analyzer': 'hybrid_engine'
        })
        
        try:
            result = await self._run_analysis(case_id)
            
            logger.info(f"Fraud analysis completed", extra={
                'case_id': case_id,
                'risk_score': result.risk_score,
                'flags_count': len(result.flags)
            })
            
            return result
        
        except Exception as e:
            logger.error(f"Fraud analysis failed", extra={
                'case_id': case_id,
                'error': str(e)
            }, exc_info=True)
            raise
```

### Log Levels Guidelines

- **DEBUG**: Detailed diagnostic information (disabled in production)
- **INFO**: General informational messages (successful operations)
- **WARNING**: Unexpected but handled situations (degraded performance, retries)
- **ERROR**: Error events (caught exceptions, failed operations)
- **CRITICAL**: Severe errors requiring immediate attention (system failures)

### Sensitive Data Sanitization

```python
# backend/app/core/logging.py
SENSITIVE_FIELDS = ['password', 'token', 'api_key', 'secret', 'ssn', 'credit_card']

def sanitize_log_data(data: dict) -> dict:
    """Remove sensitive information from log data"""
    sanitized = {}
    for key, value in data.items():
        if any(field in key.lower() for field in SENSITIVE_FIELDS):
            sanitized[key] = '***REDACTED***'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        else:
            sanitized[key] = value
    return sanitized
```

---

## 🔍 Distributed Tracing

### OpenTelemetry Setup

```python
# backend/app/core/tracing.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def setup_tracing():
    resource = Resource.create({
        "service.name": "378x492-backend",
        "service.version": "1.0.0",
        "deployment.environment": "production"
    })
    
    provider = TracerProvider(resource=resource)
    
    jaeger_exporter = JaegerExporter(
        agent_host_name="localhost",
        agent_port=6831,
    )
    
    provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))
    trace.set_tracer_provider(provider)
    
    return trace.get_tracer(__name__)

tracer = setup_tracing()
```

### Tracing Decorators

```python
# backend/app/core/tracing.py
from functools import wraps

def trace_function(span_name: str = None):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            name = span_name or f"{func.__module__}.{func.__name__}"
            with tracer.start_as_current_span(name) as span:
                # Add function parameters as attributes
                span.set_attribute("function.args", str(args))
                span.set_attribute("function.kwargs", str(kwargs))
                
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("function.result", "success")
                    return result
                except Exception as e:
                    span.set_attribute("function.result", "error")
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise
        return wrapper
    return decorator
```

### Service Tracing

```python
# backend/app/services/case_service.py
from app.core.tracing import tracer, trace_function

class CaseService:
    @trace_function("case_service.create_case")
    async def create_case(self, case_data: dict) -> Case:
        with tracer.start_as_current_span("validate_input"):
            # Input validation span
            validated_data = self.validator.validate(case_data)
        
        with tracer.start_as_current_span("db_insert"):
            # Database insertion span
            case = await self.repository.create(validated_data)
        
        with tracer.start_as_current_span("notify_users"):
            # Notification span
            await self.notification_service.notify_case_created(case)
        
        return case
```

---

## 📊 Grafana Dashboards

### System Overview Dashboard

```json
// monitoring/grafana/dashboards/system-overview.json
{
  "dashboard": {
    "title": "Simple378 - System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Response Time (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
        }]
      },
      {
        "title": "Active Database Connections",
        "targets": [{
          "expr": "database_connections"
        }]
      }
    ]
  }
}
```

### Business Metrics Dashboard

- Cases created/hour (trend line)
- Fraud detection rate (%)
- Average case resolution time
- Evidence processing throughput
- User activity (active users, sessions)

### Application Performance Dashboard

- API endpoint latency (heatmap)
- Slow queries (> 1s)
- Cache hit ratio
- Error breakdown by endpoint
- Request rate by endpoint

---

## 🚨 Alerting Rules

### Prometheus Alert Rules

```yaml
# monitoring/prometheus/alerts/application.yml
groups:
  - name: application_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "95th percentile response time is {{ $value }}s"
      
      - alert: HighDatabaseConnections
        expr: database_connections > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool near capacity"
          description: "{{ $value }} active connections"
      
      - alert: ServiceDown
        expr: up{job="378x492-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "Backend service is not responding"
```

### Alert Manager Configuration

```yaml
# monitoring/alertmanager/alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'team-email'
  
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true
    
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'team-email'
    email_configs:
      - to: 'team@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.example.com:587'
  
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/XXX'
        channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
  
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'
```

---

## 🎯 SLO/SLI Definitions

### Service Level Indicators (SLIs)

- **Availability**: % of time service responds to requests
- **Latency**: % of requests completed within threshold
- **Error Rate**: % of successful requests
- **Throughput**: Requests processed per second

### Service Level Objectives (SLOs)

| Metric | Target | Measurement Window |
|--------|--------|--------------------|
| Availability | 99.9% | 30 days |
| Latency (p95) | < 500ms | 7 days |
| Latency (p99) | < 2s | 7 days |
| Error Rate | < 0.1% | 24 hours |
| Fraud Analysis | < 30s (p95) | 7 days |

### Error Budget

- **Monthly Error Budget**: 43 minutes downtime (99.9% availability)
- **Budget Consumption Tracking**: Alert when 50% consumed
- **Budget Policy**: Freeze deployments if 80% consumed

---

## ✅ Implementation Checklist

### Phase 1: Metrics Foundation
- [x] Prometheus installed and configured
- [x] Grafana installed and configured
- [x] Backend metrics endpoint (/metrics)
- [x] PrometheusMiddleware implemented
- [ ] System dashboards created
- [ ] Alert rules configured

### Phase 2: Logging Infrastructure
- [ ] Structured JSON logging implemented
- [ ] Request correlation IDs
- [ ] Log aggregation (Elasticsearch/Loki)
- [ ] Log retention policy (30 days)
- [ ] Sensitive data sanitization

### Phase 3: Distributed Tracing
- [ ] OpenTelemetry SDK integrated
- [ ] Jaeger backend deployed
- [ ] Service instrumentation complete
- [ ] Trace sampling configured
- [ ] Trace UI accessible

### Phase 4: Alerting & On-Call
- [ ] AlertManager configured
- [ ] Critical alerts defined
- [ ] Notification channels (Email, Slack, PagerDuty)
- [ ] On-call rotation established
- [ ] Runbooks for common alerts

---

## 📚 References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [The Twelve-Factor App - Logs](https://12factor.net/logs)
