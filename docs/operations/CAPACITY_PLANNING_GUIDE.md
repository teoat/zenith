# 📈 Capacity Planning Guide

**Version:** 1.0.0  |  **Updated:** 2026-01-08

---

## Current Capacity

### Container Resources

| Service | Memory | CPU | GPU |
|---------|--------|-----|-----|
| API Gateway | 512MB | 0.5 | - |
| AI/ML Service | 2GB | 1.0 | 1 |
| Fraud+Intel | 1GB | 0.5 | - |
| Workflow+Reg | 512MB | 0.5 | - |
| **Total** | **4GB** | **2.5** | **1** |

### Database Resources

- PostgreSQL: 4GB RAM, 100GB storage
- Redis: 1GB RAM
- PGBouncer: 50 connection limit

---

## Scaling Thresholds

| Metric | Scale Up | Scale Down |
|--------|----------|------------|
| CPU Usage | > 70% for 5min | < 30% for 15min |
| Memory Usage | > 80% | < 40% |
| Request Latency | P95 > 300ms | P95 < 100ms |
| Queue Depth | > 1000 | < 100 |
| DB Connections | > 40 | < 10 |

---

## Scaling Procedures

### Horizontal Scaling

```bash
# Scale up replicas
railway scale --service api-gateway --replicas 3

# Scale down
railway scale --service api-gateway --replicas 1
```

### Vertical Scaling

```yaml
# Update railway.json
{
  "build": {},
  "deploy": {
    "memory": "1GB",
    "cpu": "1.0"
  }
}
```

### Database Scaling

```bash
# Increase PGBouncer pool
# Update config: max_client_conn = 300

# Increase PostgreSQL connections
# Update config: max_connections = 100
```

---

## Growth Projections

### Traffic Growth

| Period | Requests/sec | Memory | DB Connections |
|--------|--------------|--------|----------------|
| Current | 100 | 4GB | 25 |
| +3 months | 200 | 6GB | 35 |
| +6 months | 400 | 8GB | 50 |
| +12 months | 800 | 12GB | 75 |

### Cost Projections

| Period | Railway | Vercel | Total |
|--------|---------|--------|-------|
| Current | $150 | $60 | $210 |
| +6 months | $250 | $80 | $330 |
| +12 months | $400 | $100 | $500 |

---

## Monitoring for Capacity

### Key Dashboards

- Container resource usage
- Database connection pool
- Request rate trends
- Queue depth over time

### Capacity Alerts

```yaml
- alert: CapacityWarning
  expr: container_memory_usage_bytes / container_memory_limit_bytes > 0.75
  for: 30m
  
- alert: DBPoolNearLimit
  expr: pg_pool_active / pg_pool_max > 0.8
  for: 10m
```

---

## Planning Checklist

- [ ] Review capacity monthly
- [ ] Project 3-month growth
- [ ] Plan scaling before 70% utilization
- [ ] Budget for capacity increases
- [ ] Test scaling procedures quarterly

---

**Contact:** <platform-eng@zenith.dev>
