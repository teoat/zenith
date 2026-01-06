# Security Documentation (Canonical)

> **Resides at:** `docs/security/SECURITY_FULL.md`
> **Consolidates:** `docs/security/SECURITY_GUIDE.md`, `docs/security/AUDIT_PLAN.md`, `docs/developer/security.md`
> **Status:** Active / Canonical Source of Truth
> **Last Updated:** 2025-12-10

This document is the **single source of truth** for security architecture, implementation details, compliance, incident response, and audit procedures.

---

## 🔐 Table of Contents

1. [Security Architecture Overview](#1-security-architecture-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Data Protection & Encryption](#3-data-protection--encryption)
4. [Network & Application Security](#4-network--application-security)
5. [Session Management](#5-session-management)
6. [Security Operations (Monitoring & Auditing)](#6-security-operations-monitoring--auditing)
7. [Compliance & Privacy](#7-compliance--privacy)
8. [Incident Response](#8-incident-response)
9. [Security Testing & Audit Plan](#9-security-testing--audit-plan)

---

## 1. Security Architecture Overview

### Defense in Depth Strategy

The Simple378 Fraud Detection platform implements a **defense-in-depth** security architecture with multiple layers of protection:

```mermaid
graph TD
    subgraph "Application Layer"
        UI[React/Electron UI]
        Session[Session Manager]
    end
    subgraph "Security Layer"
        IPC[Secure IPC (HMAC)]
        Auth[Auth System (Argon2/JWT)]
    end
    subgraph "Data Layer"
        DB[(SQLCipher DB)]
        File[Encrypted File Storage]
    end
    UI --> IPC
    IPC --> Auth
    Auth --> DB
    Auth --> File
```

### Security Pillars
1. **Confidentiality**: Data is encrypted at rest (AES-256) and in transit (TLS 1.3).
2. **Integrity**: HMAC signatures prevent tampering of IPC messages and critical data.
3. **Availability**: Rate limiting and DoS protection.
4. **Accountability**: Comprehensive audit logging of all sensitive actions.
5. **Non-repudiation**: Cryptographic evidence of actions.
6. **Least Privilege**: Zero-trust architecture with strict role-based access.

---

## 2. Authentication & Authorization

### Multi-Factor Authentication (MFA)
- **Primary**: Master password with PBKDF2 key derivation (100,000 iterations).
- **Secondary**: Biometric authentication support (Windows Hello, Touch ID).
- **Session**: Secure tokens with rotation.

**Implementation Example:**
```python
# MFA configuration and validation
from fido2.server import Fido2Server
from fido2.webauthn import PublicKeyCredentialRpEntity

class MFAService:
    def __init__(self):
        self.rp = PublicKeyCredentialRpEntity(name="Simple378", id="api.Zenith.com")
        self.server = Fido2Server(self.rp)
    # ... (See Implementation Details in Codebase)
```

### Password Security Strategy
- **Hashing**: Argon2id or PBKDF2 with high iteration counts.
- **Complexity**: Min 12 chars, mixed case, numbers, symbols.
- **Validation**: Entropy calculation and "pwned passwords" check.
- **History**: Prevent reuse of last N passwords.

### Role-Based Access Control (RBAC)
Strict separation of duties via defined roles:
- **Viewer**: Read-only access to cases (`case.read`).
- **Investigator**: Create/Update cases, upload evidence (`case.create`, `evidence.upload`).
- **Administrator**: User management, system config (`user.manage`, `system.admin`).
- **Auditor**: Read-only access to audit logs.

| Endpoint | Admin | Investigator | Viewer | Auditor |
|----------|-------|--------------|--------|---------|
| GET /cases | ✅ | ✅ | ✅ | ✅ |
| POST /cases | ✅ | ✅ | ❌ | ❌ |
| DELETE /cases | ✅ | ❌ | ❌ | ❌ |
| GET /admin/users | ✅ | ❌ | ❌ | ✅ |

---

## 3. Data Protection & Encryption

### Database Encryption (SQLCipher)
- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 (100,000 iterations)
- **Storage**: Keys stored in secure environment variables, never in code.

```sql
-- Example SQLCipher / PGCrypto Usage
CREATE EXTENSION pgcrypto;
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    title bytea,  -- Encrypted
    description bytea
);
```

### File Encryption
All evidence files (PDFs, Images) are encrypted before storage.
- **Algorithm**: AES-256-CBC with unique IV per file.
- **Process**: `IV + EncryptedData` stored together.

```javascript
// Encryption logic concept
const cipher = crypto.createCipher('aes-256-cbc', key);
let encrypted = cipher.update(fileData);
encrypted = Buffer.concat([encrypted, cipher.final()]);
```

### Key Management
- **Production**: Keys injected via secure environment variables or Vault.
- **Rotation**: Automated key rotation key-wrapping support.

---

## 4. Network & Application Security

### Network Security
- **TLS 1.3**: Mandatory for all external connections.
- **HSTS**: Strict Transport Security enforced.
- **CSP**: Strict Content Security Policy.

### Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
```

### Electron Security
- **Context Isolation**: `contextIsolation: true`
- **Node Integration**: `nodeIntegration: false`
- **Sandboxing**: Renderer process sandboxed.
- **IPC**: Message validation and sanitization.

### Input Validation
- **Client**: React form validation.
- **Server**: Pydantic models with strict typing.
- **Database**: Parameterized queries (No SQL injection).

---

## 5. Session Management

- **Tokens**: Secure, random session IDs (256-bit).
- **Timeouts**: 60-minute absolute timeout, 30-minute idle timeout.
- **Binding**: Sessions bound to IP and User Agent.
- **Concurrent Limits**: Max 3 active sessions per user.

```python
# Session validation logic
async def validate_session(self, session_id: str) -> dict:
    session_data = await self.redis.get(f"session:{session_id}")
    if not session_data:
        raise HTTPException(status_code=401, detail="Session expired")
    # ... renewal logic
```

---

## 6. Security Operations (Monitoring & Auditing)

### Comprehensive Audit Logging
Every security-relevant action is logged.
- **Events**: `USER_LOGIN`, `CASE_UPDATED`, `EVIDENCE_ACCESSED`, `PERMISSION_CHANGED`.
- **Fields**: Timestamp, User ID, IP, Action, Resource, Outcome.
- **Integrity**: Logs are immutable and hashed.

### Monitoring & Alerts
- **Real-time**: Failed logins, DoS attempts, Error rate spikes.
- **Severity Levels**:
    - 🚨 **Critical**: Security breach (e.g., SQLi attempt detected).
    - ⚠️ **High**: Multiple failed auth attempts (Brute force).
    - 🟡 **Medium**: Policy violation.

---

## 7. Compliance & Privacy

### Regulatory mapping
- **GDPR**: Right to erasure, data minimization, consent tracking.
- **PCI-DSS**: No storage of checking/credit card numbers; encryption of PAN if absolutely necessary (we avoid it).
- **SOX**: Financial data integrity and audit trails.

### Privacy Controls
- **Data Minimization**: Only collect what is needed.
- **PII Redaction**: Logs are sanitized of PII before storage.
- **Data Retention**:
    - Audit logs: 7 years.
    - Security logs: 1 year.
    - Application logs: 90 days.

---

## 8. Incident Response

### Phases
1.  **Detection**: Monitoring alerts, user reports.
2.  **Triage**: Assess severity (Critical, High, Med, Low).
3.  **Containment**: Isolate system, revoke credentials.
4.  **Eradication**: Patch vulnerability, remove malicious artifacts.
5.  **Recovery**: Restore from backup, verify integrity.
6.  **Post-Incident**: Root cause analysis and documentation.

### Contacts
- **Security Team**: security@Zenith.com
- **Emergency**: [Internal Emergency Number]

---

## 9. Security Testing & Audit Plan

This section outlines the recurring audit requirements.

### Automated Testing (CI/CD)
- **SAST**: `bandit` (Python), `eslint-plugin-security` (JS).
- **Dependency Scan**: `npm audit`, `pip-audit`.
- **Secret Scan**: `trufflehog`, `ggshield`.

### Vulnerability Management
- **Critical**: Fix immediately/Stop ship.
- **High**: Fix within 1 week.
- **Medium**: Fix within 1 month.

### Periodic Audit Schedule
| Frequency | Activity |
|-----------|----------|
| **Weekly** | Dependency scans, Log review |
| **Monthly** | Manual code review of critical auth modules |
| **Quarterly** | Full Security Audit, Disaster Recovery Drill |
| **Annually** | External Penetration Test |

### Audit Checklist (Sample)
- [ ] Authentication: Password complexity enforced?
- [ ] Authorization: Admin endpoints protected?
- [ ] Data: DB backups encrypted?
- [ ] Access: Former employees revoked?
- [ ] Infrastructure: OS/Docker patches applied?
