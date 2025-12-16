# Core Architecture — Canonical Full (Merged)

**Change impact (keep in sync):**
- Update downstream schemas in `backend/models/`, `docs/security/SECURITY.md` (audit log), and frontend types in `docs/features/cases.md` when entity fields change.
- If fraud logic changes, sync `docs/deployment/monitoring.md` and any rule descriptions in `docs/developer/MONITORING_AGUIDE.md`.
- Keep archives in `docs/archives/architecture/` intact for traceability and re-run docs link check after edits.

This file combines the canonical core architecture pieces: data models, fraud logic, and tech stack. Originals are archived under `docs/archives/architecture/`.

---

## Part A — Data Models (from `00_DATA_MODELS.md`)

# 📦 Centralized Data Models

**Scope:** Global Shared Definitions
**Status:** ✅ Approved Standard

---

## 1. Core Entities

### `Case`
The top-level container for an investigation.
```typescript
interface Case {
	id: string;              // "CASE-2025-001"
	title: string;           // "Suspicious Procurement - Project Alpha"
	status: 'OPEN' | 'IN_PROGRESS' | 'ADJUDICATION' | 'CLOSED' | 'ARCHIVED';
	priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
	assigneeId: string;      // User ID
	createdAt: Date;
	updatedAt: Date;
	riskScore: number;       // 0-100 (Aggregated from Alerts)
	tags: string[];
}
```

### `Transaction`
A single financial record (ingested from Bank Statement or internal Ledger).
```typescript
interface Transaction {
	id: string;              // UUID
	sourceId: string;        // "INGEST-001" (File Origin)
	date: Date;
	amount: number;
	currency: string;        // "USD", "IDR"
	description: string;     // Raw bank text
	merchantName?: string;   // Cleaned/Enriched name
	category: string;        // "Travel", "Office Supplies"
	type: 'DEBIT' | 'CREDIT';
	metadata: Record<string, any>;
}
```

### `Evidence`
A supporting document or file linked to a Case or Alert.
```typescript
interface Evidence {
	id: string;
	caseId: string;
	filename: string;
	fileType: string;        // MIME type
	sizeBytes: number;
	uploadedAt: Date;
	hash: string;            // SHA-256 for integrity
	isAdmissible: boolean;   // Flagged for final report
}
```

(Additional system entities, alerts, patterns, and audit logs omitted here — full original archived.)

---

## Part B — Fraud Logic (from `00_FRAUD_LOGIC.md`)

# 🧠 Centralized Fraud Logic & Algorithms

**Scope:** Global Fraud Detection Engine
**Status:** ✅ Approved Standard
**Version:** 1.1 (Enhanced)

This document defines the core logic used across **Reconciliation**, **Forensics**, and **Frenly AI**.

---

### 1. Matching Logic (Reconciliation)

#### A. Fuzzy Text Matching
Used to link Bank Statement descriptions to Internal Invoice records.
*   **Library:** `thefuzz` (Python)
*   **Algorithm:** Weighted Ratio of Levenshtein Distance.
*   **Parameters:**
		*   `threshold`: Configurable (Default: 80). Matches < Threshold are rejected.
		*   `stop_words`: ["LLC", "Inc", "Pty", "Ltd", "The"]. Removed before matching.

#### B. Amount Matching Strategy
*   **Exact Match:** `abs(A - B) < 0.01`
*   **Tolerance Match:** `abs(A - B) <= (A * Config.tolerance_percent)` (Default 1% variance allowed for FX/Fees).
*   **Force Balancing:** If variance < $0.05, auto-post to "Rounding Error".

(Full logic, patterns, scoring functions and code snippets archived.)

---

## Part C — Technology Stack (from `00_TECH_STACK.md`)

# 🛠 Centralized Technology Stack

**Scope:** Global (Applies to all Pagex components)
**Status:** ✅ Approved Standard

---

### 1. Core Architecture
| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | Vite, TanStack Query, Zustand |
| **Backend** | Python 3.11 + FastAPI | Pydantic, SQLAlchemy, Pandas |
| **Database** | PostgreSQL 16 | `pgvector` (for future AI embeddings) |
| **Caching** | Redis 7 | `redis-py` |
| **Container** | Docker | Docker Compose |

(Development and ops tooling sections included in original; full content archived.)

---

Appendix: originals archived under `docs/archives/architecture/` (00_DATA_MODELS.md, 00_FRAUD_LOGIC.md, 00_TECH_STACK.md). The archived originals contain full code blocks and algorithmic snippets.
