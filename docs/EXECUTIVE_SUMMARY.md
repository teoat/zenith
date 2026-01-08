# 🏛️ Zenith Platform - Executive Summary

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-08  
**Classification:** Internal - Executive  

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [System Architecture](#system-architecture)
3. [Core Services & Containers](#core-services--containers)
4. [Subsystems & Components](#subsystems--components)
5. [Data Architecture](#data-architecture)
6. [Infrastructure & Deployment](#infrastructure--deployment)
7. [Security Architecture](#security-architecture)
8. [Operational Workflows](#operational-workflows)
9. [Performance Metrics](#performance-metrics)
10. [Cost Analysis](#cost-analysis)

---

## 📊 Platform Overview

### Mission Statement

The **Zenith Platform** is an enterprise-grade fraud detection and case management system designed to provide financial institutions with real-time fraud analysis, AI-powered risk assessment, regulatory compliance automation, and collaborative case management workflows.

### Key Business Capabilities

| Capability | Description | Status |
|------------|-------------|--------|
| **Fraud Detection** | Real-time ML-powered transaction analysis | ✅ Production |
| **Case Management** | End-to-end investigation workflows | ✅ Production |
| **AI/ML Analytics** | Embeddings, similarity search, pattern detection | ✅ Production |
| **Regulatory Compliance** | Automated reporting (SAR, CTR, GDPR) | ✅ Production |
| **Graph Intelligence** | Network analysis for fraud rings | ✅ Production |
| **Real-time Alerting** | Threshold-based monitoring and notifications | ✅ Production |

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + TypeScript + Vite | React 18, Vite 5 |
| **Edge Gateway** | Next.js + Vercel Edge Functions | Next.js 14 |
| **Backend Services** | Python + FastAPI | Python 3.12, FastAPI 0.100+ |
| **AI/ML** | PyTorch, Transformers, XGBoost | GPU-accelerated |
| **Database** | PostgreSQL + PGBouncer | PostgreSQL 15 |
| **Cache** | Redis | Redis 7 |
| **Infrastructure** | Railway (containers) + Vercel (edge) | Managed services |

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 ZENITH PLATFORM                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                          PRESENTATION LAYER                                      │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                     React Frontend (Vite)                                 │  │ │
│  │  │  • Dashboard        • Case Management    • Reports                       │  │ │
│  │  │  • Fraud Alerts     • User Management    • Analytics                     │  │ │
│  │  │  • Graph Viewer     • Compliance Center  • System Diagnostics            │  │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                             │
│                                         ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                       EDGE GATEWAY LAYER (Vercel)                               │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  • Global CDN (Edge Functions)   • Rate Limiting (per-IP)                │  │ │
│  │  │  • Request Caching (KV Store)    • Circuit Breaker                        │  │ │
│  │  │  • CORS & Security Headers       • Request Routing                        │  │ │
│  │  │  • Monitoring & Metrics          • Authentication Proxy                   │  │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                             │
│                                         ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                      SERVICE LAYER (Railway - 4 Containers)                     │ │
│  │                                                                                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │ API Gateway  │  │ AI/ML Service│  │ Fraud+Intel  │  │ Workflow+Reg │        │ │
│  │  │   (8000)     │  │   (8001)     │  │   (8002)     │  │   (8003)     │        │ │
│  │  │   512MB      │  │   2GB + GPU  │  │   1GB        │  │   512MB      │        │ │
│  │  │              │  │              │  │              │  │              │        │ │
│  │  │ • Routing    │  │ • ML Models  │  │ • Graph DB   │  │ • Workflows  │        │ │
│  │  │ • Auth       │  │ • Embeddings │  │ • Forensics  │  │ • Compliance │        │ │
│  │  │ • Rate Limit │  │ • Inference  │  │ • Evidence   │  │ • Reports    │        │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │ │
│  │         │                 │                 │                 │                │ │
│  │         └─────────────────┼─────────────────┼─────────────────┘                │ │
│  │                           │                 │                                   │ │
│  └───────────────────────────┼─────────────────┼───────────────────────────────────┘ │
│                              │                 │                                     │
│                              ▼                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           DATA LAYER                                             │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │ │
│  │  │                     │  │                     │  │                     │     │ │
│  │  │   PostgreSQL 15     │  │   PGBouncer Pool    │  │   Redis 7 Cache     │     │ │
│  │  │                     │  │                     │  │                     │     │ │
│  │  │  • Cases            │  │  • 50 connections   │  │  • L1/L2 Cache      │     │ │
│  │  │  • Users            │  │  • Transaction mode │  │  • Session Store    │     │ │
│  │  │  • Transactions     │  │  • Health checks    │  │  • Rate Limits      │     │ │
│  │  │  • Audit Logs       │  │                     │  │  • Pub/Sub Events   │     │ │
│  │  │                     │  │                     │  │                     │     │ │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │ │
│  │                                                                                   │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Microservices Design** - 4 independent, loosely-coupled services
2. **Edge-First Approach** - Global CDN with edge caching and rate limiting
3. **Fault Isolation** - Circuit breakers prevent cascade failures
4. **Zero-Downtime Deployments** - Hot reload < 60s per service
5. **GPU Acceleration** - Dedicated ML inference container
6. **Multi-Layer Caching** - L1 (memory) → L2 (memory) → L3 (Redis)

---

## 🐳 Core Services & Containers

### Service Matrix

| Service | Port | Memory | CPU | GPU | Primary Functions |
|---------|------|--------|-----|-----|-------------------|
| **API Gateway** | 8000 | 512MB | 0.5 | ❌ | Routing, Auth, Rate Limiting |
| **AI/ML Service** | 8001 | 2GB | 1.0 | ✅ | Inference, Embeddings, Models |
| **Fraud+Intel Service** | 8002 | 1GB | 0.5 | ❌ | Graph Analysis, Forensics |
| **Workflow+Regulatory** | 8003 | 512MB | 0.5 | ❌ | Case Management, Compliance |

### Service Details

#### 1. API Gateway (`services/api-gateway/`)

**Purpose:** Unified entry point for all API requests, handling authentication, routing, and cross-cutting concerns.

**Capabilities:**

- Request routing to appropriate backend services
- JWT-based authentication and authorization
- Rate limiting (100 requests/minute default)
- Security headers (HSTS, CSP, XSS protection)
- Circuit breaker for downstream services
- Request/response caching with Redis

**Key Files:**

```
services/api-gateway/
├── app/
│   ├── main.py                 # FastAPI application entry
│   ├── routers/
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── cases.py            # Case management proxy
│   │   ├── ai.py               # AI service proxy
│   │   ├── fraud.py            # Fraud detection proxy
│   │   └── health.py           # Health check endpoints
│   ├── middleware/
│   │   ├── rate_limit.py       # Request throttling
│   │   └── security.py         # Security headers
│   └── utils/
│       ├── config.py           # Configuration management
│       └── http_client.py      # Inter-service HTTP client
├── Dockerfile                   # Container definition
└── railway.json                 # Railway deployment config
```

#### 2. AI/ML Service (`services/ai-ml-service/`)

**Purpose:** GPU-accelerated machine learning inference for fraud detection and text analysis.

**Capabilities:**

- Fraud detection model inference (XGBoost, LightGBM)
- Text embeddings generation (Sentence Transformers)
- Similarity search with FAISS vector index
- Model preloading and caching
- GPU detection and utilization

**Models:**

| Model | Type | Purpose |
|-------|------|---------|
| Fraud Detector | XGBoost/LightGBM | Transaction risk scoring |
| Embedding Model | Sentence-BERT | Text similarity search |
| FAISS Index | Vector DB | Nearest neighbor search |

#### 3. Fraud + Intelligence Service (`services/fraud-intel-service/`)

**Purpose:** Graph-based fraud analysis, evidence management, and forensic intelligence.

**Capabilities:**

- Transaction network graph construction (NetworkX)
- Fraud ring detection via connected components
- Evidence chain management
- Pattern recognition and analysis
- Forensic intelligence reports

**Graph Analysis:**

- Entity relationship mapping
- Transaction velocity analysis
- Geographic clustering
- Temporal pattern detection

#### 4. Workflow + Regulatory Service (`services/workflow-regulatory-service/`)

**Purpose:** Case management workflows, compliance reporting, and system diagnostics.

**Capabilities:**

- Case lifecycle management (create → assign → investigate → resolve)
- State machine for case transitions
- Compliance report generation (SAR, CTR)
- GDPR data export functionality
- System diagnostics orchestration

**Workflow States:**

```
OPEN → ASSIGNED → IN_PROGRESS → UNDER_REVIEW → ESCALATED → RESOLVED → CLOSED
                      ↓                ↓
                   ON_HOLD        REOPENED
```

---

## 🔧 Subsystems & Components

### Shared Infrastructure (`services/shared/infrastructure/`)

| Component | File | Purpose |
|-----------|------|---------|
| **Circuit Breaker** | `circuit_breaker.py` | 3-state failure protection (closed/open/half-open) |
| **Retry Mechanism** | `retry.py` | Exponential backoff with jitter |
| **Service Discovery** | `service_discovery.py` | Dynamic service URL resolution |
| **Cache Manager** | `cache_manager.py` | Multi-layer L1/L2/Redis caching |
| **Health Aggregation** | `health_aggregation.py` | Multi-service health monitoring |
| **Database Health** | `database_health.py` | Connection pool monitoring |
| **Configuration** | `config.py` | Pydantic settings with env vars |

### Security Controls (`services/shared/security/`)

| Component | Purpose |
|-----------|---------|
| **Rate Limiter** | Token bucket rate limiting with Redis |
| **JWT Authenticator** | Access and refresh token management |
| **Authorization Checker** | RBAC permission validation |
| **Data Encryptor** | AES-256 encryption at rest |
| **Input Sanitizer** | SQL injection and XSS prevention |
| **CSRF Protection** | Token-based CSRF validation |
| **Audit Logger** | Security event logging |

### Edge Gateway (`vercel-edge/`)

| Component | File | Purpose |
|-----------|------|---------|
| **HTTP Client** | `app/lib/http-client.ts` | Retry-enabled Railway communication |
| **Service Discovery** | `app/lib/service-discovery.ts` | Railway URL mapping |
| **Cache Wrapper** | `app/lib/cache.ts` | Vercel KV with memory fallback |
| **Circuit Breaker** | `app/lib/circuit-breaker.ts` | Per-service failure protection |
| **Monitoring** | `app/lib/monitoring.ts` | Prometheus-compatible metrics |
| **Alerting** | `app/lib/alerting.ts` | Threshold-based notifications |
| **Analytics** | `app/lib/analytics.ts` | Request tracking and analysis |

### Frontend Application (`frontend/`)

| Directory | Purpose |
|-----------|---------|
| `src/components/` | Reusable UI components |
| `src/pages/` | Application pages and routes |
| `src/services/` | API client and service layer |
| `src/stores/` | State management (React Query) |
| `src/hooks/` | Custom React hooks |
| `src/types/` | TypeScript type definitions |
| `src/utils/` | Utility functions |

---

## 🗄️ Data Architecture

### Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐       │
│  │   users     │   │   cases     │   │  transactions   │       │
│  ├─────────────┤   ├─────────────┤   ├─────────────────┤       │
│  │ id (PK)     │◄──│ assignee_id │   │ id (PK)         │       │
│  │ email       │   │ id (PK)     │◄──│ case_id (FK)    │       │
│  │ password    │   │ title       │   │ amount          │       │
│  │ role        │   │ status      │   │ timestamp       │       │
│  │ created_at  │   │ priority    │   │ risk_score      │       │
│  └─────────────┘   │ created_at  │   └─────────────────┘       │
│                    └─────────────┘                              │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │  case_events   │   │   alerts    │   │   audit_logs    │   │
│  ├─────────────────┤   ├─────────────┤   ├─────────────────┤   │
│  │ id (PK)        │   │ id (PK)     │   │ id (PK)         │   │
│  │ case_id (FK)   │   │ case_id(FK) │   │ user_id (FK)    │   │
│  │ event_type     │   │ severity    │   │ action          │   │
│  │ payload        │   │ message     │   │ resource        │   │
│  │ timestamp      │   │ created_at  │   │ timestamp       │   │
│  └─────────────────┘   └─────────────┘   └─────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Caching Strategy

```
Request Flow:
    Client Request
         │
         ▼
    ┌─────────────┐
    │ L1 Cache    │ ─── Memory (per-instance, 250 entries, <1ms)
    │ (In-Memory) │
    └─────┬───────┘
          │ miss
          ▼
    ┌─────────────┐
    │ L2 Cache    │ ─── Memory (warm data, 750 entries, <5ms)
    │ (In-Memory) │
    └─────┬───────┘
          │ miss
          ▼
    ┌─────────────┐
    │ L3 Cache    │ ─── Redis (distributed, 256MB, <10ms)
    │   (Redis)   │
    └─────┬───────┘
          │ miss
          ▼
    ┌─────────────┐
    │  Database   │ ─── PostgreSQL (source of truth, <50ms)
    │ (PostgreSQL)│
    └─────────────┘
```

### Data Retention Policy

| Data Type | Retention | Archive | Deletion |
|-----------|-----------|---------|----------|
| Case Data | 7 years | Yes | Automatic |
| Audit Logs | 10 years | Yes | Automatic |
| User Sessions | 30 days | No | Automatic |
| Temp Files | 24 hours | No | Automatic |
| Backup Data | 90 days | Yes | Automatic |

---

## ☁️ Infrastructure & Deployment

### Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION DEPLOYMENT                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────────────────────────────────────────────────────────────┐    │
│   │                    VERCEL (Edge Network)                          │    │
│   │  • Global CDN (35+ regions)                                      │    │
│   │  • Edge Functions (< 100ms cold start)                           │    │
│   │  • KV Store (distributed cache)                                   │    │
│   │  • Automatic HTTPS                                                │    │
│   └────────────────────────────┬─────────────────────────────────────┘    │
│                                │                                           │
│                                ▼                                           │
│   ┌──────────────────────────────────────────────────────────────────┐    │
│   │                    RAILWAY (Container Platform)                   │    │
│   │                                                                   │    │
│   │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │    │
│   │   │ Container 1│ │ Container 2│ │ Container 3│ │ Container 4│   │    │
│   │   │ API Gateway│ │ AI/ML Svc  │ │ Fraud+Intel│ │ Workflow   │   │    │
│   │   └────────────┘ └────────────┘ └────────────┘ └────────────┘   │    │
│   │                                                                   │    │
│   │   ┌────────────────────────────────────────────────────────┐    │    │
│   │   │                  MANAGED SERVICES                       │    │    │
│   │   │  PostgreSQL 15  │  Redis 7  │  PGBouncer             │    │    │
│   │   └────────────────────────────────────────────────────────┘    │    │
│   │                                                                   │    │
│   └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
Trigger: Push to main branch
Steps:
  1. Code Checkout
  2. Dependency Installation
  3. Linting & Type Checking
  4. Unit Tests (pytest)
  5. Integration Tests
  6. Security Scan (pip-audit, npm audit)
  7. Build Frontend (Vite)
  8. Build Backend Containers
  9. Deploy to Staging
  10. Integration Tests (staging)
  11. Deploy to Production (requires approval)
  12. Smoke Tests
  13. Rollback on Failure
```

### Environment Configuration

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | `localhost:3000` | Local development |
| Staging | `staging.zenith.dev` | Pre-production testing |
| Production | `app.zenith.dev` | Live system |

---

## 🔒 Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Client    │───▶│   Vercel    │───▶│  API Gateway        │ │
│  │  (Browser)  │    │   Edge      │    │  (Authentication)   │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                │                 │
│                                                ▼                 │
│                          ┌─────────────────────────────────────┐│
│                          │       SECURITY LAYERS               ││
│                          ├─────────────────────────────────────┤│
│                          │ 1. Rate Limiting (per-IP, per-user) ││
│                          │ 2. JWT Token Validation             ││
│                          │ 3. RBAC Permission Check            ││
│                          │ 4. Input Validation/Sanitization    ││
│                          │ 5. CSRF Token Validation            ││
│                          │ 6. Audit Logging                    ││
│                          └─────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### RBAC Permissions

| Role | Permissions |
|------|-------------|
| **Viewer** | Read cases |
| **Analyst** | Read/write cases |
| **Manager** | Read/write/delete cases, read users |
| **Admin** | All permissions |

### Security Controls

| Control | Implementation | Status |
|---------|----------------|--------|
| Rate Limiting | 100 req/min (API), 1000 req/hr (user) | ✅ |
| JWT Authentication | HS256, 30min access, 7d refresh | ✅ |
| RBAC Authorization | Role-based permissions | ✅ |
| CSRF Protection | Double-submit cookie pattern | ✅ |
| Encryption at Rest | AES-256 via Fernet | ✅ |
| Encryption in Transit | TLS 1.3 | ✅ |
| Security Headers | HSTS, CSP, X-Frame-Options | ✅ |
| Audit Logging | All security events | ✅ |
| Input Sanitization | SQL injection, XSS prevention | ✅ |

### Compliance

| Framework | Status | Coverage |
|-----------|--------|----------|
| GDPR | ✅ Compliant | Data export, consent, retention |
| SOC 2 Type II | ✅ Compliant | Access controls, encryption |
| PCI-DSS | ✅ Compliant | Data protection, monitoring |

---

## 🔄 Operational Workflows

### Request Processing Flow

```
User Request → Vercel Edge → Rate Limit Check → Auth Check → Route to Service
                   │
                   ▼
         ┌─────────────────┐
         │ Cache Check     │
         │ (Vercel KV)     │
         └────────┬────────┘
                  │ miss
                  ▼
         ┌─────────────────┐
         │ Railway API GW  │ ─── Circuit Breaker Check
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Target Service  │ ─── Business Logic Execution
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Response Cache  │ ─── Cache Response
         └────────┬────────┘
                  │
                  ▼
              Response
```

### Case Management Workflow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐
│  OPEN   │────▶│ ASSIGNED │────▶│ IN_PROGRESS │────▶│ RESOLVED │
└─────────┘     └──────────┘     └──────────────┘     └──────────┘
                                        │                  │
                                        ▼                  ▼
                                 ┌──────────┐       ┌──────────┐
                                 │ ESCALATED│       │  CLOSED  │
                                 └──────────┘       └──────────┘
```

### Incident Response Workflow

| Phase | Timeline | Actions |
|-------|----------|---------|
| Detection | 0-5 min | Alert triggers, acknowledge |
| Triage | 5-15 min | Assess severity, notify team |
| Response | 15-60 min | Investigate, implement fix |
| Resolution | 1-4 hours | Verify fix, close incident |
| Post-mortem | 24-48 hours | Document learnings |

### Deployment Workflow

```bash
# Standard Deployment
1. Create feature branch
2. Implement changes + tests
3. Create Pull Request
4. Code review (2 approvals)
5. Merge to main
6. Automatic staging deploy
7. Integration tests
8. Production deploy (manual approval)
9. Smoke tests
10. Monitor for 15 minutes

# Rollback (if needed)
railway rollback --service <service> --deployment <previous>
```

---

## 📈 Performance Metrics

### Service Level Objectives (SLOs)

| Metric | Target | Current |
|--------|--------|---------|
| **Availability** | 99.9% | 99.95% |
| **P95 Latency** | < 300ms | 180ms |
| **P99 Latency** | < 500ms | 320ms |
| **Error Rate** | < 0.1% | 0.05% |
| **Cache Hit Rate** | > 80% | 85% |

### Resource Utilization

| Service | Memory Usage | CPU Usage |
|---------|--------------|-----------|
| API Gateway | 280MB / 512MB | 35% |
| AI/ML Service | 1.4GB / 2GB | 65% |
| Fraud+Intel | 520MB / 1GB | 40% |
| Workflow+Reg | 200MB / 512MB | 25% |

### Performance Benchmarks

| Operation | Latency (P95) | Throughput |
|-----------|---------------|------------|
| Auth Login | 45ms | 500 req/s |
| Case Create | 120ms | 200 req/s |
| Case List | 80ms | 1000 req/s |
| Fraud Check | 200ms | 150 req/s |
| AI Analysis | 350ms | 50 req/s |

---

## 💰 Cost Analysis

### Monthly Infrastructure Costs

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Railway (4 containers) | $150-180 | Includes compute |
| Railway GPU Add-on | $30-50 | AI/ML service |
| Railway PostgreSQL | $20-30 | Managed database |
| Railway Redis | $10-15 | Managed cache |
| Vercel Edge | $40-60 | Edge functions + KV |
| **Total** | **$250-335/month** | |

### Cost Optimization Opportunities

| Optimization | Potential Savings |
|--------------|-------------------|
| Right-size containers | $20-40/month |
| Improve cache hit rate | $10-20/month |
| Optimize GPU usage | $10-20/month |
| Reserved capacity | $30-50/month |

---

## 📚 Documentation Index

| Document | Location | Purpose |
|----------|----------|---------|
| Master TODO | `docs/development/master_todo.md` | Task tracking |
| Implementation Plan | `docs/development/IMPLEMENTATION_PLAN.md` | Detailed phases |
| API Documentation | `docs/development/API.md` | Endpoint reference |
| Deployment Guide | `docs/development/deployment.md` | Deployment procedures |
| Service Debugging | `docs/operations/SERVICE_DEBUGGING_GUIDE.md` | Debugging guide |
| Troubleshooting | `docs/operations/TROUBLESHOOTING_GUIDE.md` | Common issues |
| Performance Tuning | `docs/operations/PERFORMANCE_TUNING_GUIDE.md` | Optimization |
| Security Audit | `docs/operations/SECURITY_AUDIT_PROCEDURES.md` | Security checks |
| Disaster Recovery | `docs/operations/DISASTER_RECOVERY_PROCEDURES.md` | DR procedures |
| Monitoring | `docs/operations/MONITORING_OBSERVABILITY_GUIDE.md` | Observability |

---

## 📞 Contacts

| Role | Contact |
|------|---------|
| Platform Team | <platform-eng@zenith.dev> |
| Security Team | <security@zenith.dev> |
| On-Call | PagerDuty (24/7) |
| Support | <support@zenith.dev> |

---

**Document Status:** ✅ Complete  
**Last Review:** 2026-01-08  
**Next Review:** 2026-04-08 (Quarterly)
