# 🔄 Hot Reload Testing Guide

**Version:** 1.0.0  |  **Updated:** 2026-01-08  |  **Status:** Production Ready

---

## Overview

Target: **< 60 seconds** reload time per service with zero-downtime.

| Service | Build | Startup | Total |
|---------|-------|---------|-------|
| API Gateway | ~15s | ~10s | ~25s |
| AI/ML Service | ~25s | ~15s | ~40s |
| Fraud+Intel | ~15s | ~12s | ~27s |
| Workflow+Reg | ~15s | ~10s | ~25s |

---

## Testing Scripts

### Pre-Reload Check

```bash
for service in api-gateway ai-ml-service fraud-intel-service workflow-regulatory; do
    curl -s "http://$service.railway.internal:8000/health" | jq -r '.status'
done
```

### Hot Reload Test

```bash
SERVICE=$1
START=$(date +%s)
railway deploy --service $SERVICE --wait
END=$(date +%s)
echo "Reload time: $((END - START))s"
```

### Zero-Downtime Verification

```python
import asyncio, aiohttp, time
from collections import Counter

async def verify_zero_downtime(url, duration=120):
    results = Counter()
    start = time.time()
    async with aiohttp.ClientSession() as session:
        while time.time() - start < duration:
            try:
                async with session.get(f"{url}/health", timeout=5) as r:
                    results[r.status] += 1
            except: results["error"] += 1
            await asyncio.sleep(0.1)
    success = results[200] / sum(results.values()) * 100
    print(f"Success rate: {success:.2f}%")
```

---

## Rollback Procedure

```bash
# List deployments
railway deployments --service $SERVICE --limit 10

# Rollback to specific deployment
railway rollback --service $SERVICE --deployment $DEPLOYMENT_ID

# Verify
curl -s "http://$SERVICE.railway.internal:8000/health"
```

---

## Checklist

- [ ] Reload < 60 seconds
- [ ] Zero dropped requests
- [ ] Health check passes
- [ ] Other services unaffected
- [ ] Rollback < 30 seconds

---

**Contact:** <platform-eng@zenith.dev>
