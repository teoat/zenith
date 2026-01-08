# 🆓 Free Forever - NO Credit Card Required

> **Complete deployment guide using only providers that don't require a credit card**

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (Free Forever)                     │
│              Workers + KV + CDN + DNS + SSL                      │
│              zenith-gateway.YOUR_ACCOUNT.workers.dev             │
└────────────────────────────┬────────────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────────────────┐
     │                       │                                   │
     ▼                       ▼                                   ▼
┌─────────────┐    ┌──────────────────────────────────────┐    ┌─────────────┐
│   KOYEB     │    │              FLY.IO                  │    │  SUPABASE   │
│   (Free)    │    │           (3 Free VMs)               │    │   (Free)    │
│             │    │                                      │    │             │
│ API Gateway │    │  ┌────────┐ ┌────────┐ ┌────────┐   │    │ PostgreSQL  │
│ 512MB RAM   │    │  │ AI/ML  │ │ Fraud  │ │Workflow│   │    │   500MB     │
│ Port 8000   │    │  │ 256MB  │ │ 256MB  │ │ 256MB  │   │    │             │
│             │    │  │ :8003  │ │ :8004  │ │ :8005  │   │    │             │
└─────────────┘    │  └────────┘ └────────┘ └────────┘   │    └─────────────┘
                   └──────────────────────────────────────┘           │
                                      │                               │
                                      ▼                               │
                            ┌─────────────────┐                      │
                            │     UPSTASH     │◄─────────────────────┘
                            │     (Free)      │
                            │  Redis 10K/day  │
                            └─────────────────┘
```

---

## 📊 Resource Summary

| Service | Provider | RAM | CPU | Cost | CC Required? |
|---------|----------|-----|-----|------|--------------|
| Edge Gateway | Cloudflare | 128MB | - | $0 | ❌ No |
| API Gateway | Koyeb | 512MB | 0.1 | $0 | ❌ No |
| AI/ML Service | Fly.io | 256MB | shared | $0 | ❌ No |
| Fraud Service | Fly.io | 256MB | shared | $0 | ❌ No |
| Workflow Service | Fly.io | 256MB | shared | $0 | ❌ No |
| Database | Supabase | - | - | $0 | ❌ No |
| Cache | Upstash | 256MB | - | $0 | ❌ No |
| **TOTAL** | | **~1.5GB** | | **$0** | **❌ None** |

---

## 📋 Setup Order

| Step | Provider | Time | What You Get |
|------|----------|------|--------------|
| 1 | Supabase | 5 min | PostgreSQL database |
| 2 | Upstash | 3 min | Redis cache |
| 3 | Fly.io | 15 min | 3 container VMs |
| 4 | Koyeb | 10 min | 1 container service |
| 5 | Cloudflare | 10 min | Edge gateway |
| **Total** | | **~45 min** | **Full platform** |

---

## 🚀 Step 1: Supabase (Database)

### 1.1 Create Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with **GitHub** (fastest)
4. **No credit card required!**

### 1.2 Create Project

1. Click **"New Project"**
2. Configure:
   - **Name:** `zenith-db`
   - **Password:** Generate strong password (SAVE THIS!)
   - **Region:** Choose closest to you
   - **Plan:** Free (default)
3. Click **"Create new project"**
4. Wait 2-3 minutes

### 1.3 Get Connection String

Go to **Settings → Database → Connection String**

```bash
# Save this - you'll need it for all services
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

---

## 🚀 Step 2: Upstash (Redis Cache)

### 2.1 Create Account

