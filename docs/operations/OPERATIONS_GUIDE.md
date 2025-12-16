# Operations Guide

**Last Updated:** 2025-12-12  
**Purpose:** Unified guide for diagnostics, monitoring, and testing procedures.

---

## 📋 Table of Contents

- [Diagnostics](#diagnostics)
- [Monitoring](#monitoring)
- [Testing](#testing)

---

## Diagnostics

A comprehensive diagnostic system for the 378x492 Fraud Detection application that performs automated health checks, security audits, and performance analysis.

### Running Diagnostics

```bash
# Run all diagnostics
npm run diagnostics

# Run specific categories
npm run diagnostics:system    # System health only
npm run diagnostics:deps      # Dependencies only
npm run diagnostics:security  # Security checks only
node diagnostic-orchestrator.js --performance  # Performance metrics
```

### Diagnostic Categories

| Priority | Category | Description |
|:---------|:---------|:------------|
| 🔴 Critical | System Health | System resources, versions, functionality |
| 🔴 Critical | Security Posture | Secrets scanning, vulnerability checks |
| 🔴 Critical | Dependencies | Security vulnerabilities, outdated packages |
| 🟡 High | Frontend Build | React build validation |
| 🟡 High | Backend Health | Python imports, API endpoints |
| 🟡 High | Electron Integration | Desktop app functionality |
| 🟢 Medium | Performance Metrics | Bundle sizes, import times |
| 🟢 Medium | Configuration | Environment, build settings |
| 🔵 Low | Documentation | Completeness assessment |

### Output

The diagnostic system generates:

1. **Console Output**: Real-time progress and summary
2. **JSON Report**: `diagnostic-results-YYYY-MM-DDTHH-MM-SS.json`
3. **Recommendations**: Actionable improvement suggestions

---

## Monitoring

### Operator Guide (Production)

| Endpoint | Purpose |
|:---------|:--------|
| `/metrics` | Prometheus metrics export |
| `/health` | Overall health check |
| `/health/ready` | Readiness probe |
| `/health/live` | Liveness probe |

**Key Charts:**

- Request latency p95/p99
- Error rate
- DB connections
- Cache hit rate
- Job queue depth

**Logging:**

- Structure: JSON format
- Ship to: Loki/ELK
- Include: `trace_id`, `user_id`, `tenant_id`

**Alerts:**

- 5xx rate spikes
- Auth failures
- Queue backlog
- Disk usage
- Model drift

### Developer Guide (Instrumentation)

**Tracing:**

- Use OpenTelemetry in FastAPI and Electron preload IPC
- Propagate `traceparent` across frontend → backend → worker

**Metrics Emission:**

- HTTP server/client metrics
- DB query timings
- Cache hits/misses
- Queue timings
- Model inference latency

**Local Development:**

```bash
uvicorn --reload  # with OTLP exporter to localhost:4317
# View with jaeger/tempo stack
```

### Dashboard SLOs

| Metric | Target |
|:-------|:-------|
| Availability | 99.5% monthly |
| Latency (p95) | < 300ms for public APIs |
| Error budget | Tracked in Grafana |

---

## Testing

### Test Categories

| Category | Location | Purpose |
|:---------|:---------|:--------|
| Unit Tests | `backend/tests/unit/` | Individual function tests |
| Integration Tests | `backend/tests/integration/` | API endpoint tests |
| E2E Tests | `frontend/cypress/` | Full user flow tests |

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e
```

### Coverage Requirements

| Component | Minimum Coverage |
|:----------|:-----------------|
| Backend API | 80% |
| Frontend Components | 70% |
| Critical Paths | 95% |

---

## Runbooks & Links

- **Deployment Troubleshooting:** `docs/deployment/DEPLOYMENT_GUIDE.md`
- **Security Incidents:** `docs/security/SECURITY.md`
- **User Guide:** `docs/guides/USER_MANUAL.md`

---

## Archived Documentation

Historical diagnostic and operations documents are archived at:

- `docs/archives/meta/diagnosis_resolution.md`
- `docs/archives/ops/` (legacy monitoring guides)
