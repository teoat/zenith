# 🎯 **4-Container Migration & Vercel Edge Integration Plan**

**Selected Strategy:** Option 1.C (4 Railway Containers + Phase 2 Vercel Edge Gateway)
**Timeline:** 12 weeks total (Phase 1: 8 weeks, Phase 2: 4 weeks)
**Risk Level:** Medium (2 platforms, more complexity than single platform)
**Success Criteria:** Service isolation, GPU support, independent scaling, global edge network

---

## 📋 **Executive Summary**

### **Architecture Transformation**
```
Current: 1 Monolith (3GB+, single process)
     ↓
Phase 1: 4 Railway Containers (4GB total, service isolation)
     ↓
Phase 2: Vercel Edge Gateway + Railway Integration (global edge)
```

### **Key Benefits Achieved**
- ✅ **Service Isolation**: One service crash = one container down, not full system outage
- ✅ **Independent Scaling**: AI service can scale without affecting API gateway
- ✅ **GPU Support**: AI/ML service with NVIDIA GPU on Railway
- ✅ **Hot Reload**: 30-60s per service vs 30-60s full system
- ✅ **Global Edge Network**: Vercel Edge for low-latency API routing
- ✅ **Balanced Complexity**: 4 containers manageable vs 60+ individual containers
- ✅ **Database Optimization**: Shared PGBouncer pool with 20-50 connections
- ✅ **Cost Control**: Railway containers + Vercel pay-per-execution API

---

## 🗂️ **Phase 1: Railway Container Setup (Weeks 1-8)**

### **Week 1: API Gateway Container**

#### **Tasks:**
- [ ] Extract and refactor 12 core routers from monolith
- [ ] Extract 12 middleware layers from monolith  
- [ ] Create service architecture (`services/api-gateway/`)
- [ ] Implement HTTP client for Railway communication
- [ ] Create shared database service configuration
- [ ] Implement health check endpoints
- [ ] Create 512MB container with FastAPI only

#### **Files to Create:**
```
services/api-gateway/
├── Dockerfile
├── requirements-api-gateway.txt
├── railway.json
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routers/ (12 files)
│   ├── middleware/ (12 files)
│   ├── services/ (lightweight services)
│   └── utils/ (http_client, config)
├── tests/
└── .dockerignore
```

#### **Deliverable:**
- ✅ API Gateway container deployed to Railway
- ✅ 12 core routers operational
- ✅ Database connection via shared PGBouncer pool
- ✅ Health checks operational

---

### **Week 2: AI/ML Service Container (Weeks 2-4)**

#### **Tasks:**
- [ ] Extract 21 AI/ML service files from monolith
- [ ] Extract 2 AI router files
- [ ] Set up GPU support (Railway GPU add-on)
- [ ] Implement model loading and caching
- [ ] Create persistent volume for ML models (`/data/models`)
- [ ] Implement FAISS vector store
- [ ] Set up 2GB+ memory allocation
- [ ] Create embeddings and semantic search endpoints

#### **Files to Create:**
```
services/ai-ml-service/
├── Dockerfile (with GPU support)
├── requirements-ai-ml.txt
├── railway.json (GPU enabled)
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routers/ (2 AI routers)
│   ├── services/ (21 AI service files)
│   ├── models/ (ML models)
│   ├── ml/ (ML utilities)
│   └── utils/ (http_client, config)
├── data/models/ (persistent volume)
├── tests/
└── .dockerignore
```

#### **Deliverable:**
- ✅ AI/ML service deployed with GPU support
- ✅ ML models loaded and cached
- ✅ Embeddings service operational
- ✅ Semantic search with FAISS working
- ✅ 2GB+ memory allocation verified

---

### **Week 3: Fraud + Intelligence Service Container (Weeks 3-4)**

#### **Tasks:**
- [ ] Extract 8 fraud service files from monolith
- [ ] Extract 4 intelligence service files from monolith
- [ ] Extract 21 fraud + intelligence service files
- [ ] Combine into single 1GB container
- [ ] Implement graph analysis with NetworkX
- [ ] Implement evidence processing
- [ ] Set up forensic intelligence capabilities

#### **Files to Create:**
```
services/fraud-intel-service/
├── Dockerfile
├── requirements-fraud-intel.txt
├── railway.json
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routers/ (4 routers)
│   ├── services/ (42 service files)
│   ├── models/ (transaction, alert, graph)
│   └── utils/ (http_client, config)
├── tests/
└── .dockerignore
```

