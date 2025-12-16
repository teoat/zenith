# Security Audit Plan - Simple378 Fraud Detection System

## 🎯 Audit Objectives

Systematically identify, assess, and remediate security vulnerabilities across the entire fraud detection system stack. Focus on data protection, authentication/authorization, compliance, and threat prevention.

---

## 🔍 Audit Scope

### In-Scope Systems
- ✅ Backend API (FastAPI)
- ✅ Frontend Application (React + Electron)
- ✅ Database Layer (PostgreSQL + pgvector)
- ✅ Authentication System (JWT, OAuth)
- ✅ File Storage & Evidence Management
- ✅ IPC Communication (Electron main ↔ renderer)
- ✅ Third-Party Integrations (OCR, AI services)
- ✅ Infrastructure (Docker, deployment scripts)

### Out-of-Scope
- ❌ Cloud provider infrastructure (AWS/Azure/GCP)
- ❌ Network hardware and physical security
- ❌ End-user device security

---

## 📋 Security Assessment Checklist

### 1. Authentication & Authorization

#### 1.1 Password Security
- [ ] Password complexity requirements enforced (min 12 chars, uppercase, lowercase, numbers, symbols)
- [ ] Passwords hashed using Argon2id with appropriate parameters
- [ ] Password reset flow secure (time-limited tokens, email verification)
- [ ] Account lockout after N failed login attempts
- [ ] Password history prevents reuse of last N passwords
- [ ] Secure password storage (never logged or transmitted unencrypted)

**Test Commands**:
```bash
# Test weak password rejection
curl -X POST http://localhost:8000/auth/register \
  -d '{"email":"test@example.com", "password":"weak"}'
# Expected: 400 Bad Request

# Test Argon2 parameters
python -c "from app.core.security import verify_password; print(verify_password.__doc__)"
```

#### 1.2 JWT Token Management
- [ ] Access tokens expire within 15 minutes
- [ ] Refresh tokens expire within 7 days
- [ ] Tokens use RS256 or HS256 with strong secret
- [ ] Token blacklist/revocation mechanism exists
- [ ] No sensitive data in JWT payload
- [ ] CSRF protection for cookie-based tokens
- [ ] Tokens validated on every request

**Audit Script**:
```python
# tests/security/test_jwt_security.py
def test_jwt_expiration():
    token = create_access_token(user_id=1)
    # Fast-forward time
    with freeze_time(datetime.now() + timedelta(minutes=20)):
        with pytest.raises(JWTExpiredError):
            verify_token(token)
```

#### 1.3 Role-Based Access Control (RBAC)
- [ ] Roles defined: Admin, Analyst, Viewer, Auditor
- [ ] Principle of least privilege enforced
- [ ] Authorization checks on all protected endpoints
- [ ] Horizontal privilege escalation prevented
- [ ] Vertical privilege escalation prevented
- [ ] API endpoints return 403 Forbidden for unauthorized access

**Test Matrix**:
| Endpoint | Admin | Analyst | Viewer | Auditor | Anonymous |
|----------|-------|---------|--------|---------|-----------|
| GET /cases | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /cases | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE /cases | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /admin/users | ✅ | ❌ | ❌ | ✅ | ❌ |

#### 1.4 Multi-Factor Authentication (MFA)
- [ ] MFA available for high-privilege accounts
- [ ] TOTP (Time-based One-Time Password) support
- [ ] Backup codes generated and securely stored
- [ ] MFA enforcement for admin roles
- [ ] Recovery mechanism if MFA device lost

---

### 2. Input Validation & Sanitization

#### 2.1 SQL Injection Prevention
- [ ] All database queries use parameterized statements
- [ ] No raw SQL string concatenation
- [ ] ORM (SQLAlchemy) used correctly
- [ ] Database user has minimal privileges
- [ ] Input validation on all user-provided data

**Vulnerability Test**:
```python
# Attempt SQL injection
payload = "1' OR '1'='1'; DROP TABLE users; --"
response = client.get(f"/api/v1/cases?search={payload}")
assert response.status_code == 400  # Should be rejected
```

