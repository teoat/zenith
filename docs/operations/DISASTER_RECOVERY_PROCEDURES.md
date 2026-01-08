# 🔄 Disaster Recovery Procedures

**Version:** 1.0.0  |  **Updated:** 2026-01-08

---

## Recovery Objectives

| Metric | Target | Current |
|--------|--------|---------|
| RTO (Recovery Time Objective) | 30 min | 25 min |
| RPO (Recovery Point Objective) | 5 min | 5 min |
| Data Backup Frequency | Every 5 min | ✅ |
| Backup Retention | 30 days | ✅ |

---

## Backup Strategy

### Database Backups

```bash
# Automated PostgreSQL backups (Railway managed)
# - Continuous WAL archiving
# - Point-in-time recovery available
# - Snapshots every 5 minutes

# Manual backup
pg_dump -h postgres.railway.internal -U zenith zenith_db > backup.sql
```

### Redis Backups

```bash
# Automated RDB snapshots
# - Every 5 minutes
# - Retained for 7 days

# Manual backup
redis-cli -h redis.railway.internal BGSAVE
```

### Application State

```bash
# Container images tagged and stored
# - Every deployment
# - Last 10 versions retained
railway deployments --service <service> --limit 10
```

---

## Recovery Procedures

### Scenario 1: Single Service Failure

```bash
# 1. Identify failed service
railway status --all

# 2. Restart service
railway restart --service <service>

# 3. If restart fails, rollback
railway rollback --service <service> --deployment <last-good>

# 4. Verify recovery
curl http://<service>.railway.internal:8000/health
```

### Scenario 2: Database Failure

```bash
# 1. Check database status
railway status --service postgres

# 2. Use Railway's automatic recovery
# (Railway manages PostgreSQL failover automatically)

# 3. If needed, restore from backup
railway db restore --service postgres --time "2026-01-08T03:00:00Z"

# 4. Verify data integrity
psql -h postgres.railway.internal -c "SELECT COUNT(*) FROM cases"
```

### Scenario 3: Complete Infrastructure Failure

```bash
# 1. Verify Railway status page
# https://status.railway.app

# 2. If Railway is down, activate backup region
# (Requires multi-region setup)

# 3. Once Railway is back:
railway restart --all

# 4. Run integrity checks
./scripts/verify_system_integrity.sh
```

### Scenario 4: Data Corruption

```bash
# 1. Stop affected services
railway scale --service <service> --replicas 0

# 2. Identify corruption point
railway logs --service <service> --since 1h

# 3. Restore database to point before corruption
railway db restore --service postgres --time "YYYY-MM-DDTHH:MM:SSZ"

# 4. Restart services
railway scale --service <service> --replicas 1

# 5. Verify data
./scripts/verify_data_integrity.sh
```

---

## DR Drills

### Monthly Drill Checklist

- [ ] Test backup restoration
- [ ] Verify RTO is met
- [ ] Test service failover
- [ ] Validate monitoring alerts
- [ ] Review runbook accuracy

### Drill Procedure

```bash
# 1. Announce drill
echo "DR DRILL STARTING" | slack-notify --channel #engineering

# 2. Simulate failure
railway scale --service api-gateway --replicas 0

# 3. Execute recovery
railway scale --service api-gateway --replicas 1

# 4. Verify recovery
curl http://api-gateway.railway.internal:8000/health

# 5. Document results
echo "DR DRILL COMPLETE. RTO: Xm, Target: 30m" | slack-notify --channel #incidents
```

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Primary On-call | PagerDuty | 24/7 |
| Platform Lead | [contact] | Business hours |
| VP Engineering | [contact] | SEV1 only |
| Railway Support | <support@railway.app> | 24/7 |

---

## Recovery Runbook

### Pre-Recovery

1. Assess incident severity
2. Notify stakeholders
3. Assemble response team
4. Document start time

### During Recovery

1. Follow scenario-specific procedure
2. Document all actions taken
3. Test each recovery step
4. Monitor system health

### Post-Recovery

1. Verify all services healthy
2. Confirm data integrity
3. Notify stakeholders of resolution
4. Schedule post-mortem

---

**Contact:** <incidents@zenith.dev>
