# 🛠️ Developer Guide
## 378x492 Fraud Detection Platform - Complete Development Reference

**Generated:** December 17, 2025
**Covers:** Setup, Development, Testing, Deployment, Operations

---

## 🚀 Quick Start

### Automated Setup
```bash
./scripts/start-local.sh
```
Starts complete environment: backend (port 8000), frontend (port 5173), database, all configured.

### Manual Setup

#### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cat > .env << EOF
DATABASE_URL=sqlite:///./fraud_detection.db
JWT_SECRET=dev-secret-key
OPENAI_API_KEY=your-key
ENVIRONMENT=development
EOF
alembic upgrade head
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
EOF
npm run dev
```

---

## 🏗️ Development Workflow

### Daily Development
1. **Pull changes:** `git pull`
2. **Make changes** to code
3. **Run tests:** `npm run test:all`
4. **Check quality:** `npm run lint`
5. **Commit:** `git commit -m "feat: description"`

### Code Quality
```bash
# Backend
mypy app/ core/ --strict
black app/ core/
flake8 app/ core/

# Frontend
npm run lint
npm run type-check
```

---

## 🧪 Testing Strategy

### Test Types
- **Unit Tests:** Component and function testing
- **Integration Tests:** API and service testing
- **E2E Tests:** Full user journey testing

### Running Tests
```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test

# All tests
npm run test:all
```

### Coverage Requirements
- **Unit tests:** 80%+ coverage
- **Integration tests:** All critical paths
- **E2E tests:** Core user workflows

---

## 🚀 Deployment

### Production Deployment
```bash
./scripts/deploy-production.sh
```

### CI/CD Pipeline
- **Security scanning:** npm audit, Safety, Trivy
- **Code quality:** ESLint, mypy, black
- **Testing:** Unit, integration, E2E
- **Building:** Multi-platform (macOS, Windows, Linux)
- **Releasing:** Automated GitHub releases

### Environment Configuration
```bash
# Production variables
ENVIRONMENT=production
DATABASE_URL=postgresql://...
JWT_SECRET=prod-secret
REDIS_URL=redis://...
SENTRY_DSN=https://...
```

---

## 📊 System Health & Monitoring

### Health Endpoints
- **Basic:** `/health`
- **Readiness:** `/health/ready`
- **Detailed:** `/health/detailed` (admin only)

### Monitoring
- **Error tracking:** Sentry integration
- **Metrics:** Prometheus-compatible endpoints
- **Logging:** Structured JSON logs
- **Performance:** Response time tracking

### Database Optimization
- **60+ indexes** on query fields
- **Composite indexes** for complex queries
- **Query optimization** with EXPLAIN analysis
- **Connection pooling** for scalability

---

## 🔧 Troubleshooting

### Common Issues

#### Backend
```bash
# Test imports
python -c "from backend.main import app; print('OK')"

# Check database
alembic current

# Reset database
rm fraud_detection.db && alembic upgrade head
```

#### Frontend
```bash
# Clear cache
rm -rf node_modules package-lock.json && npm install

# Check environment
cat .env
```

#### Deployment
```bash
# Check pod status
kubectl get pods

# View logs
kubectl logs deployment/app

# Restart deployment
kubectl rollout restart deployment/app
```

---

## 📚 API Reference

### Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

### Core Endpoints

#### Cases
```http
GET /cases                    # List cases
POST /cases                   # Create case
GET /cases/{id}              # Get case details
PUT /cases/{id}              # Update case
```

#### Evidence
```http
POST /cases/{id}/evidence     # Upload evidence
GET /cases/{id}/evidence      # List evidence
```

#### Fraud Analysis
```http
POST /fraud/analyze           # Analyze transaction
GET /analytics/dashboard      # Get metrics
```

### Rate Limits
- **Anonymous:** 100 requests/minute
- **Authenticated:** 1000 requests/minute
- **Admin:** 5000 requests/minute

---

## 🏛️ Architecture Overview

### System Components
- **Frontend:** React/TypeScript + Electron
- **Backend:** FastAPI/Python + SQLAlchemy
- **Database:** SQLite/PostgreSQL with encryption
- **AI/ML:** Integrated fraud detection models
- **Security:** JWT auth, encryption, audit logging

### Data Flow
```
User → Frontend → API → Services → Database
                   ↓
              AI Models → Analysis → Results
```

### Security Layers
- **Transport:** TLS 1.3 encryption
- **Authentication:** JWT with refresh tokens
- **Authorization:** Role-based access control
- **Data:** SQLCipher encryption at rest
- **Audit:** Comprehensive event logging

---

## 🎯 Current Roadmap

### Immediate Priorities (Weeks 1-4)
1. **Fix critical test failures** blocking production
2. **Optimize Mapbox GL bundle** (1.6MB → ~200KB)
3. **Resolve React anti-patterns** (setState in useEffect)
4. **Implement TypeScript strict mode**
5. **Add accessibility compliance** (WCAG AA)

### Medium-term Goals (Months 1-3)
1. **Database read replicas** for scaling
2. **Redis caching cluster** deployment
3. **Service consolidation** (25+ → 6-8 services)
4. **API gateway implementation**

### Long-term Vision (Months 3-12)
1. **Multi-region deployment**
2. **Advanced AI features** (federated learning)
3. **Microservices migration**
4. **Industry-leading fraud prevention**

---

## 📞 Support

### Resources
- **Health checks:** `/health`, `/health/ready`
- **API docs:** `/docs` (Swagger UI)
- **Logs:** `logs/backend.log`, `logs/frontend.log`
- **Metrics:** `/metrics` (admin only)

### Getting Help
- **Check this guide** first
- **Review troubleshooting** section
- **Check recent commits** for changes
- **Contact team** for complex issues

---

*Ultra-minimal developer guide consolidating all essential development information. Everything else archived for reference.*