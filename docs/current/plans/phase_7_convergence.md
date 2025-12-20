# 🎯 **IMPLEMENTATION PLAN: Phase 7 - Convergence & Validation**

This plan addresses the critical gaps identified in the [Implementation Diagnostic Report](./IMPLEMENTATION_DIAGNOSTIC_REPORT.md). The goal is to move the project from "theoretical" type safety to "practical" application, ensuring that the advanced frameworks created in previous phases are actually utilized cross-functionally.

---

## **1. 📊 Quality Infrastructure Recovery**

**Objective:** Restore and automate code quality monitoring.

- [x] **Fix Metrics Dashboard Script:**
  - Update `frontend/src/documentation/metrics-dashboard.ts` with correct workspace paths.
  - Resolve execution environment issues (ESM path resolution).
- [x] **Establish Baseline:**
  - Run the metrics script to generate `metrics-dashboard.md` and `metrics-trend.json`.
  - Commit these files to track progress over time.
- [x] **Quality Gate Automation:**
  - Deploy `.github/workflows/typescript-quality.yml` to enforce type coverage and linting on every PR.

## **2. 🛡️ Runtime Validation (Zod Integration)**

**Objective:** Ensure backend/frontend contract integrity.

- [x] **Centralize Schemas:**
  - Consolidate Zod schemas from `types/schema.ts` into a dedicated `validators/` directory.
- [x] **API Interceptors:**
  - Update `frontend/src/services/client.ts` or individual services to use `.parse()` on incoming data for critical entities (Cases, Users, Evidence).
  - Implement graceful error handling/logging for validation failures.

## **3. 🏷️ Advanced Domain Typing**

**Objective:** Leverage TypeScript's type system for domain logic safety.

- [x] **Branded Types Implementation:**
  - Define `CaseId`, `UserId`, and `EvidenceId` as Branded types.
- [x] **Store & Service Refactor:**
  - Update `caseStore.ts` and `caseService.ts` to use these branded types in function signatures.
  - Eliminate generic `string` types for entity identifiers to prevent accidental ID swapping.

## **4. 🛠️ Backend Router Hardening**

**Objective:** Fix bugs and technical debt in core API routers.

- [x] **Harden `evidence.py`:**
  - Fix missing `Evidence` model import.
  - Replace `Dict[str, Any]` in `bulk-delete` with a structured Pydantic model.
  - ⏳ Address outstanding `Exception` broad-catches and replace with specific HTTPExceptions (13 remaining).

---

## **Success Criteria**

1. **Dashboard Functional:** `metrics-dashboard.md` reflects actual project stats.
2. **Zero Technical Debt (Lints):** No "Unexpected any" in newly refactored services.
3. **Type Coverage:** Measurable increase (via branded types usage).
4. **Operational Safety:** Critical API paths validated at runtime via Zod.
