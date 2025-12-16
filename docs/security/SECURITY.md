# Security — Canonical Full (Merged)

**Change impact (keep in sync):**
- Update deployment hardening notes in `docs/deployment/README.md` and desktop IPC guidance in `docs/architecture/ELECTRON_ARCHITECTURE.md` when controls change.
- Reflect auth/RBAC changes in `docs/api/README.md` and any SOC/audit procedures referenced in `docs/developer/MONITORING_AGUIDE.md`.
- Keep originals (`developer/security.md`, `security/SECURITY_GUIDE.md`, `security/AUDIT_PLAN.md`) archived after edits and rerun docs link check.

This file consolidates the security guidance from:
- `developer/security.md`
- `security/SECURITY_GUIDE.md`
- `security/AUDIT_PLAN.md`

It provides a single entry point for security controls, incident response, and audit practices. Originals are left in place until you approve archival.

---

## 1. Security Architecture (summary)
- Defense-in-depth: Network, Application, Data layers
- Encryption: SQLCipher for local DB, TLS 1.3 for network
- IPC: HMAC-signed messages for sensitive inter-process communication

## 2. Authentication & Authorization
- JWT for user sessions
- Role-based access: `ANALYST`, `SENIOR_INVESTIGATOR`, `ADMIN`
- API keys for machine-to-machine integration

## 3. Data Protection & Compliance
- Encrypted storage for evidence and database
- Audit logs: immutable `AuditLogEntry` with actor, timestamp, changes
- Retention policies and compliance mapping (GDPR, PCI-DSS, SOX as applicable)

## 4. Security Operations
- Monitoring: integrate with Prometheus/Grafana and structured logging (Loki/Elasticsearch)
- Incident Response: contact chain, evidence preservation, timeline reconstruction
- Regular audits: follow `AUDIT_PLAN.md` for cadence and controls

## 5. Appendices & Full References
- Full implementation-level details and checklists remain in the original files. See:
  - `developer/security.md`
  - `security/SECURITY_GUIDE.md`
  - `security/AUDIT_PLAN.md`

---

Next steps:
- Refer to `docs/security/SECURITY_FULL.md` for all security matters.
- Originals have been archived in `docs/archives/security/`.
