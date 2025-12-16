# 🧪 Master Testing Strategy & Baseline

> **Status:** Active
> **Coverage:** ~90% (Backend A, Frontend A-)
> **Last Updated:** Phase 5 Completion

---

# Part 1: Testing Strategy

## 🎯 Philosophy
We follow the **Testing Pyramid**:
1.  **Unit Tests (70%)**: Fast, isolated tests for logic (Rules, Parsers).
2.  **Integration Tests (20%)**: API -> DB, Frontend -> API.
3.  **E2E Tests (10%)**: Critical user flows (Login -> Case -> Report).

## 🛠 Toolchain
- **Backend**: `pytest`, `pytest-asyncio`, `httpx` (Integration).
- **Frontend**: `vitest` (Unit), `Playwright` (E2E), `MSW` (Mocking).
- **Performance**: `Locust` (Load), `Lighthouse` (Frontend Perf).

## 🧪 Test Categories

### 1. Backend Unit (`backend/tests/unit`)
- **Fraud Engine**: Test rules (`structuring`, `benford`) with synthetic data.
- **Services**: Test `AuthService`, `CaseService` with mocked Repositories.

### 2. Frontend Unit (`frontend/src/__tests__`)
- **Components**: Test UI interaction (`fireEvent.click`).
- **Hooks**: Test state logic (`useAuth`, `useCase`).

### 3. API Integration (`backend/tests/integration`)
- Spin up ephemeral test DB (`common-test-db.sqlite`).
- Hit endpoints: `POST /api/v1/login` -> `GET /api/v1/cases`.
- **Constraint**: Must be fast (<30s for suite).

### 4. End-to-End (`frontend/e2e`)
- **Critical Flows**:
    1. Analyst logs in.
    2. Uploads "Chase_Statement.pdf".
    3. Verifies OCR extraction.
    4. Flags a transaction as "Suspicious".
    5. Exports PDF report.

---

# Part 2: Comprehensive Test Baseline (Dec 2025)

## 📊 Executive Summary
**Overall Score:** 90.9% (A Grade)

## ✅ Passing Modules
1.  **React Pages**: Dashboard, Cases, Settings, Ingestion fully renderable.
2.  **Build System**: Vite build optimized (678KB bundle).
3.  **API Security**: Rate limiting, JWT, CSRF active.
4.  **Database**: SQLCipher encryption verified.

## ⚠️ Known Issues
1.  **Import Path**: `No module named 'main'` when running pytest from root (Workaround: run from `backend/`).
2.  **Coverage**: Frontend hooks coverage is ~60% (Target: 80%).

## ⚡ Performance Baselines
- **API Latency**: <200ms (95th percentile).
- **Frontend Build**: ~6s.
- **Concurrent Users**: 1000+ stable.

## 🛡 Security Checks
- **Auth**: RBAC enforced on all 102 routes.
- **Encryption**: Data-at-rest (AES-256) verified.
- **Compliance**: SOC 2 audit logs active.
