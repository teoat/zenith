# 🚀 Deployment Guide
## Zenith Fraud Detection Platform - Production Deployment

**Version:** 1.0.0  
**Last Updated:** 2026-01-08  
**Related Document:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

---

## Overview

This guide covers deploying the Zenith Platform to Railway (backend services) and Vercel (edge gateway). The architecture consists of:

- **Railway**: 4 microservices (API Gateway, AI/ML, Fraud+Intel, Workflow+Reg)
- **Vercel**: Edge Gateway with caching, rate limiting, and monitoring

## Prerequisites

### Required Accounts
- [Railway](https://railway.app) account with payment method
- [Vercel](https://vercel.com) account
- [GitHub](https://github.com) repository

### Local Tools
```bash
# Install required CLI tools
npm install -g vercel@latest
brew install railway-cli
brew install docker
```

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/zenith-platform.git
cd zenith-platform
```

### 2. Configure Environment Variables

Create `.env.production` for Railway:
```bash
# PostgreSQL
POSTGRES_URL=postgresql://user:pass@hostname:5432/zenith_db

# Redis
REDIS_URL=redis://hostname:6379/0

# API Gateway
AUTH_SERVICE_URL=https://auth-service.railway.app
CASE_SERVICE_URL=https://case-service.railway.app
AI_SERVICE_URL=https://ai-service.railway.app
FRAUD_SERVICE_URL=https://fraud-service.railway.app
WORKFLOW_SERVICE_URL=https://workflow-service.railway.app

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-encryption-key

# AI Service
GPU_ENABLED=true
MODEL_CACHE_DIR=/app/models
```

Create `.env.production` for Vercel:
```bash
# Required
RAILWAY_API_GATEWAY_URL=https://your-api-gateway.railway.app

# Optional (for distributed caching)
KV_URL=redis://...
KV_REST_API_TOKEN=your-kv-token
KV_REST_API_URL=your-kv-url

# Optional (tuning)
RATE_LIMIT_MAX=1000
CACHE_TTL=300
RETRY_MAX_ATTEMPTS=3
RETRY_DELAY_MS=500
```

---

## Railway Deployment

### 1. Initialize Railway Project
```bash
# Login to Railway
railway login

# Create new project
railway init

# Select "Empty Project" and name it "zenith-platform"
```

### 2. Deploy Services

Deploy each service sequentially:

```bash
# Deploy API Gateway
cd services/api-gateway
railway up --detach
railway variables set \
  AUTH_SERVICE_URL=https://auth-service.railway.app \
  CASE_SERVICE_URL=https://case-service.railway.app \
  REDIS_URL=$REDIS_URL \
  POSTGRES_URL=$POSTGRES_URL

# Deploy AI/ML Service (with GPU)
cd ../ai-ml-service
railway up --detach
railway variables set GPU_ENABLED=true
railway environment set gpu

# Deploy Fraud+Intel Service
cd ../fraud-intel-service
railway up --detach
railway variables set AI_SERVICE_URL=$AI_SERVICE_URL

# Deploy Workflow+Reg Service
cd ../workflow-regulatory-service
railway up --detach
```

### 3. Verify Deployment
```bash
# Check service status
railway status

# Test health endpoints
curl https://api-gateway.railway.app/health
curl https://ai-service.railway.app/health
curl https://fraud-service.railway.app/health
curl https://workflow-service.railway.app/health

# Set up domain
railway domain add api.zenith.com
```

---

## Vercel Deployment

### 1. Initialize Vercel Project
```bash
cd vercel-edge
vercel login
vercel init
```

### 2. Configure Environment
```bash
# Add environment variables
vercel env add RAILWAY_API_GATEWAY_URL
vercel env add KV_URL
vercel env add KV_REST_API_TOKEN

# Link to project
vercel link
```

### 3. Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 4. Configure Domain
```bash
# Add custom domain
vercel domains add zenith.com
vercel domains add api.zenith.com

# Configure CNAME records in your DNS
# api.zenith.com -> cname.vercel-dns.com
```

---

## Database Setup

### 1. Provision PostgreSQL on Railway
```bash
# Create PostgreSQL service
railway add postgresql

# Note the POSTGRES_URL from output
export POSTGRES_URL=$(railway variables get POSTGRES_URL)
```

### 2. Run Migrations
```bash
cd services/api-gateway
railway run alembic upgrade head
```

### 3. Seed Initial Data (if needed)
```bash
railway run python scripts/seed_initial_data.py
```

---

## Redis Setup

### 1. Provision Redis on Railway
```bash
railway add redis
```

### 2. Configure
```bash
export REDIS_URL=$(railway variables get REDIS_URL)
```

---

## Monitoring Setup

### 1. Configure Health Checks
Each service automatically exposes `/health` endpoint.

### 2. Set Up Logging
```bash
# View logs
railway logs --tail

# Filter by service
railway logs --service api-gateway
```

### 3. Configure Alerts
```bash
# Set up Railway alerts
railway alerts add --service api-gateway --threshold 5m --condition error_rate > 10%
```

---

## Rollback Procedures

### Railway Rollback
```bash
# View deployments
railway deployments

# Rollback to previous deployment
railway rollback <deployment-id>
```

### Vercel Rollback
```bash
# View deployments
vercel list

# Rollback
vercel rollback <deployment-url>
```

---

## Scaling

### Railway Scaling
```bash
# Scale API Gateway
railway scale api-gateway --replicas 2

# Scale AI/ML Service (GPU)
railway scale ai-ml-service --replicas 1 --gpu 1

# Adjust resources
railway resources edit
```

### Vercel Scaling
Automatic scaling is handled by Vercel's Edge network.

---

## Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
railway logs --service api-gateway

# Check environment
railway variables list
```

**Database connection failed:**
```bash
# Verify DATABASE_URL
railway variables get POSTGRES_URL

# Test connection
railway run pg_isready -U $POSTGRES_USER -h $POSTGRES_HOST
```

**Redis cache miss:**
```bash
# Verify REDIS_URL
railway variables get REDIS_URL

# Test connection
railway run redis-cli ping
```

**Health check failing:**
```bash
# Check endpoint directly
curl -v https://api-gateway.railway.app/health

# Check service status
railway status
```

---

## Security Checklist

- [ ] Rotate all default secrets
- [ ] Enable PostgreSQL SSL
- [ ] Configure Redis authentication
- [ ] Set up WAF rules
- [ ] Configure CORS origins
- [ ] Enable rate limiting
- [ ] Set up audit logging
- [ ] Configure backup schedule

---

## Performance Tuning

### Database
```sql
-- Create indexes for common queries
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_alerts_created ON alerts(created_at);
```

### Redis
```bash
# Configure memory limits
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Application
- Enable response compression
- Configure connection pooling (20-50 connections)
- Set appropriate timeouts (30s)

---

## Next Steps

1. Set up CI/CD pipeline (see [CI/CD Pipeline](../.github/workflows/))
2. Configure custom domains
3. Enable SSL certificates
4. Set up monitoring dashboards
5. Configure backup strategy
6. Document emergency contacts

---

**Document Version:** 1.0.0  
**Last Modified:** 2026-01-08
