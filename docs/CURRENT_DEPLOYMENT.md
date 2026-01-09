# 🚀 Current Deployment Architecture

**Last Updated:** 2026-01-09T09:47:35+09:00  
**Status:** ✅ **DEPLOYED AND LIVE**

---

## 📍 Your Live Deployment

Based on your documentation, here's your **ACTUAL CURRENT deployment**:

### **🎨 Frontend:** Cloudflare Pages
```
URL: https://zenith-frontend-v1.pages.dev
Platform: Cloudflare Pages
Cost: $0/month (Free Forever)
```

### **⚙️ Backend:** Hugging Face Spaces
```
URL: https://teoat-zenith-backend.hf.space
Platform: Hugging Face Spaces
Specs: 16GB RAM, 2 vCPU (Free!)
Cost: $0/month (Free Forever)
```

### **🌐 API Gateway:** Cloudflare Workers
```
URL: https://zenith-gateway.[your-account].workers.dev
Platform: Cloudflare Workers
Function: Routes API calls, caching, rate limiting
Cost: $0/month (Free Forever)
```

---

## 🏗️ Complete Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     USER BROWSER                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   CLOUDFLARE PAGES         │ ← Frontend (Static)
        │   zenith-frontend-v1       │
        │   React + Vite             │
        │   Global CDN               │
        └────────────┬───────────────┘
                     │ API Requests
                     ▼
        ┌────────────────────────────┐
        │   CLOUDFLARE WORKERS       │ ← API Gateway
        │   zenith-gateway           │
        │   • Rate Limiting          │
        │   • Caching (KV)           │
        │   • Security Headers       │
        └────────────┬───────────────┘
                     │ Proxy
                     ▼
        ┌────────────────────────────┐
        │   HUGGING FACE SPACES      │ ← Backend (FastAPI)
        │   teoat-zenith-backend     │
        │   16GB RAM, 2 vCPU         │
        │   Docker Container         │
        └────────────┬───────────────┘
                     │
         ┌───────────┴──────────────┐
         ▼                          ▼
┌─────────────────┐      ┌──────────────────┐
│  SUPABASE       │      │  UPSTASH         │
│  PostgreSQL     │      │  Redis Cache     │
│  500MB Free     │      │  10K cmds/day    │
└─────────────────┘      └──────────────────┘
```

---

## 📁 Key Configuration Files

### **1. Frontend (Cloudflare Pages)**

**Deployment Method:** Direct from GitHub  
**Build Command:** `npm run build` (from `/frontend`)  
**Output Directory:** `dist/`  

**Environment Variables Needed:**
```env
VITE_API_URL=https://zenith-gateway.[your-account].workers.dev
VITE_MAPBOX_TOKEN=your_token
VITE_ENABLE_THREAT_MAP=true
VITE_ENABLE_ADVANCED_FORENSIC=true
```

---

### **2. API Gateway (Cloudflare Workers)**

**Config File:** `cloudflare-workers/wrangler.toml`

**Current Configuration:**
```toml
name = "zenith-gateway"
main = "src/index.ts"

[vars]
API_GATEWAY_URL = "https://teoat-zenith-backend.hf.space"
AI_ML_URL = "https://teoat-zenith-backend.hf.space"
FRAUD_URL = "https://teoat-zenith-backend.hf.space"
WORKFLOW_URL = "https://teoat-zenith-backend.hf.space"
RATE_LIMIT_MAX = "100"
CACHE_TTL = "300"
```

**Deploy Command:**
```bash
cd cloudflare-workers
npm install
npx wrangler login
npx wrangler deploy
```

---

### **3. Backend (Hugging Face Spaces)**

**Deployment:** Docker-based Space  
**Hardware:** CPU Basic (2 vCPU, 16GB RAM) - FREE  

**Configuration Location:** Hugging Face Dashboard → Settings → Secrets

**Required Secrets:**
```
DATABASE_URL          → PostgreSQL connection (Supabase)
REDIS_URL            → Redis connection (Upstash)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
SECRET_KEY           → App secret
JWT_SECRET_KEY       → JWT signing
ENCRYPTION_KEY       → Data encryption
CORS_ALLOWED_ORIGINS → https://zenith-frontend-v1.pages.dev
```

**Dockerfile Location:** `/Dockerfile` (root of repo)

---

## 📚 Available Documentation

I found these deployment guides in your `/docs/deployment/` folder:

### **Primary Guides:**

1. **`HUGGINGFACE_MIGRATION.md`** ✅
   - Step-by-step Hugging Face Spaces setup
   - How to create the Space
   - Configure secrets
   - Update gateway to point to HF

2. **`DEPLOYMENT_SUMMARY.md`** ✅
   - Live endpoint URLs
   - Architecture diagram
   - Cost analysis ($0/month)
   - Credentials reference

3. **`FREE_FOREVER_GUIDE.md`** ✅
   - Complete free tier architecture
   - Multi-cloud setup (Oracle + Cloudflare + Supabase + Upstash)
   - Cost breakdown
   - Setup checklist

4. **`Cloudflare Workers README`** ✅
   - Location: `cloudflare-workers/README.md`
   - Quick start guide
   - Endpoint documentation
   - Security features
   - Free tier limits

### **Supporting Guides:**

5. **`BACKEND_MIGRATION_OPTIONS.md`**
   - Hugging Face vs other platforms
   - Migration comparison

6. **`FREE_NO_CREDIT_CARD.md`**
   - 100% free deployment without CC
   - Platform comparisons

7. **`SUPABASE_SETUP.md`**
   - PostgreSQL database setup

8. **`UPSTASH_SETUP.md`**
   - Redis cache setup

9. **`ORACLE_CLOUD_SETUP.md`**
   - Alternative compute platform

---

## 🔧 How to Redeploy/Update

### **Update Frontend:**
```bash
# 1. Make changes to /frontend
# 2. Push to GitHub main branch
# 3. Cloudflare Pages auto-deploys!

