# 🚀 Deployment Guide
## 378x492 Fraud Detection Platform - Production Deployment & CI/CD

**Generated:** December 17, 2025
**Purpose:** Complete guide for deploying and maintaining the fraud detection platform

---

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] **Kubernetes Cluster** (v1.24+) with sufficient resources
- [ ] **PostgreSQL Database** (v14+) with 100GB+ storage
- [ ] **Redis Cache** (v6+) with persistence enabled
- [ ] **Domain Name** configured with SSL certificates
- [ ] **SSL Certificates** (Let's Encrypt or commercial)
- [ ] **Storage** for file uploads (S3-compatible, 500GB+)

### Security Prerequisites
- [ ] **Secrets Management** (Kubernetes secrets or external vault)
- [ ] **Database Encryption** keys configured
- [ ] **JWT Secrets** (32+ characters, securely generated)
- [ ] **API Keys** for external services (OpenAI, etc.)
- [ ] **SSH Keys** for deployment access

### Application Configuration
- [ ] **Environment Variables** configured for production
- [ ] **Database Migrations** tested and ready
- [ ] **Static Assets** optimized and minified
- [ ] **Health Checks** implemented and tested

---

## 🚀 Production Deployment

### Automated Deployment
```bash
# Deploy to production Kubernetes
./scripts/deploy-production.sh

# This script performs:
# - Build verification
# - Security scanning
# - Multi-platform packaging
# - Kubernetes deployment
# - Health verification
# - Rollback preparation
```

### Manual Deployment Steps

#### 1. Build Artifacts
```bash
# Build all components
npm run ci:build

# Verify builds
npm run verify:build

# Package for deployment
npm run package
```

#### 2. Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -l app=fraud-detection
kubectl get services -l app=fraud-detection

# Check health endpoints
curl https://your-domain.com/health
curl https://your-domain.com/health/ready
```

#### 3. Database Migration
```bash
# Run database migrations
kubectl exec -it deployment/fraud-detection-backend -- alembic upgrade head

# Verify database connectivity
kubectl exec -it deployment/fraud-detection-backend -- python -c "
from core.database import get_db
db = next(get_db())
db.execute('SELECT 1')
print('Database connection: OK')
"
```

---

## 🔄 CI/CD Pipeline

### Pipeline Overview

| Stage | Purpose | Duration | Tools |
|-------|---------|----------|-------|
| **Security Scan** | Vulnerability detection | 3-5 min | npm audit, Safety, Trivy |
| **Code Quality** | Linting & type checking | 2-3 min | ESLint, mypy, black |
| **Unit Tests** | Component testing | 5-10 min | Jest, pytest |
| **Integration Tests** | API & service testing | 5-8 min | pytest, Playwright |
| **Build** | Multi-platform packaging | 10-15 min | Electron Builder, PyInstaller |
| **E2E Tests** | Full application testing | 3-5 min | Playwright |
| **Release** | GitHub release creation | 1-2 min | GitHub Actions |

### Workflow Configuration

#### Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Security audit
        run: |
          npm audit --audit-level high
          cd backend && safety check
          trivy filesystem .

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm run test:ci

  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - name: Build application
        run: npm run build:electron

  release:
    needs: [security-scan, test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Quality Gates

#### Security Requirements
- [ ] **Zero critical vulnerabilities** in dependencies
- [ ] **Clean security scans** (npm audit, Safety, Trivy)
- [ ] **Code signing** for production releases
- [ ] **Container scanning** for Docker images

#### Code Quality Requirements
- [ ] **ESLint clean** (no errors, warnings within limits)
- [ ] **TypeScript compilation** successful
- [ ] **Python type checking** (mypy strict mode)
- [ ] **Code formatting** (Prettier, Black compliant)

#### Testing Requirements
- [ ] **Unit test coverage** > 80%
- [ ] **Integration tests** passing
- [ ] **E2E tests** successful on all platforms
- [ ] **Performance benchmarks** within limits

---

## 🔒 Security Configuration

### Environment Variables
```bash
# Production environment
ENVIRONMENT=production
DEBUG=false

# Security keys (generate securely)
JWT_SECRET=your-32-character-jwt-secret
ENCRYPTION_KEY=32-character-encryption-key
API_ENCRYPTION_KEY=32-character-api-key

# Database (managed PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/db

# Redis (managed Redis)
REDIS_URL=redis://host:6379/0

# External services
OPENAI_API_KEY=sk-your-production-key
SENTRY_DSN=https://your-sentry-dsn

# CORS (restrict to your domains)
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### SSL/TLS Configuration
```nginx
# Nginx configuration example
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 Monitoring & Observability

### Health Checks
```bash
# Application health
curl https://yourdomain.com/health
curl https://yourdomain.com/health/ready

# Database connectivity
curl https://yourdomain.com/health/database

# External services
curl https://yourdomain.com/health/external
```

### Logging Configuration
```python
# Sentry error tracking
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment="production",
    traces_sample_rate=0.1,
    integrations=[FastApiIntegration()]
)
```

### Metrics Collection
```yaml
# Prometheus configuration
scrape_configs:
  - job_name: 'fraud-detection'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