#### **Deliverable:**
- ✅ Fraud detection service deployed
- ✅ Intelligence analysis service deployed
- ✅ Graph analysis operational
- ✅ Evidence processing working
- ✅ 1GB memory allocation verified

---

### **Week 4: Workflow + Regulatory Service Container (Weeks 5-6)**

#### **Tasks:**
- [ ] Extract 8 workflow service files from monolith
- [ ] Extract 7 regulatory service files from monolith
- [ ] Combine into single 512MB container
- [ ] Implement case workflow engine
- [ ] Implement automated resolution system
- [ ] Set up compliance reporting
- [ ] Create diagnostic orchestrator

#### **Files to Create:**
```
services/workflow-regulatory-service/
├── Dockerfile
├── requirements-workflow-regulatory.txt
├── railway.json
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routers/ (4 routers)
│   ├── services/ (57 service files)
│   ├── models/ (case, task, compliance)
│   └── utils/ (http_client, config)
├── tests/
└── .dockerignore
```

#### **Deliverable:**
- ✅ Workflow engine deployed
- ✅ Case management system working
- ✅ Compliance reporting operational
- ✅ Diagnostic orchestrator functional
- ✅ 512MB memory allocation verified

---

### **Week 5: Database Pool Optimization (Weeks 6-8)**

#### **Tasks:**
- [ ] Set up PostgreSQL managed service
- [ ] Configure PGBouncer connection pooler
- [ ] Implement shared pool (20-50 connections)
- [ ] Configure per-service connection pools
- [ ] Set up Redis for caching and events
- [ ] Optimize database queries
- [ ] Implement database health monitoring

#### **Infrastructure:**
```yaml
# railway/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: zenith
      POSTGRES_DB: zenith_production
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zenith -d zenith_production"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    depends_on:
      - postgres
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: zenith
      DATABASES_PASSWORD: ${POSTGRES_PASSWORD}
      PGBOUNCER_LISTEN_PORT: 6432
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 50
      PGBOUNCER_DEFAULT_POOL_SIZE: 20
      PGBOUNCER_RESERVE_POOL_SIZE: 10
      PGBOUNCER_POOL_TIMEOUT: 120
    ports:
      - "6432:6432"
    healthcheck:
      test: ["CMD-SHELL", "pgbouncer --ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

#### **Deliverable:**
- ✅ PostgreSQL managed service deployed
- ✅ PGBouncer connection pooler operational
- ✅ Redis cache and event bus working
- ✅ Database optimization implemented
- ✅ Health monitoring for all database services

---

### **Week 6-8: Inter-Service Communication & Testing (Weeks 7-8)**

#### **Tasks:**
- [ ] Implement HTTP client for Railway communication
- [ ] Add service discovery mechanism
- [ ] Implement circuit breaker pattern
- [ ] Set up request/response caching
- [ ] Implement retry with exponential backoff
- [ ] Add distributed tracing
- [ ] Comprehensive testing of all services

#### **Communication Pattern:**
```python
# HTTP Communication with Caching
class RailwayHTTPClient:
    async def call_service(service_name, endpoint, payload, timeout=10.0):
        # Check local cache first
        cache_key = f"{service_name}:{endpoint}:{hash(str(payload))}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        # Call Railway service
        result = await self.http_post(
            f"http://{service_name}:800{self._get_service_port(service_name)}{endpoint}",
            payload,
            timeout=timeout
        )
        
        # Cache result for 5 minutes
        await cache.set(cache_key, result, ttl=300)
        return result
    
    async def health_check_service(service_name):
        # Health check with caching
        cache_key = f"health:{service_name}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        health = await self.http_get(f"http://{service_name}:800{self._get_service_port(service_name)}/health")
        await cache.set(cache_key, health, ttl=60)
        return health
```

#### **Deliverable:**
- ✅ HTTP communication between all containers working
- ✅ Service discovery mechanism operational
- ✅ Circuit breaker pattern implemented
- ✅ Request/response caching reducing latency
- ✅ Retry mechanisms with exponential backoff
- ✅ Distributed tracing working
- ✅ All services tested and validated

---

## 🌐 **Phase 2: Vercel Edge Integration (Weeks 9-12)**

### **Week 9: Vercel Edge Infrastructure Setup**

#### **Tasks:**
- [ ] Create Vercel Edge project structure
- [ ] Set up TypeScript configuration
- [ ] Implement edge gateway functions
- [ ] Configure Vercel KV cache
- [ ] Set up service discovery
- [ ] Create deployment pipeline

#### **Vercel Project Structure:**
```
vercel-edge/
├── api/
│   └── gateway/
│       ├── route.ts (main gateway logic)
│       ├── auth/
│       │   └── route.ts
│       ├── search/
│       │   └── route.ts
│       └── health/
│           └── route.ts
├── lib/
│   ├── http-client.ts
│   ├── service-discovery.ts
│   ├── cache.ts (Vercel KV)
│   └── config.ts
├── vercel.json
├── package.json
└── tsconfig.json
```

#### **Vercel Configuration:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "hkg1"],
  "functions": {
    "api/gateway/route.ts": {
      "maxDuration": 10
    }
  },
  "env": {
    "RAILWAY_AI_ML_URL": "@railway_ai_ml_url",
    "RAILWAY_FRAUD_INTEL_URL": "@railway_fraud_intel_url", 
    "RAILWAY_WORKFLOW_REG_URL": "@railway_workflow_reg_url"
  }
}
```

