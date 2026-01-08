# ⚡ Performance Tuning Guide

**Version:** 1.0.0  |  **Updated:** 2026-01-08  |  **Status:** Production Ready

---

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| P95 Latency | < 300ms | `curl -w "%{time_total}" endpoint` |
| Cache Hit Rate | > 80% | Redis INFO stats |
| DB Pool Usage | 20-50 | PGBouncer SHOW POOLS |
| Memory Usage | <80% limit | Railway metrics |
| Error Rate | < 0.1% | Prometheus metrics |

---

## Database Optimization

### Connection Pooling (PGBouncer)

```ini
[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
```

### Query Optimization

```python
# Use selectinload for relationships
from sqlalchemy.orm import selectinload

query = select(Case).options(
    selectinload(Case.evidence),
    selectinload(Case.assignee)
).where(Case.id == case_id)

# Add indexes for frequent queries
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created ON cases(created_at DESC);
```

---

## Redis Caching

### Multi-Layer Cache

```python
class CacheManager:
    def __init__(self):
        self.l1_cache = {}  # Memory (1MB, 60s TTL)
        self.l2_cache = redis  # Redis (100MB, 300s TTL)
    
    async def get(self, key):
        if key in self.l1_cache:
            return self.l1_cache[key]
        value = await self.l2_cache.get(key)
        if value:
            self.l1_cache[key] = value
        return value
```

### Cache Keys

```
cases:{id}           # Single case (TTL: 300s)
cases:list:{hash}    # Case list (TTL: 60s)
user:{id}:prefs      # User preferences (TTL: 3600s)
```

---

## Container Tuning

### API Gateway (512MB)

```yaml
resources:
  memory: 512MB
  cpu: 0.5
uvicorn:
  workers: 2
  worker_connections: 1000
```

### AI/ML Service (2GB + GPU)

```yaml
resources:
  memory: 2GB
  gpu: 1
model_loading:
  preload: true
  batch_size: 32
```

---

## Monitoring Commands

```bash
# Check P95 latency
curl -s http://service/metrics | grep 'http_request_duration_seconds{quantile="0.95"}'

# Check cache hit rate
redis-cli INFO stats | grep keyspace

# Check DB connections
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"

# Check memory
railway metrics --service api-gateway
```

---

## Quick Wins

1. **Enable gzip compression** - Reduces payload 70%
2. **Add response caching headers** - Cache-Control: max-age=60
3. **Use connection pooling** - Reduces connection overhead
4. **Implement query pagination** - Limit result sets
5. **Defer non-critical operations** - Use background tasks

---

**Contact:** <platform-eng@zenith.dev>
