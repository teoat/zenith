# Master TODO List (Consolidated)

> **Last Updated:** 2025-12-18
> **LINKS:** [Master Plan](master_plan.md)
> **STATUS:** Phase 1-10 Complete. Phase 11 (Roadmap) Planned. **Active Phase: 12, 13, 14 (Zenith Finalization & Tech Debt)**

## 📊 Project Status Dashboard

| Phase | Component | Status |
| :--- | :--- | :--- |
| **Phase 1-10** | Core, Security, Production, Advanced Features | ✅ Complete |
| **Phase 12** | **Technical Debt & Refactoring** | ⚠️ **Pending / In Progress** |
| **Phase 13** | **Zenith Rebrand & Adjudication** | 🔄 **Active Focus** |
| **Phase 14** | **Zenith Intelligence (Graph/Forensics)** | 📋 Planned |
| **Phase 15+** | Future Roadmap (Moonshots) | 🔭 Long-term |

---

## 🚀 Phase 13: Zenith Adjudication & System Rebrand (IMMEDIATE)

**Goal:** Transform "Antigravity" into "Zenith" and make the Adjudication Hub "Alive".

### 🔴 13.1 System-wide Rebrand ("Zenith")
- [x] **Shell:** Rename app to "Zenith" in `index.html`, `manifest.json`.
- [x] **UI:** Update Header/Sidebar logos and text.
- [x] **Cleanup:** Remove "Antigravity" references from user-facing strings.

### 🔴 13.2 Real-time Adjudication Hub
- [x] **Live Feed:** Implement WebSocket connection (`/ws/alerts`) for real-time alert injection.
- [x] **Zero State:** Design "All Clear" empty state animation.
- [x] **Optimistic UI:** Instant feedback on Approve/Reject decisions.

---

## 🚀 Phase 14: Zenith Intelligence Upgrade

**Goal:** Replace "Demoware" visuals with production-grade Intelligence tools.

### 🔴 14.1 Graph Intelligence (Physics Engine)
- [x] **Migrate:** Replace Canvas with `react-force-graph-2d` (WebGL).
- [x] **Physics:** Enable `d3-force` for organic cluster separation.
- [x] **Expansion:** Implement "Search Around" (double-click node to expand).

### 🔴 14.2 Deep Forensics

- [x] **Engine:** Integrate `react-pdf-highlighter-extended`.
- [x] **Persistence:** Save text highlights to backend `evidence_metadata`.
- [x] **Pagination:** Implement client-side paging for Evidence Locker (Server-side pending).

---

## 🛠 Phase 12: Technical Debt & Architecture (CRITICAL)

**Goal:** Pay down debt accumulated during rapid prototyping phases.

- [x] **Split-Brain Architecture:** Deprecated `multimodal_analyzer.py` in favor of `evidence_service.py`.
- [x] **Dead Code:** Deprecated legacy `evidence_processor.py`.
- [x] **PDF Engine Unification:** Standardized on `fitz`/`PyMuPDF` in `evidence_service.py`.
- [ ] **Router Refactor:** Ensure all routes use the consolidated service layer.
- [ ] **Model Training:** Transition from heuristic/regex models to trained ML models (`scikit-learn`/`pytorch`).
- [ ] **RAG Integration:** Wire up Vector Database (ChromaDB/FAISS) for real document retrieval.
- [ ] **A/V Processing:** Implement actual stubs for Audio/Video processing (currently mocked).

---

## 🔭 Future Roadmap (Strategic Focus Areas)

### 15.1 Advanced AI & Moonshots
- [ ] Quantum computing integration (Fraud pattern analysis)
- [ ] Federated learning (Cross-system privacy-preserving ML)
- [ ] Real-time deep learning model updates
- [ ] Multi-modal AI (Video/Audio deepfake detection)

### 15.2 Enterprise Ecosystem
- [ ] Blockchain-based immutable evidence chains
- [ ] Cross-organization fraud intelligence sharing
- [ ] API-first architecture (GraphQL Federation)
- [ ] Multi-cloud deployment & Failover strategies

---

## ✅ Completed Major Milestones (Summary)

- **Phase 1-5 (Core):** Security enabled, Electron build stable, basic fraud engine active.
- **Phase 6 (Onboarding/Fraud Proof):** Tutorial wizards, metadata correlation, audit logs complete.
- **Phase 7-10 (Enhancements):** Network graphs, RAG engine, multimodal analysis, and predictive dashboards implemented.
- **Dependency Updates:** React 19 upgrade and backend requirement pinning successful (Dec 2025).

---

## 🩺 System Diagnosis & Recommendations (Latest)

### 🔴 Critical Issues
1. **Frontend Dependency Mismatch (`react-pdf-highlighter-extended`):**
   - **Issue:** `package.json` requests version `^2.2.0`, but available versions are `7.0.0+`. This causes `npm install` failures.
   - **Impact:** Deep Forensics module (Phase 14.2) is broken/unbuildable.
   - **Solution:** Update `package.json` to `^8.1.0`.

2. **Backend Router Fragmentation:**
   - **Issue:** Evidence handling is split between `evidence_service.py` (new) and legacy routers.
   - **Recommendation:** Consolidate all evidence uploads/retrievals to use the unified `EvidenceService`.

3. **Missing "Deep Forensics" Implementation:**
   - **Issue:** While marked as "Complete" in checklist, the underlying library is missing.
   - **Corrective Action:** Correct dependencies and verify `PdfViewer.tsx` integration.

### 🟡 Improvements & Polish
1. **Adjudication Hub:** Polishing "Zero Inbox" state with better animations.
2. **Graph Intelligence:** Optimization of `react-force-graph-2d` for large datasets (currently default config).

[View Detailed Diagnosis Report](diagnosis_report_2025_12_18.md)