#### 2.2 XSS (Cross-Site Scripting) Prevention
- [ ] All user input sanitized before rendering
- [ ] Content Security Policy (CSP) header configured
- [ ] React auto-escaping utilized (no `dangerouslySetInnerHTML` without sanitization)
- [ ] DOMPurify or similar library used for rich text
- [ ] X-XSS-Protection header set

**CSP Configuration**:
```python
# backend/main.py
app.add_middleware(SecurityHeadersMiddleware,
    csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
)
```

#### 2.3 Command Injection Prevention
- [ ] No system commands executed with user input
- [ ] If shell commands necessary, use subprocess with argument lists
- [ ] Input whitelist validation for file paths
- [ ] File upload restrictions (type, size, content)

#### 2.4 Path Traversal Prevention
- [ ] File paths validated and canonicalized
- [ ] User cannot access files outside allowed directories
- [ ] No `../` sequences accepted in file paths
- [ ] Absolute paths resolved and validated

**Test**:
```bash
# Attempt path traversal
curl "http://localhost:8000/api/v1/evidence/../../../../etc/passwd"
# Expected: 403 Forbidden or 404 Not Found
```

#### 2.5 API Input Validation
- [ ] Request size limits enforced (max 10MB by default)
- [ ] Content-Type validation
- [ ] Schema validation using Pydantic
- [ ] Rate limiting on all endpoints
- [ ] Reject unexpected query parameters

---

### 3. Data Protection

#### 3.1 Encryption at Rest
- [ ] Database encryption enabled (PostgreSQL transparent data encryption)
- [ ] File storage encrypted (AES-256)
- [ ] Application secrets encrypted in environment files
- [ ] Encryption keys stored securely (not in source code)
- [ ] Key rotation policy documented

**Verification**:
```bash
# Check database encryption
psql -c "SHOW data_encryption;"

# Check file encryption
file /var/lib/378x492/evidence/evidence_001.pdf
# Should show encrypted or binary data
```

#### 3.2 Encryption in Transit
- [ ] TLS/SSL enabled for all HTTP traffic
- [ ] Minimum TLS 1.2, prefer TLS 1.3
- [ ] Strong cipher suites configured
- [ ] HSTS (HTTP Strict Transport Security) header set
- [ ] Certificate validation enforced
- [ ] No self-signed certificates in production

**Test**:
```bash
# Check TLS configuration
nmap --script ssl-enum-ciphers -p 443 api.example.com

# Check HSTS header
curl -I https://api.example.com | grep Strict-Transport-Security
```

#### 3.3 Sensitive Data Handling
- [ ] PII (Personally Identifiable Information) identified and protected
- [ ] Sensitive data masked in logs
- [ ] Credit card numbers never stored (PCI-DSS compliance)
- [ ] Social Security Numbers encrypted if stored
- [ ] Data minimization: only collect necessary data

**Log Sanitization**:
```python
# core/logging.py
def sanitize_log_data(data: dict) -> dict:
    sensitive_fields = ['password', 'ssn', 'credit_card', 'token']
    return {
        k: '***REDACTED***' if k in sensitive_fields else v
        for k, v in data.items()
    }
```

#### 3.4 Backup Security
- [ ] Backups encrypted at rest
- [ ] Backup access restricted to authorized personnel
- [ ] Backup retention policy enforced (30 days)
- [ ] Backup restoration tested quarterly
- [ ] Backups stored in geographically separate location

---

### 4. Session Management

#### 4.1 Session Security
- [ ] Session tokens cryptographically random
- [ ] Session tokens transmitted over HTTPS only
- [ ] HttpOnly flag set on session cookies
- [ ] Secure flag set on session cookies
- [ ] SameSite attribute configured (Strict or Lax)
- [ ] Session timeout after 30 minutes of inactivity
- [ ] Logout invalidates session server-side

#### 4.2 Session Fixation Prevention
- [ ] New session ID generated after login
- [ ] Old session ID invalidated
- [ ] Session ID not accepted from URL parameters

---

### 5. API Security

#### 5.1 Rate Limiting
- [ ] Rate limiting implemented on all endpoints
- [ ] Different limits for authenticated vs anonymous users
- [ ] Exponential backoff for repeated failures
- [ ] Rate limit headers returned (X-RateLimit-Limit, X-RateLimit-Remaining)

