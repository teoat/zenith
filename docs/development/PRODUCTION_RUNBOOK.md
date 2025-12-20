# Production Runbook
**Last Updated:** 2025-12-17  
**Owner:** DevOps Team  
**Status:** Production Ready

---

## 🚨 Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **On-Call Engineer** | TBD | +1-XXX-XXX-XXXX | 24/7 |
| **Tech Lead** | TBD | Slack: @tech-lead | Business Hours |
| **DevOps Lead** | TBD | Slack: @devops | 24/7 |
| **Security** | TBD | security@company.com | 24/7 |

---

## 📍 Service URLs

### Production
- **Frontend:** https://fraud-detection.com
- **API:** https://api.fraud-detection.com
- **Admin:** https://admin.fraud-detection.com
- **Grafana:** https://grafana.fraud-detection.com
- **Prometheus:** https://prometheus.fraud-detection.com

### Staging
- **Frontend:** https://staging.fraud-detection.com
- **API:** https://api-staging.fraud-detection.com

---

## 🏥 Health Check Procedures

### Quick Health Check
```bash
# Check all services
./scripts/health-check.sh

# Expected output:
# ✓ Frontend: HTTP 200
# ✓ Backend API: HTTP 200
# ✓ Database: Connected
# ✓ Redis: Connected
```

### Detailed Health Check
```bash
# Backend health with details
curl https://api.fraud-detection.com/monitoring/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "database": {"status": "healthy", "timestamp": "..."},
#     "redis": {"status": "healthy", "timestamp": "..."},
#     "fraud_engine": {"status": "operational"},
#     "evidence_processor": {"status": "operational"}
#   }
# }
```

### Check Kubernetes Pods
```bash
# All pods in namespace
kubectl get pods -n fraud-detection

# Expected: All pods in Running state
# backend-xxxxx        1/1     Running   0          1h
# frontend-xxxxx       1/1     Running   0          1h
# postgres-0           1/1     Running   0          1h
# redis-0              1/1     Running   0          1h
```

---

## 🚀 Deployment Procedures

### Standard Deployment
```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Run deployment script
./scripts/deploy-production.sh

# Script will:
# - Run all tests
# - Build frontend/backend
# - Backup database
# - Run migrations
# - Deploy to K8s
# - Verify health
# - Tag release
```

### Rollback Procedure
```bash
# 1. List recent deployments
kubectl rollout history deployment/backend -n fraud-detection
kubectl rollout history deployment/frontend -n fraud-detection

# 2. Rollback to previous version
kubectl rollout undo deployment/backend -n fraud-detection
kubectl rollout undo deployment/frontend -n fraud-detection

# 3. Verify rollback
kubectl rollout status deployment/backend -n fraud-detection
kubectl rollout status deployment/frontend -n fraud-detection

# 4. Restore database if needed
psql $DATABASE_URL < backups/TIMESTAMP/database_backup.sql
```

---

## 🔥 Incident Response

### Severity Levels

| Level | Response Time | Description |
|-------|---------------|-------------|
| **P0 - Critical** | 15 min | Total service outage |
| **P1 - High** | 1 hour | Major feature broken |
| **P2 - Medium** | 4 hours | Minor feature broken |
| **P3 - Low** | 1 business day | Cosmetic issue |

### P0: Service Down

**Symptoms:**
- Frontend/API returning 5xx errors
- Health checks failing
- Database unreachable

**Procedure:**
```bash
# 1. Check pod status
kubectl get pods -n fraud-detection

# 2. Check pod logs
kubectl logs -f deployment/backend -n fraud-detection --tail=100

# 3. Check resource usage
kubectl top pods -n fraud-detection

# 4. Check recent changes
kubectl rollout history deployment/backend -n fraud-detection

# 5. If needed, rollback
kubectl rollout undo deployment/backend -n fraud-detection

# 6. Scale up if resource exhaustion
kubectl scale deployment/backend --replicas=5 -n fraud-detection
```

### P1: High Error Rate

**Symptoms:**
- Error rate >5% in Grafana
- Alerts firing in Prometheus
- Users reporting issues

**Procedure:**
```bash
# 1. Check error logs
kubectl logs -f deployment/backend -n fraud-detection | grep ERROR

# 2. Check monitoring
curl https://api.fraud-detection.com/monitoring/metrics

# 3. Check alerts
curl https://api.fraud-detection.com/monitoring/alerts

# 4. Identify pattern
# - Specific endpoint?
# - Specific user action?
# - Time-based issue?

# 5. Apply fix or rollback
# If recent change: rollback
# If external issue: scale or patch
```

### P2: Performance Degradation

**Symptoms:**
- Response times >1s
- CPU/Memory high
- Rate limit triggers

**Procedure:**
```bash
# 1. Check resource usage
kubectl top pods -n fraud-detection

# 2. Check HPA status
kubectl get hpa -n fraud-detection

# 3. Manually scale if needed
kubectl scale deployment/backend --replicas=10 -n fraud-detection

# 4. Check slow queries
# Access database and run:
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# 5. Restart if memory leak
kubectl rollout restart deployment/backend -n fraud-detection
```