#### **Deliverable:**
- ✅ Vercel Edge project created
- ✅ TypeScript configuration working
- ✅ Edge gateway functions deployed
- ✅ Vercel KV cache configured
- ✅ Service discovery to Railway configured

---

### **Week 10: Edge Gateway Implementation (Weeks 9-10)**

#### **Tasks:**
- [ ] Implement main gateway routing logic
- [ ] Add request/response caching
- [ ] Implement rate limiting (edge-native)
- [ ] Add CORS and security headers
- [ ] Implement health check endpoints
- [ ] Add performance monitoring

#### **Edge Gateway Features:**
```typescript
// Global edge routing with Railway fallback
export default async function handler(req: NextRequest) {
  const startTime = Date.now();
  
  // Determine routing strategy
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const resource = pathParts[2]; // 'ai', 'fraud', 'workflow', etc.
  const endpoint = '/' + pathParts.slice(3).join('/');
  
  // Lightweight services handled by edge
  const lightweightServices = ['auth', 'search', 'health'];
  if (lightweightServices.includes(resource)) {
    return await handleEdgeService(req, resource, endpoint);
  }
  
  // Heavy services forwarded to Railway
  const railwayUrl = getServiceUrl(resource);
  return await forwardToRailway(railwayUrl, endpoint, req);
}
```

#### **Deliverable:**
- ✅ Edge gateway routing implemented
- ✅ Request/response caching operational
- ✅ Rate limiting working (1000 requests/minute)
- ✅ Health endpoints operational
- ✅ Performance monitoring working

---

### **Week 11: Railway Integration & Testing (Weeks 10-12)**

#### **Tasks:**
- [ ] Connect Vercel Edge to Railway containers
- [ ] Test HTTP communication between platforms
- [ ] Implement error handling and fallbacks
- [ ] Add distributed tracing
- [ ] Perform load testing
- [ ] Optimize performance

#### **Integration Pattern:**
```typescript
// Optimized Railway communication
async function callRailwayService(
  url: string, 
  endpoint: string, 
  payload: any
) {
  const cacheKey = `${endpoint}:${hash(JSON.stringify(payload))}`;
  
  // Check Vercel KV cache first
  const cached = await kv.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Call Railway service with timeout
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Vercel-Edge/1.0'
    },
    body: JSON.stringify(payload),
    timeout: 10000 // 10s
  });
  
  if (!response.ok) {
    throw new Error(`Railway service error: ${response.status}`);
  }
  
  const result = await response.json();
  
  // Cache result for 5 minutes
  await kv.set(cacheKey, result, { expirationTtl: 300 });
  
  return result;
}
```

#### **Deliverable:**
- ✅ Vercel-Railway integration working
- ✅ HTTP communication optimized
- ✅ Cross-platform tracing implemented
- ✅ Error handling and fallbacks working
- ✅ Load testing completed (1000+ requests/second)
- ✅ Performance optimized (P95 < 300ms)

---

## 📊 **Resource Requirements**

### **Railway Containers**

| Container | Memory | CPU | GPU | Storage | Monthly Cost |
|-----------|--------|------|-----|-----------|
| API Gateway | 512MB | 0.5 vCPU | No | $20 |
| AI/ML | 2GB+ | 2 vCPU | Yes | $80 (GPU) |
| Fraud+Intel | 1GB | 1 vCPU | No | $40 |
| Workflow+Reg | 512MB | 0.5 vCPU | No | $20 |
| **Total** | **4GB** | **4 vCPU** | **1 GPU** | **$160/month** |

### **Vercel Edge Functions**