1. Go to [upstash.com](https://upstash.com)
2. Click **"Sign Up"**
3. Use **GitHub** or **Google**
4. **No credit card required!**

### 2.2 Create Redis Database

1. Click **"Create Database"**
2. Configure:
   - **Name:** `zenith-cache`
   - **Type:** Regional
   - **Region:** Choose closest to Fly.io region
3. Click **"Create"**

### 2.3 Get Connection Details

```bash
# REST API (for Cloudflare Workers)
UPSTASH_REDIS_REST_URL=https://[ID].upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Redis Protocol (for services)
REDIS_URL=rediss://default:[PASSWORD]@[ID].upstash.io:6379
```

---

## 🚀 Step 3: Fly.io (3 Container VMs)

### 3.1 Create Account

1. Go to [fly.io](https://fly.io)
2. Click **"Sign Up"**
3. Use **GitHub**
4. **No credit card required for free tier!**

### 3.2 Install Fly CLI

```bash
# macOS
brew install flyctl

# Or curl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login
```

### 3.3 Create AI/ML Service

```bash
mkdir -p ~/zenith-fly/ai-ml && cd ~/zenith-fly/ai-ml

# Create fly.toml
cat > fly.toml << 'EOF'
app = "zenith-ai-ml"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8003"

[http_service]
  internal_port = 8003
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
EOF

# Create minimal Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8003
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
EOF

# Create requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn==0.27.0
httpx==0.26.0
EOF

# Create main.py (minimal health check)
cat > main.py << 'EOF'
from fastapi import FastAPI

app = FastAPI(title="AI/ML Service")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "ai-ml"}

@app.post("/api/v1/ai/analyze")
def analyze(data: dict):
    return {"result": "analyzed", "confidence": 0.95}
EOF

# Deploy
fly launch --name zenith-ai-ml --region iad --no-deploy
fly deploy
```

### 3.4 Create Fraud Service

```bash
mkdir -p ~/zenith-fly/fraud && cd ~/zenith-fly/fraud

cat > fly.toml << 'EOF'
app = "zenith-fraud"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8004"

[http_service]
  internal_port = 8004
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
EOF

cat > Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
EOF

cat > requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn==0.27.0
EOF

cat > main.py << 'EOF'
from fastapi import FastAPI

app = FastAPI(title="Fraud Service")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "fraud-intel"}

@app.get("/api/v1/fraud/alerts")
def get_alerts():
    return {"alerts": [], "count": 0}
EOF

fly launch --name zenith-fraud --region iad --no-deploy
fly deploy
```

### 3.5 Create Workflow Service

```bash
mkdir -p ~/zenith-fly/workflow && cd ~/zenith-fly/workflow

cat > fly.toml << 'EOF'
app = "zenith-workflow"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8005"

[http_service]
  internal_port = 8005
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
EOF

cat > Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]
EOF

cat > requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn==0.27.0
EOF

cat > main.py << 'EOF'
from fastapi import FastAPI

app = FastAPI(title="Workflow Service")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "workflow"}

@app.get("/api/v1/workflow/tasks")
def get_tasks():
    return {"tasks": [], "count": 0}
EOF

fly launch --name zenith-workflow --region iad --no-deploy
fly deploy
```

### 3.6 Get Fly.io URLs

```bash
# Your services will be at:
AI_ML_URL=https://zenith-ai-ml.fly.dev
FRAUD_URL=https://zenith-fraud.fly.dev
WORKFLOW_URL=https://zenith-workflow.fly.dev

# Verify
curl https://zenith-ai-ml.fly.dev/health
curl https://zenith-fraud.fly.dev/health
curl https://zenith-workflow.fly.dev/health
```

---

## 🚀 Step 4: Koyeb (API Gateway)

### 4.1 Create Account

1. Go to [koyeb.com](https://koyeb.com)
2. Click **"Get Started for Free"**
3. Use **GitHub**
4. **No credit card required!**

### 4.2 Create Service

1. Click **"Create Service"**
2. Choose **"Docker"**
3. Configure:
   - **Image:** `python:3.11-slim` (or your custom image)
   - **Name:** `zenith-api-gateway`
   - **Region:** Washington, D.C. or Frankfurt
   - **Instance:** Free (512MB)
   - **Port:** 8000

4. Add environment variables:

```
DATABASE_URL=<your-supabase-url>
REDIS_URL=<your-upstash-url>
AI_ML_URL=https://zenith-ai-ml.fly.dev
FRAUD_URL=https://zenith-fraud.fly.dev
WORKFLOW_URL=https://zenith-workflow.fly.dev
```

1. Click **"Deploy"**

### 4.3 Get Koyeb URL

```bash
API_GATEWAY_URL=https://zenith-api-gateway-<YOUR_ORG>.koyeb.app

# Verify
curl https://zenith-api-gateway-<YOUR_ORG>.koyeb.app/health
```

---

## 🚀 Step 5: Cloudflare Workers (Edge Gateway)

### 5.1 Create Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **"Sign Up"**
3. Use email
4. **No credit card required!**

### 5.2 Deploy Gateway

```bash
cd /path/to/your/project/cloudflare-workers

# Install dependencies
npm install

# Login
npx wrangler login

# Update wrangler.toml with your backend URLs
cat > wrangler.toml << 'EOF'
name = "zenith-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
API_GATEWAY_URL = "https://zenith-api-gateway-YOUR_ORG.koyeb.app"
AI_ML_URL = "https://zenith-ai-ml.fly.dev"
FRAUD_URL = "https://zenith-fraud.fly.dev"
WORKFLOW_URL = "https://zenith-workflow.fly.dev"
RATE_LIMIT_MAX = "100"
EOF

# Create KV namespaces
npx wrangler kv:namespace create "CACHE"
npx wrangler kv:namespace create "RATE_LIMIT"
# Add the IDs to wrangler.toml

# Deploy
npx wrangler deploy
```

### 5.3 Your Free Domain

```
https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev
```

---

## ✅ Final Verification

```bash
# Test edge gateway
curl https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev/health

# Test through gateway to each service
curl https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev/api/ai/health
curl https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev/api/fraud/health
curl https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev/api/workflow/health
```

---

## 🌐 Your Endpoints

| Service | URL |
|---------|-----|
| **Edge Gateway** | `https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev` |
| **API Gateway** | `https://zenith-api-gateway-YOUR_ORG.koyeb.app` |
| **AI/ML Service** | `https://zenith-ai-ml.fly.dev` |
| **Fraud Service** | `https://zenith-fraud.fly.dev` |
| **Workflow Service** | `https://zenith-workflow.fly.dev` |
| **Database** | `postgresql://...@supabase.co` |
| **Cache** | `redis://...@upstash.io` |

---

## 💰 Total Cost

| Provider | Cost | CC Required |
|----------|------|-------------|
| Cloudflare | $0 | ❌ No |
| Koyeb | $0 | ❌ No |
| Fly.io (3 VMs) | $0 | ❌ No |
| Supabase | $0 | ❌ No |
| Upstash | $0 | ❌ No |
| **TOTAL** | **$0/month** | **❌ None** |

---

## ⚠️ Free Tier Limits

| Provider | Limit | Mitigation |
|----------|-------|------------|
| Cloudflare | 100K req/day | Client-side caching |
| Koyeb | 512MB RAM | Optimize memory usage |
| Fly.io | 256MB/VM × 3 | Lightweight services |
| Supabase | 500MB storage | Data archival |
| Upstash | 10K cmd/day | L1 memory caching |

---

## ✅ Master Checklist

```
□ Supabase account created (GitHub login)
□ Supabase project created
□ Connection string saved

□ Upstash account created (GitHub login)
□ Redis database created
□ Redis URL saved

□ Fly.io account created (GitHub login)
□ Fly CLI installed
□ AI/ML service deployed
□ Fraud service deployed
□ Workflow service deployed
□ All health checks passing

□ Koyeb account created (GitHub login)
□ API Gateway service deployed
□ Environment variables configured

□ Cloudflare account created
□ Workers deployed
□ KV namespaces created
□ Gateway configured with all backend URLs

□ End-to-end test passing
```

---

**🎉 Congratulations! Your Zenith Platform is running 100% FREE with NO credit card required!**
