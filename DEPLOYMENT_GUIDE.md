# Zenith Fraud Detection Platform - Deployment Guide

## 🚀 Production Deployment Checklist

This guide provides a comprehensive checklist for deploying the Zenith platform to production environments.

---

## 📋 Pre-Deployment Preparation

### 1. Environment Configuration ✅
- [x] Generate production encryption keys
- [x] Set up environment-specific variables
- [x] Configure database connection strings
- [x] Set up Redis/cache connections
- [x] Configure external API keys (if used)

**Validation Command:**
```bash
cd backend && python scripts/validate_environment.py
```

### 2. Security Hardening ✅
- [x] Security vulnerabilities fixed (MD5→SHA256, SQL injection prevention, secure temp files)
- [x] Encryption keys properly configured
- [x] HTTPS certificates installed
- [x] Firewall rules configured
- [x] SSH access restricted

### 3. Database Setup ✅
- [x] Database server configured and secured
- [x] Encryption keys set for field encryption
- [x] Migration scripts tested
- [x] Backup procedures in place
- [x] Connection pooling configured

### 4. Application Testing ✅
- [x] Unit tests created and passing
- [x] Integration tests for security features
- [x] Performance benchmarks established
- [x] Load testing completed

---

## 🏗️ Deployment Steps

### Step 1: Infrastructure Setup

#### Docker Deployment (Recommended)
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  zenith-backend:
    image: zenith/backend:latest
    environment:
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - FIELD_ENCRYPTION_KEY=${FIELD_ENCRYPTION_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "8000:8000"
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  zenith-frontend:
    image: zenith/frontend:latest
    ports:
      - "80:80"
    depends_on:
      - zenith-backend
    restart: unless-stopped

  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=zenith
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
```

#### Manual Deployment
```bash
# Backend deployment
cd backend
pip install -r requirements.txt
export ENVIRONMENT=production
export SECRET_KEY="your-production-secret"
export FIELD_ENCRYPTION_KEY="your-fernet-key"
export DATABASE_URL="postgresql://..."
python -m uvicorn app.factory:create_app --host 0.0.0.0 --port 8000

# Frontend deployment
cd frontend
npm run build
npm run preview --host 0.0.0.0 --port 80
```

### Step 2: Database Migration
```bash
# Run database migrations
cd backend
alembic upgrade head

# Validate migration success
python -c "from core.database import engine; print('Migration successful')"
```

### Step 3: Security Configuration
```bash
# Generate and validate keys
python scripts/generate_secure_keys.py

# Validate environment
python scripts/validate_environment.py

# Run security scan
bandit -r backend/ -f json -o security-report.json
```

### Step 4: Monitoring Setup
```bash
# Start monitoring dashboard
python -c "
from app.middleware.performance_monitor import performance_tracker
print('Monitoring enabled')
"

# Configure log aggregation
# - Set up ELK stack or similar
# - Configure log shipping
# - Set up alerts for security events
```

---

## 🔍 Post-Deployment Validation

### Health Checks
```bash
# Application health
curl -f https://your-domain.com/health

# Database connectivity
curl -f https://your-domain.com/health/database

# Authentication test
curl -X POST https://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Security Validation
```bash
# Security scan
bandit -r backend/ -f txt | grep -E "(HIGH|MEDIUM)"

# Dependency audit
cd frontend && npm audit --audit-level high

# SSL certificate check
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Performance Validation
```bash
# Load testing
ab -n 1000 -c 10 https://your-domain.com/health

# Memory usage check
ps aux | grep python

# Database connection count
# Check database monitoring tools
```

---

## 📊 Monitoring & Maintenance

### Key Metrics to Monitor
- **Application Metrics:**
  - Response time (target: <500ms)
  - Error rate (target: <1%)
  - Throughput (requests/second)

- **Security Metrics:**
  - Failed login attempts
  - Suspicious activity alerts
  - Encryption key usage

- **System Metrics:**
  - CPU usage (target: <70%)
  - Memory usage (target: <80%)
  - Database connections

### Automated Monitoring Setup
```python
# monitoring/alerts.py
from app.middleware.performance_monitor import performance_tracker

def check_system_health():
    metrics = performance_tracker.get_metrics_summary()

    alerts = []
    if metrics['error_rate'] > 5.0:
        alerts.append("High error rate detected")
    if metrics['average_response_time'] > 2000:
        alerts.append("Slow response times detected")

    return alerts
```

### Log Aggregation
```yaml
# logging.yml
version: 1
handlers:
  file:
    class: logging.FileHandler
    filename: /var/log/zenith/app.log
    formatter: json
  security:
    class: logging.FileHandler
    filename: /var/log/zenith/security.log
    formatter: json
    filters: [security_filter]
```

---

## 🚨 Incident Response

### Security Incident Procedure
1. **Immediate Actions:**
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify security team

2. **Investigation:**
   - Review security logs
   - Check for data breaches
   - Analyze attack vectors

3. **Recovery:**
   - Rotate encryption keys
   - Update security patches
   - Restore from clean backups

### Performance Incident Procedure
1. **Detection:** Monitor alerts trigger
2. **Diagnosis:** Check system metrics
3. **Mitigation:** Scale resources or optimize code
4. **Resolution:** Deploy fixes and validate

---

## 🔄 Update Procedures

### Application Updates
```bash
# Blue-green deployment
# 1. Deploy to staging environment
# 2. Run full test suite
# 3. Run performance benchmarks
# 4. Deploy to production with rollback plan
# 5. Monitor for 24 hours
# 6. Switch traffic if successful
```

### Security Updates
```bash
# Emergency security patch
# 1. Assess vulnerability severity
# 2. Prepare patch in staging
# 3. Schedule maintenance window
# 4. Deploy patch with monitoring
# 5. Validate security improvements
```

---

## 📞 Support & Troubleshooting

### Common Issues

#### Database Connection Failures
```bash
# Check database connectivity
python -c "
import psycopg2
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
print('Database connected successfully')
"
```

#### High Memory Usage
```bash
# Check memory usage
ps aux --sort=-%mem | head -10

# Check for memory leaks
python -c "
import tracemalloc
tracemalloc.start()
# Run some operations
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)
"
```

#### Slow Performance
```bash
# Profile application
python -m cProfile -s time app/main.py

# Check database query performance
# Enable SQL query logging in config
```

### Support Contacts
- **Technical Issues:** DevOps team
- **Security Issues:** Security team (immediate response)
- **Performance Issues:** SRE team
- **Business Issues:** Product team

---

## 🎯 Success Criteria

### Deployment Success Metrics
- [ ] All health checks passing (200 status)
- [ ] Authentication working correctly
- [ ] Database operations functional
- [ ] Security scans clean (no HIGH issues)
- [ ] Performance within acceptable ranges
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested

### Ongoing Maintenance
- [ ] Daily security scans
- [ ] Weekly performance reviews
- [ ] Monthly security assessments
- [ ] Quarterly penetration testing
- [ ] Regular dependency updates

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Environment Configuration](./ENVIRONMENT_CONFIGURATION.md)
- [Monitoring Dashboard](./monitoring_dashboard.html)
- [Security Best Practices](./SECURITY_GUIDELINES.md)

---

**Deployment completed successfully when all validation checks pass and monitoring systems show normal operation.** 🎉

*Document Version: 1.0*
*Last Updated: January 2026*