---

## 🚨 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check build logs
npm run build 2>&1 | head -50

# Clean and rebuild
npm run clean
npm install
npm run ci:build

# Verify Node.js version
node --version
npm --version
```

#### Database Connection Issues
```bash
# Test database connectivity
psql postgresql://user:password@host:5432/db -c "SELECT 1;"

# Check migration status
alembic current

# Reset database (CAUTION)
alembic downgrade base
alembic upgrade head
```

#### Kubernetes Issues
```bash
# Check pod status
kubectl get pods -l app=fraud-detection

# View pod logs
kubectl logs deployment/fraud-detection-backend

# Check services
kubectl get services -l app=fraud-detection

# Debug pod
kubectl exec -it deployment/fraud-detection-backend -- /bin/bash
```

#### SSL Certificate Issues
```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew Let's Encrypt certificates
certbot renew

# Check certificate validity
openssl x509 -in cert.pem -text -noout | grep "Not After"
```

---

## 🔄 Rollback Procedures

### Automated Rollback
```bash
# Rollback to previous release
./scripts/rollback.sh

# Or manually
kubectl rollout undo deployment/fraud-detection-backend
kubectl rollout undo deployment/fraud-detection-frontend
```

### Emergency Rollback Steps
1. **Stop traffic** (if using load balancer)
2. **Scale down current deployment**
   ```bash
   kubectl scale deployment fraud-detection-backend --replicas=0
   ```
3. **Deploy previous version**
   ```bash
   kubectl apply -f k8s/previous-version/
   ```
4. **Verify functionality**
5. **Restore traffic**

---

## 📈 Performance Optimization

### Application Performance
- **Bundle size**: Keep under 100KB gzipped
- **First paint**: < 2 seconds
- **Time to interactive**: < 3 seconds
- **Lighthouse score**: > 90

### Infrastructure Scaling
```yaml
# Horizontal Pod Autoscaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fraud-detection-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fraud-detection-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Optimization
- **Connection pooling**: Use PgBouncer
- **Query optimization**: Monitor slow queries
- **Indexing**: Regular index maintenance
- **Caching**: Redis for session and computed data

---

## 📋 Maintenance Procedures

### Daily Checks
- [ ] Health endpoint responses (200 OK)
- [ ] Error rates (< 1%)
- [ ] Response times (< 2 seconds P95)
- [ ] Database connections (< 90% utilization)
- [ ] Disk space (> 20% free)

### Weekly Maintenance
- [ ] Security updates for dependencies
- [ ] Database vacuum and reindexing
- [ ] Log rotation and archival
- [ ] Backup verification

### Monthly Maintenance
- [ ] Performance benchmarking
- [ ] Security audit and penetration testing
- [ ] Compliance review (GDPR, SOC2)
- [ ] Disaster recovery testing

---

## 📞 Support & Escalation

### Incident Response
1. **Detection**: Monitoring alerts or user reports
2. **Assessment**: Evaluate impact and severity
3. **Communication**: Notify stakeholders
4. **Resolution**: Apply fixes or rollback
5. **Post-mortem**: Document lessons learned

### Support Contacts
- **Development Team**: dev-team@company.com
- **Infrastructure Team**: infra@company.com
- **Security Team**: security@company.com
- **Emergency**: +1-555-0123 (24/7)

---

## 📊 Success Metrics

### Deployment KPIs
- **Deployment Frequency**: Multiple times per day
- **Lead Time**: < 1 hour from commit to production
- **Change Failure Rate**: < 5%
- **Time to Restore**: < 1 hour

### Application KPIs
- **Availability**: 99.9% uptime
- **Performance**: < 2 second response time
- **Security**: Zero critical vulnerabilities
- **User Satisfaction**: > 95% satisfaction score

---

*This deployment guide consolidates CI/CD procedures, security configuration, and operational procedures. Essential deployment steps and security requirements preserved, redundant information combined logically.*