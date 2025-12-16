# Testing Strategy & QA Framework

> **Status:** Active
> **Last Updated:** 2025-12-17

## 1. Overview
This document outlines the testing strategy for the 378x492 Fraud Detection Platform. The strategy uses a "Pyramid" approach, balancing fast unit tests with comprehensive integration and end-to-end tests.

## 2. Backend Testing (Python/FastAPI)

### 2.1 Unit Tests (`pytest`)
*   **Scope:** Individual functions, classes, and services.
*   **Location:** `backend/tests/`
*   **Key Libraries:** `pytest`, `pytest-asyncio`, `pytest-cov`.
*   **Mocking:** Heavy use of `unittest.mock` to isolate from DB and External APIs.
*   **Goal:** >90% code coverage for core logic.

### 2.2 Integration Tests
*   **Scope:** API endpoints, Database interactions.
*   **Database:** Uses a separate `test_db` (SQLite/Postgres) created/destroyed per session.
*   **Client:** `httpx.AsyncClient` for testing FastAPI routes.

### 2.3 Critical Test Suites
*   `test_auth.py`: Authentication flows (JWT, MFA).
*   `test_multimodal_analysis_service.py`: Evidence processing engine.
*   `test_fraud_detection.py`: Fraud rule engine logic.

## 3. Frontend Testing (React/TypeScript)

### 3.1 Unit/Component Tests (`Jest` + `React Testing Library`)
*   **Scope:** React components, Hooks, Utility functions.
*   **Location:** `frontend/src/__tests__/` or co-located `__tests__` folders.
*   **Goal:** Verify UI rendering, user interaction handlers, and state logic.

### 3.2 End-to-End (E2E) Tests (`Playwright` / `Cypress`)
*   **Scope:** Critical User Journeys (Login -> Dashboard -> Investigation).
*   **Status:** Planned for Phase 11.

## 4. Test Orchestration & CI/CD

### 4.1 Local Development
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### 4.2 Application Logic Validation
*   **Evidence Processing:** Validates file type detection, OCR extraction, and forensic flags.
*   **Fraud Engine:** Validates rule triggering against known "fraud" and "clean" transaction patterns.

## 5. Known Gaps & Roadmap (Phase 12)
1.  **ML Model Testing:** Current AI features are heuristic. Real ML models require a dedicated "Model Evaluation" pipeline (F1-score, Precision/Recall).
2.  **External Integrations:** Regulatory reporting tests currently mock the submission. Need contract tests for real APIs.
3.  **Frontend/Backend Sync:** E2E tests are needed to ensure frontend components (e.g., Graph Viz) correctly visualize backend API data.
