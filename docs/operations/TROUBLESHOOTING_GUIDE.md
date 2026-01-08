# 🔧 Troubleshooting Guide

**Version:** 1.0.0  |  **Updated:** 2026-01-08  |  **Status:** Production Ready

---

## Quick Diagnostics

```bash
# Check all services health
for svc in api-gateway ai-ml-service fraud-intel-service workflow-regulatory; do
    echo "$svc: $(curl -s http://$svc.railway.internal:8000/health | jq -r '.status')"
done

# Check logs for errors
railway logs --service <service> --tail 100 | grep -i error

# Check resource usage
railway metrics --service <service>
```

---

## Common Issues

### 1. Service Not Responding (502/504)

**Symptoms:** Health check fails, connection timeout

**Quick Fix:**

```bash
railway restart --service <service>
```

**Investigation:**

```bash
railway logs --service <service> --since 10m
railway metrics --service <service>
```

**Root Causes:**

- Memory exhaustion → Scale up memory
- Deadlock → Check logs, restart service
- Network issue → Check connectivity

---

### 2. Database Connection Errors

**Symptoms:** "Connection refused" or "too many connections"

**Check:**

```bash
psql -h pgbouncer.railway.internal -c "SHOW POOLS"
```

**Fix:**

- Reset stuck connections: `KILL <pid>`
- Increase pool size in PGBouncer config
- Check for connection leaks

---

### 3. Redis Cache Issues

**Symptoms:** Cache misses, high latency

**Check:**

```bash
redis-cli INFO stats | grep -E 'hits|misses'
redis-cli INFO memory | grep used_memory
```

**Fix:**

- Increase Redis memory
- Adjust cache TTLs
- Check key expiration policies

---

### 4. GPU Not Available (AI/ML)

**Symptoms:** CUDA not available, slow inference

**Check:**

```python
import torch
print(torch.cuda.is_available())
print(torch.cuda.device_count())
```

**Fix:**

- Verify GPU add-on enabled
- Restart container
- Fall back to CPU

---

### 5. Circuit Breaker Open

**Symptoms:** Requests failing immediately, fallback responses

**Check:**

```bash
curl http://api-gateway.railway.internal:8000/circuit-breakers/status
```

**Fix:**

```bash
# Wait for recovery (default: 30s)
# Or manually reset
curl -X POST http://api-gateway.railway.internal:8000/circuit-breakers/reset
```

---

### 6. High Latency (>300ms P95)

**Check:**

```bash
curl http://service/metrics | grep http_request_duration
```

**Fix:**

- Enable response caching
- Optimize slow queries
- Check inter-service calls
- Review N+1 queries

---

### 7. Memory Leak

**Symptoms:** Memory usage grows continuously

**Check:**

```bash
railway metrics --service <service> --format json | jq '.memory'
```

**Fix:**

- Enable memory profiling
- Check for unclosed connections
- Review large object allocations
- Restart service (temporary)

---

## Emergency Procedures

### Full System Restart

```bash
railway restart --all
```

### Single Service Restart

```bash
railway restart --service <service>
```

### Rollback Deployment

```bash
railway deployments --service <service> --limit 5
railway rollback --service <service> --deployment <id>
```

### Scale Down Problematic Service

```bash
railway scale --service <service> --replicas 0
```

---

## Contact & Escalation

| Level | Contact | Response Time |
|-------|---------|---------------|
| L1 | #platform-support | 15 min |
| L2 | Platform Team | 30 min |
| L3 | On-call Engineer | Immediate |

**Runbook:** See `PRODUCTION_RUNBOOK.md`

---

**Contact:** <platform-eng@zenith.dev>