# Or manual deploy:
cd frontend
npm run build
# Upload dist/ to Cloudflare Pages dashboard
```

### **Update API Gateway:**
```bash
cd cloudflare-workers

# Update wrangler.toml if needed
# Then deploy:
npx wrangler deploy

# Check logs:
npx wrangler tail
```

### **Update Backend:**
```bash
# Hugging Face auto-deploys from GitHub!
# Just push to main branch

# Or force rebuild:
# Go to HF Space → Settings → Factory reboot
```

---

## 💰 Cost Analysis

| Component | Platform | Monthly Cost | Status |
|-----------|----------|--------------|--------|
| Frontend | Cloudflare Pages | **$0** | ✅ Free Forever |
| API Gateway | Cloudflare Workers | **$0** | ✅ Free Forever (100K req/day) |
| Backend | Hugging Face Spaces | **$0** | ✅ Free Forever (16GB RAM!) |
| Database | Supabase | **$0** | ✅ Free Forever (500MB) |
| Cache | Upstash | **$0** | ✅ Free Forever (10K cmds/day) |
| SSL | Cloudflare | **$0** | ✅ Included |
| CDN | Cloudflare | **$0** | ✅ Included |
| **TOTAL** | | **$0/month** | 🎉 **FREE!** |

---

## ⚠️ Free Tier Limits

| Resource | Limit | Impact |
|----------|-------|--------|
| **CF Workers Requests** | 100,000/day | ~70 req/min average - sufficient |
| **HF Spaces Compute** | 16GB RAM, 2 vCPU | Great for moderate traffic |
| **Supabase Storage** | 500MB | Archive old data as needed |
| **Upstash Commands** | 10,000/day | Add L1 caching if exceeded |

---

## 🚀 Quick Links

### **Live URLs:**
- Frontend: https://zenith-frontend-v1.pages.dev
- Gateway: https://zenith-gateway.[your-account].workers.dev
- Backend: https://teoat-zenith-backend.hf.space
- Backend Health: https://teoat-zenith-backend.hf.space/health

### **Dashboards:**
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Hugging Face Spaces](https://huggingface.co/spaces)
- [Supabase Dashboard](https://app.supabase.com)
- [Upstash Console](https://console.upstash.com)

---

## 📖 Next Steps

1. **Verify Deployment:**
   ```bash
   # Check frontend
   curl https://zenith-frontend-v1.pages.dev
   
   # Check gateway
   curl https://zenith-gateway.[your-account].workers.dev/health
   
   # Check backend
   curl https://teoat-zenith-backend.hf.space/health
   ```

2. **Monitor Limits:**
   - Cloudflare Dashboard → Workers → Analytics
   - Hugging Face Space → Logs tab
   - Supabase → Database → Usage

3. **Scale if Needed:**
   - Frontend: Cloudflare Pages Pro ($20/mo) for advanced features
   - Backend: HF Spaces GPU ($0.60/hr) for AI workloads
   - Database: Supabase Pro ($25/mo) for more storage

---

## 🎉 Summary

Your platform is deployed on a **100% FREE, production-grade architecture**:

✅ **Frontend:** Cloudflare Pages (global CDN, instant deploys)  
✅ **Gateway:** Cloudflare Workers (edge computing, caching, rate limiting)  
✅ **Backend:** Hugging Face Spaces (16GB RAM, Docker support)  
✅ **Database:** Supabase (managed PostgreSQL)  
✅ **Cache:** Upstash (serverless Redis)  

**Total Monthly Cost: $0** 🎊

All deployments are configured for **auto-deploy from GitHub** - just push to `main` and everything updates automatically!
