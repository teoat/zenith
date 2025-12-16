# Testing Guide

This guide outlines the testing infrastructure for the 378x492 Fraud Detection Platform.

## 1. Frontend Testing

**Stack:** Jest + React Testing Library + Vitest (configuration dependent)

### 1.1 Running Unit Tests
To run all frontend unit tests:
```bash
cd frontend
npm run test
```

### 1.2 Code Coverage
We use Jest/Vitest's built-in coverage reporting (`c8` or `v8` provider).

**Command:**
```bash
cd frontend
npm run test:coverage
```

**Output:**
Reports are generated in `frontend/coverage/`.
- **Text Summary:** Displayed in terminal.
- **HTML Report:** `frontend/coverage/lcov-report/index.html` (open in browser for detailed view).

**Current Baseline (Dec 2025):** < 1% coverage. Significant effort required to Backfill tests.

### 1.3 Key Test Files
- `src/components/__tests__/ui-components.test.tsx`: Tests for reusable UI components.
- `src/services/__tests__`: Service layer mock tests.

---

## 2. Backend Testing

**Stack:** Pytest + Pytest-Asyncio + Pytest-Cov

### 2.1 Prerequisites
Ensure dev dependencies are installed:
```bash
pip install pytest pytest-asyncio pytest-cov httpx
```

### 2.2 Running Integration Tests
```bash
cd backend
pytest tests/integration
```

### 2.3 Code Coverage
To generate a coverage report for the `app` module:
```bash
cd backend
pytest --cov=app tests/
```

---

## 3. End-to-End (E2E) Testing

**Stack:** Playwright (Electron support)

### 3.1 Running E2E Tests
```bash
npm run test:e2e
```
*Note: Requires building the Electron app first via `npm run build`.*

---

## 4. Continuous Integration
Tests are automatically run in the CI pipeline on every PR.
Failed tests or dropping coverage (future check) will block merges.