**Configuration**:
```python
# Auth endpoints: 5 requests/minute
# Public endpoints: 60 requests/minute
# Authenticated endpoints: 600 requests/minute
limiter.limit("5/minute")(login_endpoint)
limiter.limit("60/minute")(public_endpoint)
limiter.limit("600/minute")(authenticated_endpoint)
```

#### 5.2 CORS (Cross-Origin Resource Sharing)
- [ ] CORS restricted to specific origins
- [ ] Wildcard (*) not used in production
- [ ] Credentials allowed only for trusted origins
- [ ] Preflight requests validated

**Configuration**:
```python
app.add_middleware(CORSMiddleware,
    allow_origins=["https://app.example.com"],  # Not "*"
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"]
)
```

#### 5.3 API Versioning & Deprecation
- [ ] API versioned (v1, v2, etc.)
- [ ] Deprecated endpoints return warnings
- [ ] Sunset header used for deprecations
- [ ] Breaking changes require new version

#### 5.4 Error Handling
- [ ] Error messages don't leak sensitive information
- [ ] Stack traces not exposed in production
- [ ] Generic error messages for authentication failures
- [ ] Detailed errors logged server-side only

---

### 6. Dependency Security

#### 6.1 Dependency Scanning
- [ ] Automated vulnerability scanning (npm audit, pip-audit, Snyk)
- [ ] Dependencies pinned to specific versions
- [ ] Regular dependency updates scheduled
- [ ] No known critical vulnerabilities

**Scan Commands**:
```bash
# Backend (Python)
pip-audit
safety check
bandit -r app/

# Frontend (JavaScript)
npm audit
npm audit fix
npx snyk test
```

#### 6.2 Supply Chain Security
- [ ] Dependencies from trusted sources only (PyPI, npm)
- [ ] Package integrity verified (checksums, signatures)
- [ ] Lockfiles committed (package-lock.json, poetry.lock)
- [ ] Minimal dependencies (remove unused packages)

---

### 7. Electron Security

#### 7.1 Context Isolation
- [ ] `contextIsolation: true` enabled
- [ ] `nodeIntegration: false` in renderer
- [ ] Preload scripts used for IPC
- [ ] Remote module disabled

**Configuration Check**:
```javascript
// electron/main.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,    // ✅
    nodeIntegration: false,    // ✅
    enableRemoteModule: false, // ✅
    preload: path.join(__dirname, 'preload.js')
  }
});
```

#### 7.2 IPC Security
- [ ] IPC messages validated and sanitized
- [ ] IPC handlers use allow-list approach
- [ ] No arbitrary code execution via IPC
- [ ] Event origin validated

#### 7.3 Content Security
- [ ] External content loaded over HTTPS only
- [ ] `webSecurity` not disabled
- [ ] `allowRunningInsecureContent` disabled
- [ ] Navigation restricted to allowed domains

---

### 8. Compliance & Privacy

#### 8.1 GDPR Compliance
- [ ] Privacy policy displayed
- [ ] Consent tracking implemented
- [ ] Data subject rights supported (access, deletion, portability)
- [ ] Data processing agreements in place
- [ ] Data breach notification procedure documented
- [ ] Data retention limits enforced

**Endpoints**:
```
GET  /api/v1/privacy/data-export       # User data export
POST /api/v1/privacy/delete-account    # Right to be forgotten
GET  /api/v1/privacy/consent           # Consent management
```

#### 8.2 Audit Logging
- [ ] All security events logged (login, logout, access failures)
- [ ] Logs include timestamp, user ID, IP address, action
- [ ] Logs immutable (append-only)
- [ ] Log retention policy enforced (90 days)
- [ ] Logs monitored for suspicious activity

**Critical Events to Log**:
- Authentication success/failure
- Authorization failures
- Data access (view, create, update, delete)
- Configuration changes
- Privilege escalations
- Account creations/deletions

#### 8.3 SOX Compliance (Financial Data)
- [ ] Audit trail for all financial transactions
- [ ] Change history preserved
- [ ] Segregation of duties enforced
- [ ] Regular access reviews conducted

