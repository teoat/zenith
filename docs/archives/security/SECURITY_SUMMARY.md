# Security — Consolidated Summary

This summary centralizes security guidance and links to the detailed security artifacts.

Primary sources:
- `security/SECURITY_GUIDE.md`
- `security/AUDIT_PLAN.md`
- `developer/security.md`

Synchronization notes:
- Keep the Audit Plan as an appendix; the canonical `SECURITY_SUMMARY.md` should reference it and list quick operational checklists (health checks, encryption, incident response).
- Ensure cross references exist for deployment security checks in `deployment/PRODUCTION_DEPLOYMENT.md`.

Suggested next steps:
1. Use `docs/security/SECURITY.md` as the canonical consolidation of the two security files and `developer/security.md` sections relevant to implementation.
2. Update system architecture and deployment docs to point to `docs/security/SECURITY.md` for security controls.
