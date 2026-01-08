# 🚑 Incident Response Procedures

**Version:** 1.0.0  |  **Updated:** 2026-01-08

---

## Incident Lifecycle

```
Detection → Triage → Response → Resolution → Post-mortem
```

---

## Severity Definitions

| Severity | Impact | Response Time | Examples |
|----------|--------|---------------|----------|
| SEV1 | Complete outage | 15 min | All services down |
| SEV2 | Major feature broken | 30 min | Auth system failing |
| SEV3 | Minor degradation | 2 hours | Slow performance |
| SEV4 | Cosmetic/low impact | 24 hours | UI bugs |

---

## Response Process

### 1. Detection

- Automated alert fires
- User report received
- Monitoring anomaly detected

### 2. Triage (First 5 minutes)

```
1. Acknowledge alert
2. Assess severity level
3. Notify #incidents channel
4. Page additional responders if SEV1/SEV2
```

### 3. Communication Template

```
🚨 INCIDENT: [Brief description]
⏰ Started: [Time]
📊 Severity: [SEV1-4]
🎯 Impact: [What's affected]
👤 IC: [Incident Commander]
📍 Status: Investigating
```

### 4. Investigation

```bash
# Quick health check
for svc in api-gateway ai-ml-service fraud-intel-service workflow-regulatory; do
    echo "$svc: $(curl -s http://$svc.railway.internal:8000/health | jq -r '.status')"
done

# Check recent logs
railway logs --service <service> --since 15m | grep -i error

# Check recent deployments
railway deployments --service <service> --limit 5
```

### 5. Resolution Options

- **Rollback**: `railway rollback --service <service> --deployment <id>`
- **Restart**: `railway restart --service <service>`
- **Scale**: `railway scale --service <service> --replicas 3`
- **Hotfix**: Emergency deploy with expedited review

### 6. Closure

```
✅ RESOLVED: [Brief description]
⏱️ Duration: [X minutes]
🔧 Resolution: [What fixed it]
📋 Post-mortem: [Link]
```

---

## Roles

| Role | Responsibility |
|------|----------------|
| Incident Commander | Coordinates response |
| Technical Lead | Drives investigation |
| Communications | Updates stakeholders |
| Scribe | Documents timeline |

---

## Post-mortem Template

```markdown
# Incident Post-mortem: [Title]

**Date:** [Date]
**Duration:** [X minutes]
**Severity:** [SEV1-4]
**Author:** [Name]

## Summary
[1-2 sentence summary]

## Timeline
- HH:MM - [Event]

## Root Cause
[What caused the incident]

## Impact
- [Impact 1]

## Action Items
- [ ] [Action] - Owner - Due Date

## Lessons Learned
- [Lesson 1]
```

---

**Contact:** <incidents@zenith.dev>
