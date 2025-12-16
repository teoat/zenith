# Phase 6 Feature Issues (for tracker import)

This file mirrors the Phase 6 items already listed in `master_todo.md` and `master_plan.md`. Use it to create issues in your tracker (one issue per section).

## P6-01: Case Conclusion Wizard
- Outcome: guided close-out with templated summaries, approval workflow, audit trail.
- Notes: include checklist for evidence completeness and risk recalculation.

## P6-02: Interactive Dossier
- Outcome: printable/shareable dossier view with narrative, evidence highlights, timeline, and risk posture.
- Notes: export to PDF; redaction support; link back to source evidence.

## P6-03: Frenly Copilot (investigator assistant)
- Outcome: AI-assisted query builder, suggested next steps, evidence summarization.
- Notes: require opt-in logging; guardrails on PII exposure.

## P6-04: Model Monitoring & Drift
- Outcome: monitoring dashboard for fraud model performance, drift alerts, and threshold tuning.
- Notes: tie into Prometheus/Grafana; add feedback loop from adjudications.

## P6-05: Semantic Search to Production
- Outcome: production-grade semantic search with pgvector, filters, and RBAC-aware results.
- Notes: latency SLO ≤ 300ms p95; offline indexing job documented.

## P6-06: Multi-Tenant Hardening
- Outcome: tenant isolation for data, configs, secrets; per-tenant encryption keys.
- Notes: add tenancy tests and admin UX for tenant management.

## P6-07: Mobile Companion (read-only, alerts)
- Outcome: mobile (or responsive PWA) for alert triage, case overview, and notifications.
- Notes: focus on push notifications and quick acknowledgment flows.

## P6-08: Advanced Forensics Toolkit
- Outcome: richer PDF/Image forensics (ELA, metadata diff, tamper heuristics) and provenance chain.
- Notes: align with evidence admissibility guidelines; add offline mode safeguards.

## P6-09: Command Palette
- Outcome: universal palette for navigation, case actions, and admin commands.
- Notes: keyboard-first; ensure audit logging for sensitive actions.

## P6-10: Docs & Link Integrity
- Outcome: keep link-check CI green; enforce docs canonical paths.
- Notes: track follow-ups for troubleshooting/monitoring/strategy cleanup.
