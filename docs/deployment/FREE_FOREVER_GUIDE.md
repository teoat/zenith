# 🆓 Free Forever Deployment - Complete Guide

> **Run Zenith Platform for $0/month FOREVER using multi-cloud free tiers**

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (Free Forever)                     │
│  • Workers: Edge Gateway (100K req/day)                         │
│  • KV: Caching + Rate Limiting (1GB)                            │
│  • DNS + CDN + SSL: Included                                    │
│  Domain: zenith-gateway.YOUR_ACCOUNT.workers.dev                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               ORACLE CLOUD (Free Forever)                        │
│  ARM Ampere: 4 CPUs + 24GB RAM + 200GB Storage                  │
│                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ API GW    │ │ AI/ML     │ │ Fraud     │ │ Workflow  │       │
│  │ 4GB/1CPU  │ │ 12GB/2CPU │ │ 4GB/0.5CPU│ │ 4GB/0.5CPU│       │
│  │ :8000     │ │ :8003     │ │ :8004     │ │ :8005     │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   SUPABASE (Free)       │   │   UPSTASH (Free)        │
│   PostgreSQL            │   │   Serverless Redis      │
│   • 500MB storage       │   │   • 10K cmd/day         │
│   • Unlimited API       │   │   • 256MB storage       │
│   • Built-in Auth       │   │   • Global edge         │
└─────────────────────────┘   └─────────────────────────┘
```

---

## 📋 Setup Order

### Phase 1: Databases (15 minutes)

1. **[Supabase Setup](./SUPABASE_SETUP.md)** - PostgreSQL database
2. **[Upstash Setup](./UPSTASH_SETUP.md)** - Redis cache

### Phase 2: Compute (30 minutes)

1. **[Oracle Cloud Setup](./ORACLE_CLOUD_SETUP.md)** - All 4 containers

### Phase 3: Edge Gateway (10 minutes)

1. **[Cloudflare Workers](../../cloudflare-workers/README.md)** - Edge gateway

---

## 🚀 Quick Deploy Commands

```bash
# 1. Deploy Cloudflare Workers (edge gateway)
cd cloudflare-workers
npm install
npx wrangler login
./deploy.sh

# 2. SSH to Oracle Cloud and deploy containers
ssh -i your-key.pem ubuntu@YOUR_ORACLE_IP
cd ~/zenith
docker-compose up -d

# 3. Verify everything works
curl https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev/health
```

---

## 💰 Cost Summary

| Component | Provider | Monthly Cost | Duration |
|-----------|----------|--------------|----------|
| Edge Gateway | Cloudflare Workers | $0 | Forever |
| CDN + DNS | Cloudflare | $0 | Forever |
| All 4 Containers | Oracle Cloud | $0 | Forever |
| PostgreSQL | Supabase | $0 | Forever |
| Redis | Upstash | $0 | Forever |
| SSL Certificates | Cloudflare | $0 | Forever |
| **TOTAL** | | **$0** | **Forever** |

---

## ⚠️ Free Tier Limits

| Resource | Limit | Mitigation |
|----------|-------|------------|
| Cloudflare requests | 100K/day | Local caching |
| Supabase storage | 500MB | Data archival |
| Upstash commands | 10K/day | L1 memory cache |
| Oracle bandwidth | 10TB/mo | More than enough |

---

## 🔗 Connection Details Template

Save this as `~/zenith/.env` on Oracle Cloud:

```bash
# Supabase (PostgreSQL)
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Upstash (Redis)
REDIS_URL=rediss://default:[TOKEN]@[ID].upstash.io:6379

# Secrets (generate your own!)
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Service URLs (internal)
API_GATEWAY_URL=http://localhost:8000
AI_ML_SERVICE_URL=http://localhost:8003
FRAUD_INTEL_SERVICE_URL=http://localhost:8004
WORKFLOW_SERVICE_URL=http://localhost:8005
```

---

## ✅ Master Checklist

### Databases

```
□ Supabase account created
□ Supabase project created
□ Database schema deployed
□ Upstash account created
□ Redis database created
```

### Compute

```
□ Oracle Cloud account created
□ ARM VM created (4 CPU, 24GB RAM)
□ SSH access working
□ Docker installed
□ Firewall ports opened
□ Containers deployed
□ Health checks passing
```

### Edge Gateway

```
□ Cloudflare account created
□ Workers CLI installed
□ KV namespaces created
□ Gateway deployed
□ Backend URL configured
```

### Integration

```
□ Cloudflare → Oracle connection working
□ Oracle → Supabase connection working
□ Oracle → Upstash connection working
□ End-to-end health check passing
```

---

## 🎉 Congratulations

Your Zenith Platform is now running **100% FREE FOREVER**:

- **Edge Gateway:** `https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev`
- **API Endpoint:** `https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev/api/`
- **Health Check:** `https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev/health`

---

## 📚 Related Documentation

- [Cloudflare Workers README](../../cloudflare-workers/README.md)
- [Oracle Cloud Setup](./ORACLE_CLOUD_SETUP.md)
- [Supabase Setup](./SUPABASE_SETUP.md)
- [Upstash Setup](./UPSTASH_SETUP.md)
- [Implementation Plan](../development/IMPLEMENTATION_PLAN.md)
