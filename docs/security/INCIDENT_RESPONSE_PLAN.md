# Incident Response Plan

**Version:** 1.0  
**Last Updated:** 2025-12-12  
**Classification:** Confidential

---

## Table of Contents

1. Overview
2. Incident Classification
3. Response Team
4. Response Procedures
5. Communication Plan
6. Post-Incident Review

---

## 1. Overview

This document defines procedures for responding to security incidents affecting the Fraud Detection System.

### Objectives
- Contain and mitigate security incidents quickly
- Preserve evidence for forensic analysis
- Minimize business impact
- Learn from incidents to prevent recurrence

---

## 2. Incident Classification

### P1 - Critical (Response: Immediate)
- **Examples:**
  - Active data breach
  - Unauthorized access to admin accounts
  - Ransomware attack
  - System-wide outage
  - Exposure of customer data
  
- **Response Time:** < 15 minutes
- **Escalation:** Immediate - Notify CTO, CEO, Legal

### P2 - High (Response: < 1 hour)
- **Examples:**
  - Multiple failed admin login attempts
  - Suspected account compromise
  - DDoS attack
  - Malware detection
  
- **Response Time:** < 1 hour
- **Escalation:** Security Lead, Engineering Manager

### P3 - Medium (Response: < 4 hours)
- **Examples:**
  - Unusual API activity
  - Suspicious audit log entries
  - Security scan findings
  
- **Response Time:** < 4 hours
- **Escalation:** Security Team

### P4 - Low (Response: < 24 hours)
- **Examples:**
  - Minor configuration issues
  - Non-critical vulnerabilities
  - Informational alerts
  
- **Response Time:** < 24 hours
- **Escalation:** Security Team Lead

---

## 3. Response Team

### Core Team
- **Incident Commander:** [Name/Role]
- **Security Lead:** [Name/Role]
- **Engineering Lead:** [Name/Role]
- **Legal Counsel:** [Name/Role]
- **Communications:** [Name/Role]

### Contact Information
| Role | Primary Contact | Backup Contact | Phone |
|------|----------------|----------------|-------|
| Security Lead | security@example.com | +1-XXX-XXX-XXXX | |
| Engineering | engineering@example.com | +1-XXX-XXX-XXXX | |
| Legal | legal@example.com | +1-XXX-XXX-XXXX | |

### Escalation Chain
1. Security Engineer (First responder)
2. Security Lead
3. CTO
4. CEO / Board

---

## 4. Response Procedures

### Phase 1: Detection & Assessment (0-15 min)

**Actions:**
1. ✅ Alert received through monitoring system
2. ✅ Initial triage - classify incident (P1-P4)
3. ✅ Page on-call engineer
4. ✅ Create incident ticket
5. ✅ Begin incident log

**Key Questions:**
- What happened?
- When did it start?
- What systems are affected?
- Is customer data at risk?
- Is the attack ongoing?

### Phase 2: Containment (15-30 min)

**Immediate Actions:**
1. ✅ Isolate affected systems
2. ✅ Block malicious IPs
3. ✅ Disable compromised accounts
4. ✅ Take snapshots for forensics
5. ✅ Enable enhanced logging

**For Data Breach:**
```bash
# Immediate containment commands
# 1. Block suspicious IP
sudo iptables -A INPUT -s <IP_ADDRESS> -j DROP

# 2. Disable user account
python manage.py disable_user --user-id <USER_ID>

# 3. Revoke all sessions
python manage.py revoke_all_sessions --user-id <USER_ID>

# 4. snapshot database
pg_dump fraud_db > incident_$(date +%Y%m%d_%H%M%S).sql

# 5. Export audit logs
python scripts/export_audit_logs.py --since "1 hour ago"
```

### Phase 3: Eradication (30 min - 2 hours)

**Actions:**
1. ✅ Identify root cause
2. ✅ Remove malware/backdoors
3. ✅ Patch vulnerabilities
4. ✅ Reset compromised credentials
5. ✅ Review all access logs

**Checklist:**
- [ ] Malware removed?
- [ ] Vulnerabilities patched?
- [ ] All admin passwords reset?
- [ ] API keys rotated?
- [ ] Backdoors closed?

### Phase 4: Recovery (2-24 hours)

**Actions:**
1. ✅ Restore services gradually
2. ✅ Monitor for re-infection
3. ✅ Verify system integrity
4. ✅ Test authentication flows
5. ✅ Enable all security controls

**Validation:**
```bash
# Run security validation
python scripts/security_check.py --comprehensive

# Verify no unauthorized access
python scripts/audit_review.py --suspicious

# Test authentication
pytest tests/security/test_auth.py -v
```