| Function | Memory | CPU | Execution | Monthly Cost |
|----------|--------|------|------------|----------|
| Gateway | 50MB | Edge | 10s | Pay-per-execution |
| Auth | 50MB | Edge | 5s | Pay-per-execution |
| Search | 50MB | Edge | 5s | Pay-per-execution |
| Health | 50MB | Edge | 2s | Pay-per-execution |
| **Total** | **200MB** | **Edge** | **Variable** | **~$50-100/month** |

### **Total Monthly Estimate: $210-260/month**

---

## 🔍 **Risk Mitigation Strategies**

### **Phase 1 Risks**
| Risk | Probability | Impact | Mitigation |
|-------|-------------|---------|------------|
| **Database connection exhaustion** | Medium | High | Shared PGBouncer pool (20-50 connections) |
| **Container inter-service latency** | Medium | Medium | HTTP optimization + caching |
| **Hot reload service impact** | Low | Medium | Individual container restarts (30-60s) |
| **GPU service cost overruns** | Medium | High | Railway cost alerts + limits |
| **Complexity (4 containers)** | Medium | Medium | Start with 4 containers (not 10+) |
| **Service discovery failures** | Low | Medium | Fallback mechanisms + health checks |

### **Phase 2 Risks**
| Risk | Probability | Impact | Mitigation |
|-------|-------------|---------|------------|
| **Vercel-Railway communication** | Medium | Medium | Retry with exponential backoff |
| **Edge function cold starts** | High | Medium | Vercel KV cache + pre-warming |
| **Cross-platform debugging** | Medium | Medium | Distributed tracing + logs |
| **Configuration management** | Low | Medium | Environment variables + secrets management |
| **Cost overruns on both platforms** | Medium | High | Budget alerts + monitoring |
| **Performance regression** | Medium | Medium | Performance monitoring + canary deployments |

---

## ✅ **Success Criteria**

### **Technical Metrics**
- [ ] Service Isolation: 100% (4 independent containers)
- [ ] Hot Reload Time: 30-60s per service (target met)
- [ ] API Response Time: P95 < 300ms (target met)
- [ ] Database Connection Pool: 20-50 connections (target met)
- [ ] GPU Support: 1 GPU-enabled service (target met)
- [ ] Memory Footprint: 4GB total (target met)
- [ ] Global Edge Network: Vercel Edge operational (target met)
- [ ] Cost Control: Predictable container costs + API pay-per-execution (target met)

### **Business Metrics**
- [ ] Availability: 99.9% (service isolation)
- [ ] Scalability: Independent scaling per service
- [ ] Development Velocity: Parallel container development
- [ ] Operational Complexity: Manageable (4 containers vs 60+ individual services)
- [ ] Cost Efficiency: Optimized hybrid model

---

## 🚀 **Deployment Readiness Checklist**

### **Before Phase 1 Start:**
- [ ] Railway account setup and billing verified
- [ ] PostgreSQL managed service provisioned
- [ ] Redis managed service provisioned
- [ ] GPU addon enabled for AI/ML service
- [ ] Domain names configured for all services
- [ ] CI/CD pipeline set up for all containers
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Security scanning pipeline setup
- [ ] Documentation templates prepared
- [ ] Rollback procedures defined
- [ ] Performance baseline established
- [ ] Team training on container architecture completed

### **Before Phase 2 Start:**
- [ ] All Railway containers stable for 1+ weeks
- [ ] Inter-service communication tested and verified
- [ ] Database pooling optimized and monitored
- [ ] Hot reload procedures tested and documented
- [ ] Vercel Edge project created and configured
- [ ] Edge functions tested locally
- [ ] Service discovery mechanism implemented
- [ ] Cross-platform tracing setup
- [ ] Error handling and fallbacks tested
- [ ] Performance benchmarks established
- [ ] Load testing scenarios defined
- [ ] Canary deployment procedures prepared

---

## 📚 **Next Steps**

### **Immediate Actions (This Week):**
1. Set up Railway account and configure billing
2. Provision PostgreSQL and Redis managed services
3. Enable GPU addon for AI/ML service
4. Create `services/api-gateway/` directory structure
5. Begin extracting core routers from monolith
6. Set up CI/CD pipeline for container deployment
7. Create monitoring and alerting configuration
8. Prepare team training materials

### **Documentation Requirements:**
1. Architecture decision records and rationale
2. Service API documentation for each container
3. Deployment procedures and troubleshooting guides
4. Performance benchmarks and optimization guides
5. Security configuration and audit procedures
6. Cost optimization and budget management

---

**This plan transforms your monolithic 3GB+ application into a scalable, isolated 4-container architecture with global edge networking, achieving both service isolation and GPU support while maintaining predictable costs.**