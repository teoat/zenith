# Railway Deployment Configuration

## Overview
This directory contains Railway deployment configurations for the Zenith Platform microservices architecture.

## Services

### 1. API Gateway (Port 8000)
- **Directory:** `../services/api-gateway`
- **Memory:** 512MB
- **Purpose:** Request routing, rate limiting, security middleware

### 2. AI/ML Service (Port 8003)
- **Directory:** `../services/ai-ml-service`
- **Memory:** 2GB (GPU recommended)
- **Purpose:** Fraud detection, embeddings, ML inference

### 3. Fraud + Intelligence Service (Port 8004)
- **Directory:** `../services/fraud-intel-service`
- **Memory:** 1GB
- **Purpose:** Graph analysis, evidence management, forensic intelligence

### 4. Workflow + Regulatory Service (Port 8005)
- **Directory:** `../services/workflow-regulatory-service`
- **Memory:** 512MB
- **Purpose:** Workflow engine, compliance reporting, diagnostics

## Infrastructure

### PostgreSQL + PGBouncer
- PostgreSQL 15 with connection pooling via PGBouncer
- Default pool: 20 connections (configurable)
- Port: 5432 (direct), 6432 (pgbouncer)

### Redis
- Redis 7 for caching and event bus
- Port: 6379
- Max memory: 256MB with LRU eviction

## Deployment

### Quick Start (Local Development)
```bash
cd railway
docker-compose up -d
```

### Railway Deployment
1. Connect Railway to GitHub repository
2. Create services in Railway dashboard:
   - PostgreSQL (add-on)
   - Redis (add-on)
3. Deploy each service:
   ```bash
   cd services/api-gateway
   railway up
   railway deploy
   ```
4. Set environment variables in Railway dashboard

### Environment Variables
Required for all services:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

API Gateway additionally requires:
- `AUTH_SERVICE_URL`
- `CASE_SERVICE_URL`
- `AI_SERVICE_URL`
- `FRAUD_SERVICE_URL`

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │           Vercel Edge               │
                    │      (Frontend + API Gateway)       │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │       Railway API Gateway           │
                    │         (Port 8000)                 │
                    └─────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │  AI/ML Service  │   │ Fraud+Intel Svc │   │ Workflow+Reg Svc │
    │   (Port 8003)   │   │   (Port 8004)   │   │   (Port 8005)   │
    │   2GB RAM       │   │   1GB RAM       │   │   512MB RAM     │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         PostgreSQL + PGBouncer      │
                    │         Redis (Caching)             │
                    └─────────────────────────────────────┘
```

## Monitoring
- Health check endpoints: `/health`
- Metrics: Prometheus-compatible metrics on `/metrics`
- Logs: Structured JSON logging via structlog
