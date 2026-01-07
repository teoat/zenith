# 🏗 Track 1: Phase 1 - Railway Container Setup (Weeks 1-12)

**Owner:** Agent 1
**Focus:** Foundation and containerization
**Status:** ⚠️ Blocked on Track 2 and 3 (waiting on TypeScript fixes)

---

## 📋 Week 1-2: Foundation Preparation

### Tasks
- [ ] Set up Railway project and billing
- [ ] Configure Railway domains for services
- [ ] Provision PostgreSQL managed service
- [ ] Provision Redis managed service
- [ ] Enable GPU add-on for AI/ML service
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Create monitoring and observability stack
- [ ] Prepare database migration scripts

**Dependencies:** Track 2 (Railway infrastructure) + Track 3 (TypeScript fixes)

---

## 📋 Week 3-4: API Gateway Container

### Tasks
- [ ] Extract 60 core router files from monolith to services/api-gateway/app/routers/
- [ ] Extract 12 middleware layers from monolith to services/api-gateway/app/middleware/
- [ ] Implement app/utils/http_client.py for Railway communication
- [ ] Implement app/utils/config.py for service discovery
- [ ] Implement shared database service configuration
- [ ] Create 512MB Dockerfile for API Gateway container
- [ ] Create railway.json configuration
- [ ] Implement health check endpoints
- [ ] Deploy to Railway and verify

**Files to Create:**
```
services/api-gateway/
├── Dockerfile
├── requirements-api-gateway.txt
├── railway.json
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routers/ (60 files)
│   ├── middleware/ (12 files)
│   ├── services/ (lightweight services)
│   └── utils/ (http_client, config)
```

---

## 🤖 Week 5-6: AI/ML Service Container (with GPU)

### Tasks
- [ ] Extract 21 AI/ML service files from monolith to services/ai-ml-service/app/
- [ ] Extract 2 AI router files to services/ai-ml-service/app/routers/
- [ ] Implement app/models/vector_store.py (FAISS index)
- [ ] Implement app/models/fraud_models.py (XGBoost, LightGBM)
- [ ] Implement app/models/nlp_models.py (Transformers)
- [ ] Implement app/services/ai_service.py with GPU support
- [ ] Implement app/services/embeddings_service.py
- [ ] Create persistent volume /data/models for ML models
- [ ] Create 2GB+ Dockerfile with GPU support
- [ ] Create railway.json with GPU enabled
- [ ] Implement model loading and caching
- [ ] Deploy to Railway with GPU add-on
- [ ] Verify GPU allocation and ML inference

**Files to Create:**
```
services/ai-ml-service/
├── Dockerfile (GPU support)
├── requirements-ai-ml.txt
├── railway.json (GPU enabled)
├── app/
│   ├── main.py
│   ├── routers/ (2 AI routers)
│   ├── services/ (21 AI service files)
│   ├── models/ (ML models)
│   ├── ml/ (ML utilities)
│   ├── inference_engine.py
│   ├── model_cache.py
│   ├── gpu_manager.py
│   └── utils/
├── data/models/ (persistent volume)
```

---

## 🔍 Week 7-8: Fraud + Intelligence Service Container

### Tasks
- [ ] Extract 8 fraud service files from monolith to services/fraud-intel-service/app/
- [ ] Extract 4 intelligence service files from monolith to services/fraud-intel-service/app/
- [ ] Extract 21 fraud + intelligence service files to services/fraud-intel-service/app/
- [ ] Implement app/services/graph_service.py (NetworkX)
- [ ] Implement app/services/evidence_service.py
- [ ] Implement app/services/forensic_intelligence.py
- [ ] Create combined 1GB container
- [ ] Deploy to Railway and verify

**Files to Create:**
```
services/fraud-intel-service/
├── Dockerfile
├── requirements-fraud-intel.txt
├── railway.json
├── app/
│   ├── main.py
│   ├── routers/ (4 routers)
│   ├── services/ (42 service files)
│   ├── models/ (transaction, alert, graph)
│   └── utils/
```

---

## 📊 Week 9-10: Workflow + Regulatory Service Container

### Tasks
- [ ] Extract 8 workflow service files from monolith to services/workflow-regulatory-service/app/
- [ ] Extract 7 regulatory service files from monolith to services/workflow-regulatory-service/app/
- [ ] Extract 57 workflow + regulatory service files to services/workflow-regulatory-service/app/
- [ ] Implement workflow engine and automated resolution
- [ ] Implement diagnostic orchestrator
- [ ] Implement compliance reporting
- [ ] Create 512MB container
- [ ] Deploy to Railway and verify

**Files to Create:**
```
services/workflow-regulatory-service/
├── Dockerfile
├── requirements-workflow-regulatory.txt
├── railway.json
├── app/
│   ├── main.py
│   ├── routers/ (4 routers)
│   ├── services/ (57 service files)
│   ├── models/ (case, task, compliance)
│   └── utils/
```

---

## 🗃️ Week 6: Database Pooling Optimization

### Tasks
- [ ] Set up PostgreSQL managed service
- [ ] Configure PGBouncer connection pooler
- [ ] Implement shared pool configuration (20-50 connections)
- [ ] Set up Redis managed service
- [ ] Implement cache manager (multi-layer: L1 memory, L2 Redis)
- [ ] Create docker-compose.yml for shared infrastructure
- [ ] Deploy PostgreSQL + PGBouncer + Redis stack
- [ ] Verify connection pooling and cache hit rates

**Files to Create:**
```
railway/docker-compose.yml
├── PostgreSQL (managed)
├── PGBouncer (connection pooler)
├── Redis (cache + event bus)
```

---

## 🔗 Week 7-8: Inter-Service Communication & Testing

### Tasks
- [ ] Implement HTTP client in all containers (app/utils/http_client.py)
- [ ] Add service discovery mechanism (app/utils/config.py)
- [ ] Implement circuit breaker pattern
- [ ] Implement request/response caching (Redis)
- [ ] Add retry with exponential backoff
- [ ] Implement distributed tracing
- [ ] Comprehensive testing of all services
- [ ] Load testing (1000+ requests/second)

**Files to Create:**
```
services/api-gateway/app/utils/
├── http_client.py (already created, reuse across containers)
├── config.py (service discovery config)
```

---

**Dependencies:** Waiting on Track 1 and Track 3 completion

---

## 🎯 Status

### **Progress**
- Foundation Preparation: 0% (blocked on TypeScript fixes)
- API Gateway Container: 0% (waiting on Track 1)
- AI/ML Service: 0% (waiting on Track 1)
- Fraud+Intel Service: 0% (waiting on Track 1)
- Workflow+Reg Service: 0% (waiting on Track 1)
- Database Pooling: 0% (waiting on Track 1)
- Communication: 0% (waiting on Track 1)
- Testing: 0% (waiting on Track 1)

### **Blockers**
- **TypeScript compilation errors** (200+ frontend files) - BLOCKING ALL PROGRESS
- **Missing type declarations** - Cannot create containers without fixing

---

**Waiting on:** Track 2 (TypeScript fixes) and Track 3 (foundation setup)
