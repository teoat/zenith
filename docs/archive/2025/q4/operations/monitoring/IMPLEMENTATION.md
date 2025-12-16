# Monitoring & Diagnostics Implementation

**Change impact (keep in sync):**
- Ops monitoring pages: update references in `docs/deployment/monitoring.md` and `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md`.
- Developer instrumentation: update `docs/developer/MONITORING_AGUIDE.md` and any logging/metrics notes in `docs/architecture/CORE_ARCHITECTURE.md` or `docs/security/SECURITY.md`.
- Diagnostics plans: sync with `docs/diagnostics/PLAN.md` and `docs/diagnostics/README.md` if you change flows.
- Run docs link check after edits.

## Operator Guide (production)
- Metrics: expose `/metrics` (Prometheus). Key charts: request latency p95/p99, error rate, DB connections, cache hit rate, job queue depth.
- Health: `/health`, `/health/ready`, `/health/live` must be green before deploy. Alert if any fail >2m.
- Logging: structure to JSON; ship to Loki/ELK. Include `trace_id`, `user_id`, `tenant_id`.
- Alerts: wire Grafana/Loki alerts for 5xx rate, auth failures, queue backlog, disk usage, and model drift (see Developer section).
- Playbooks: link to `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md` for remediation.

## Developer Guide (instrumentation)
- Tracing: use OpenTelemetry in FastAPI and Electron preload IPC; propagate `traceparent` across frontend → backend → worker.
- Metrics emission: export HTTP server/client metrics, DB query timings, cache hits/misses, queue timings, model inference latency.
- Logs: redact PII; tag with `env`, `service`, `version`.
- Model monitoring: log input feature stats, drift metrics (PSI/JS divergence), and outcome feedback from adjudication. Alert thresholds live in Prometheus rule files.
- Local dev: run `uvicorn --reload` with OTLP exporter pointed to `localhost:4317`; view with `jaeger`/`tempo` stack.

## Dashboard Expectations
- Availability SLO: 99.5% monthly; Latency: p95 < 300ms for public APIs; Error budget tracked in Grafana.
- Evidence pipeline: monitor OCR/forensics job queues and failure rates.
- Security: monitor 401/403 spikes, failed logins, IPC signature failures.

## Runbooks & Links
- Ops troubleshooting: `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md`
- User troubleshooting: `docs/guides/TROUBLESHOOTING_USER.md`
- Security incidents: `docs/security/SECURITY.md`

## When editing this file
- Update the affected-file list above if you add or remove touchpoints.
- Ensure monitoring rules and dashboards referenced here are linked from deployment/ops docs.
- Re-run docs link check after changes.