---

## 🛠️ Security Testing Tools

### Static Application Security Testing (SAST)
```bash
# Python
bandit -r app/ -ll                    # Code security issues
semgrep --config=auto app/            # Pattern-based scanning

# JavaScript
eslint --plugin security              # JavaScript security linting
```

### Dynamic Application Security Testing (DAST)
```bash
# OWASP ZAP
zap-cli quick-scan http://localhost:8000
zap-cli active-scan http://localhost:8000

# Burp Suite
# Manual testing for complex workflows
```

### Dependency Scanning
```bash
# Python
pip-audit                             # PyPI vulnerabilities
safety check --json                   # Safety DB check

# JavaScript
npm audit --production                # npm vulnerabilities
npx snyk test                         # Snyk vulnerability DB
```

### Secrets Scanning
```bash
# Trufflehog (scan git history)
trufflehog filesystem . --json

# GitGuardian
ggshield secret scan path .
```

### Infrastructure Scanning
```bash
# Docker image scanning
trivy image 378x492/backend:latest
docker scan 378x492/backend:latest

# Infrastructure as Code
checkov -d .
tfsec .
```

---

## 📊 Security Metrics & KPIs

### Vulnerability Metrics
- **Critical Vulnerabilities**: 0 (must fix immediately)
- **High Vulnerabilities**: < 5 (fix within 1 week)
- **Medium Vulnerabilities**: < 20 (fix within 1 month)
- **Low Vulnerabilities**: < 50 (triaged and prioritized)

### Security Incident Metrics
- **Mean Time to Detect (MTTD)**: < 1 hour
- **Mean Time to Respond (MTTR)**: < 4 hours
- **False Positive Rate**: < 10%

### Compliance Metrics
- **Audit Log Completeness**: 100%
- **Required Security Controls**: 100% implemented
- **Security Training Completion**: 100% of team

---

## 🗓️ Audit Schedule

### Weekly
- [ ] Automated dependency scans
- [ ] Review security logs for anomalies
- [ ] Check for new CVEs affecting dependencies

### Monthly
- [ ] Manual code review of security-critical modules
- [ ] Penetration testing of new features
- [ ] Access control audit
- [ ] Review and update security documentation

### Quarterly
- [ ] Full security audit (all 8 categories)
- [ ] Third-party penetration testing
- [ ] Disaster recovery drill
- [ ] Security awareness training

### Annually
- [ ] Comprehensive security assessment
- [ ] External security audit/certification
- [ ] Update threat model
- [ ] Review and update security policies

---

## 🚨 Incident Response Plan

### 1. Detection
- Monitor alerts from security tools
- Log analysis for suspicious patterns
- User reports of security issues

### 2. Triage
- Assess severity (Critical, High, Medium, Low)
- Identify affected systems and data
- Determine impact on users

### 3. Containment
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IP addresses

### 4. Eradication
- Remove malware or unauthorized access
- Patch vulnerabilities
- Update security controls

### 5. Recovery
- Restore from clean backups
- Verify system integrity
- Monitor for reinfection

### 6. Post-Incident
- Document lessons learned
- Update security controls
- Notify affected parties if required

---

## ✅ Security Audit Execution Phases

### Phase 1 (Week 1): Critical Security Fixes
- [ ] Fix all critical vulnerabilities (CF.3, CF.6)
- [ ] Implement input validation middleware
- [ ] Enable TLS/SSL
- [ ] Configure security headers

### Phase 2 (Week 2): Authentication & Authorization
- [ ] Audit JWT implementation
- [ ] Test RBAC enforcement
- [ ] Implement MFA
- [ ] Test session management

### Phase 3 (Week 3): Data Protection
- [ ] Verify encryption at rest
- [ ] Test encryption in transit
- [ ] Implement log sanitization
- [ ] Secure backup procedures

### Phase 4 (Week 4): Comprehensive Testing
- [ ] Run SAST/DAST tools
- [ ] Penetration testing
- [ ] Compliance validation
- [ ] Document findings

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [GDPR Guidelines](https://gdpr.eu/)
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