---

## 🗄️ Database Operations

### Backup Database
```bash
# Manual backup
mkdir -p backups/manual_$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/manual_$(date +%Y%m%d_%H%M%S)/backup.sql

# Verify backup
ls -lh backups/manual_*/backup.sql
```

### Restore Database
```bash
# ⚠️ DESTRUCTIVE OPERATION - CREATES DOWNTIME

# 1. Enable maintenance mode
kubectl scale deployment/backend --replicas=0 -n fraud-detection

# 2. Restore from backup
psql $DATABASE_URL < backups/TIMESTAMP/backup.sql

# 3. Run migrations
cd backend && alembic upgrade head

# 4. Disable maintenance mode
kubectl scale deployment/backend --replicas=3 -n fraud-detection

# 5. Verify
./scripts/health-check.sh
```

### Run Migrations
```bash
# Check current version
cd backend && alembic current

# Show pending migrations
alembic history

# Upgrade to latest
alembic upgrade head

# Rollback one version
alembic downgrade -1
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Watch

1. **Request Rate**
   - Normal: 100-500 req/s
   - Alert: >1000 req/s or <10 req/s

2. **Error Rate**
   - Normal: <1%
   - Alert: >5%

3. **Response Time**
   - Normal: <200ms (p50), <500ms (p95)
   - Alert: >1s (p95)

4. **CPU Usage**
   - Normal: 30-60%
   - Alert: >80%

5. **Memory Usage**
   - Normal: 40-70%
   - Alert: >85%

### Access Grafana
```bash
# Open Grafana dashboard
open https://grafana.fraud-detection.com

# Default dashboards:
# - System Overview
# - API Performance
# - Fraud Detection Metrics
# - Database Performance
```

### Check Prometheus Alerts
```bash
# Active alerts
curl https://prometheus.fraud-detection.com/api/v1/alerts | jq

# Alert rules
kubectl get prometheusrules -n monitoring
```

---

## 🔒 Security Incidents

### Suspected Data Breach
1. **Immediately notify security team**
2. **Preserve logs:**
   ```bash
   kubectl logs deployment/backend -n fraud-detection --since=24h > incident_logs.txt
   ```
3. **Enable audit mode (if available)**
4. **Follow company security incident protocol**

### DDoS Attack
```bash
# 1. Check rate limiting
curl https://api.fraud-detection.com/monitoring/metrics | grep rate_limit

# 2. Increase rate limits temporarily
kubectl edit configmap app-config -n fraud-detection

# 3. Block IPs at ingress level
kubectl edit ingress app-ingress -n fraud-detection

# 4. Scale up to handle load
kubectl scale deployment/backend --replicas=20 -n fraud-detection
```

---

## 🛠️ Common Tasks

### View Logs
```bash
# Backend logs (last 100 lines)
kubectl logs -f deployment/backend -n fraud-detection --tail=100

# Frontend logs
kubectl logs -f deployment/frontend -n fraud-detection --tail=100

# Database logs
kubectl logs -f postgres-0 -n fraud-detection --tail=100

# All logs from last hour
kubectl logs deployment/backend -n fraud-detection --since=1h
```

### Execute Commands in Pod
```bash
# Open shell in backend pod
kubectl exec -it deployment/backend -n fraud-detection -- /bin/bash

# Run Python shell
kubectl exec -it deployment/backend -n fraud-detection -- python

# Run database query
kubectl exec -it postgres-0 -n fraud-detection -- psql -U postgres
```

### Update Secrets
```bash
# Edit secrets
kubectl edit secret app-secrets -n fraud-detection

# Restart pods to pick up new secrets
kubectl rollout restart deployment/backend -n fraud-detection
kubectl rollout restart deployment/frontend -n fraud-detection
```

### Scale Services
```bash
# Manual scaling
kubectl scale deployment/backend --replicas=5 -n fraud-detection

# Check current replicas
kubectl get deployment backend -n fraud-detection

# Auto-scaling status
kubectl get hpa -n fraud-detection
```

---

## 📞 Escalation Path

1. **On-Call Engineer** (15 min response)
   - First responder for all incidents
   - Can perform standard procedures
   - Escalates if unresolved in 30 min

2. **Tech Lead** (1 hour response)
   - Complex technical issues
   - Architecture decisions
   - Can approve risky changes

3. **DevOps Lead** (1 hour response)
   - Infrastructure issues
   - K8s/database problems
   - Can modify production infra

4. **CTO** (2 hour response)
   - Major incidents
   - Business-critical decisions
   - External communications

---

## ✅ Post-Incident Checklist

After resolving any incident:

- [ ] Verify all services healthy
- [ ] Document incident in post-mortem template
- [ ] Update runbook with learnings
- [ ] Schedule post-mortem meeting
- [ ] Update monitoring/alerts if gaps found
- [ ] Communicate resolution to stakeholders

---

**Last Reviewed:** 2025-12-17  
**Next Review:** 2025-01-17 (Monthly)  
**Version:** 1.0