### Phase 5: Post-Incident (24-48 hours)

**Actions:**
1. ✅ Document timeline
2. ✅ Analyze root cause
3. ✅ Identify improvements
4. ✅ Update security controls
5. ✅ Conduct team debrief

---

## 5. Communication Plan

### Internal Communication

**During Incident:**
- Slack channel: `#security-incidents`
- War room: Video call link
- Status updates: Every 30 minutes

**After Incident:**
- Post-mortem: Within 48 hours
- Security briefing: All hands meeting

### External Communication

**Customers:**
- Notification required if data exposed
- Timeline: Within 72 hours of discovery
- Channel: Email + Status page

**Regulators:**
- Notification required for PII breach
- Timeline: As required by law (24-72 hours)
- Contact: Legal team manages

**Press:**
- All inquiries → Communications team
- Approved statement only
- No individual comments

---

## 6. Incident Response Commands

### Quick Reference

**Check for brute force attacks:**
```sql
SELECT ip_address, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'FAILED_LOGIN'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

**Find admin operations:**
```sql
SELECT user_id, action, timestamp, details
FROM audit_logs
WHERE action IN ('DATABASE_OPTIMIZE', 'BACKUP_RESTORE_CRITICAL', 'CACHE_CLEAR_ALL')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

**Export audit logs:**
```bash
python scripts/export_audit_logs.py \
  --since "2025-12-12 00:00:00" \
  --output "incident_logs_$(date +%Y%m%d).json"
```

**Block IP address:**
```bash
# Temporary block
sudo iptables -A INPUT -s <IP> -j DROP

# Permanent block (add to firewall rules)
echo "<IP>" >> /etc/firewall/blocklist.txt
sudo systemctl reload firewall
```

**Disable user account:**
```bash
cd backend
python -c "
from app.services.auth_service import auth_service
auth_service.disable_user('<user_id>', reason='Security incident')
"
```

**Force password reset:**
```bash
cd backend
python scripts/force_password_reset.py --user-id <USER_ID>
```

---

## 7. Post-Incident Review Template

### Incident Summary
- **Date/Time:** 
- **Duration:** 
- **Severity:** P1 / P2 / P3 / P4
- **Systems Affected:** 
- **Data Exposure:** Yes / No

### Timeline
| Time | Event |
|------|-------|
| HH:MM | Incident detected |
| HH:MM | Team notified |
| HH:MM | Containment started |
| HH:MM | Root cause identified |
| HH:MM | Systems restored |
| HH:MM | Incident closed |

### Root Cause Analysis

**What Happened:**
- [Description]

**Why It Happened:**
- [Root cause]

**Contributing Factors:**
- [Factor 1]
- [Factor 2]

### Impact Assessment

**Technical Impact:**
- Systems affected:
- Downtime:
- Data compromise:

**Business Impact:**
- Revenue impact:
- Customer impact:
- Regulatory impact:

### Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Patch vulnerability | Engineering | YYYY-MM-DD | ⏳ |
| Update runbook | Security | YYYY-MM-DD | ⏳ |
| Customer notification | Comms | YYYY-MM-DD | ⏳ |

### Lessons Learned

**What Went Well:**
- [Item 1]
- [Item 2]

**What Could Be Improved:**
- [Item 1]
- [Item 2]

**Prevention Measures:**
- [Measure 1]
- [Measure 2]

---

## 8. Emergency Contacts

### On-Call Rotation
- **Week 1:** [Name] - [Phone]
- **Week 2:** [Name] - [Phone]
- **Week 3:** [Name] - [Phone]
- **Week 4:** [Name] - [Phone]

### External Contacts
- **Cyber Insurance:** [Contact/Policy #]
- **Legal Counsel:** [Contact]
- **PR Firm:** [Contact]
- **Forensics Partner:** [Contact]

---

## 9. Training & Drills

### Required Training
- All engineers: Security awareness (annual)
- Security team: Incident response (quarterly)
- Management: Breach notification (annual)

### Tabletop Exercises
- **Frequency:** Quarterly
- **Scenarios:**
  - Data breach simulation
  - Ransomware attack
  - Insider threat
  - DDoS attack

### Metrics
- Mean Time to Detect (MTTD): Target < 15 min
- Mean Time to Respond (MTTR): Target < 1 hour
- Mean Time to Recovery: Target < 4 hours

---

**Document Owner:** Security Team  
**Review Schedule:** Quarterly  
**Next Review:** 2025-03-12
