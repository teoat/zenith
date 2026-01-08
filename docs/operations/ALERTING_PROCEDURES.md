# 🚨 Alerting Procedures

**Version:** 1.0.0  |  **Updated:** 2026-01-08

---

## Alert Severity Levels

| Level | Response Time | Notification | Examples |
|-------|---------------|--------------|----------|
| Critical | Immediate | PagerDuty + Slack | System down |
| High | 15 min | Slack + Email | Service degraded |
| Medium | 1 hour | Slack | Elevated errors |
| Low | 24 hours | Email | Performance warning |

---

## Alert Rules

### Critical Alerts

```yaml
- alert: ServiceDown
  expr: up == 0
  for: 1m
  severity: critical
  
- alert: HighErrorRate
  expr: error_rate > 0.05
  for: 5m
  severity: critical
  
- alert: DatabaseConnectionsFailed
  expr: db_connections == 0
  for: 1m
  severity: critical
```

### High Alerts

```yaml
- alert: HighLatency
  expr: http_request_duration_seconds{quantile="0.95"} > 0.5
  for: 5m
  severity: high
  
- alert: MemoryHigh
  expr: container_memory_usage_bytes / container_memory_limit_bytes > 0.85
  for: 10m
  severity: high
```

### Medium Alerts

```yaml
- alert: CacheHitRateLow
  expr: cache_hit_ratio < 0.7
  for: 15m
  severity: medium
  
- alert: QueueBacklog
  expr: queue_depth > 1000
  for: 10m
  severity: medium
```

---

## Response Procedures

### On Alert Trigger

1. Acknowledge alert in PagerDuty
2. Join #incidents Slack channel
3. Assess impact and severity
4. Begin investigation

### Investigation Steps

```bash
# Check service health
curl http://service/health

# Check logs
railway logs --service <service> --since 10m

# Check metrics
railway metrics --service <service>
```

### Resolution

1. Fix issue or rollback
2. Verify resolution
3. Update incident channel
4. Document in post-mortem

---

## Escalation Path

```
L1: On-call Engineer (15 min)
    ↓
L2: Secondary On-call (30 min)
    ↓
L3: Engineering Manager (1 hour)
    ↓
L4: VP Engineering (Critical only)
```

---

## Silencing Alerts

```bash
# Silence for maintenance
amtool silence add alertname="ServiceDown" service="api-gateway" --duration=2h --comment="Maintenance window"

# List active silences
amtool silence query

# Remove silence
amtool silence expire <silence-id>
```

---

**Contact:** <on-call@zenith.dev>
