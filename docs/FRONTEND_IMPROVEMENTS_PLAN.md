# Frontend Improvements Implementation Plan
**Created:** 2025-12-16T22:13:30+09:00  
**Status:** IN PROGRESS  
**Goal:** Complete all recommendations from FRONTEND_INVESTIGATION_REPORT.md

---

## Phase 1: Performance & Virtualization (HIGH PRIORITY)

### 1.1 Install Dependencies ✅
- [x] Install @tanstack/react-virtual
- [x] Install react-window (fallback)
- [x] Verify Three.js availability for WebGL

### 1.2 Virtualize Lists
- [ ] Create VirtualizedList component
- [ ] Virtualize Cases list page
- [ ] Virtualize Alerts/AdjudicationQueue
- [ ] Virtualize Transaction tables in Reconciliation
- [ ] Virtualize Audit logs in Settings

### 1.3 Upgrade NetworkGraph to WebGL
- [ ] Install react-force-graph-3d
- [ ] Create EntityGraph3DWebGL component
- [ ] Migrate NetworkAnalysis to use WebGL renderer
- [ ] Add LOD (Level of Detail) optimization
- [ ] Test with 1000+ nodes

---

## Phase 2: HITL Integration (MEDIUM PRIORITY)

### 2.1 ApprovalQueue Integration
- [ ] Create AI workflow approval service
- [ ] Wire ApprovalQueue to InvestigationWizard
- [ ] Wire ApprovalQueue to AIAssistant suggestions
- [ ] Add approval queue to Cases bulk operations
- [ ] Test full approval flow

### 2.2 DraftPreview Integration
- [ ] Wire DraftPreview to InvestigationWizard AI auto-fill
- [ ] Add draft preview to case field edits
- [ ] Create DraftPreviewService for state management
- [ ] Test selective approval workflow

---

## Phase 3: Keyboard Navigation (MEDIUM PRIORITY)

### 3.1 Complex Widget Navigation
- [ ] Add arrow key navigation to CaseKanban
- [ ] Add keyboard traversal to NetworkGraph
- [ ] Add keyboard shortcuts to Investigation page
- [ ] Document all keyboard shortcuts
- [ ] Add keyboard shortcut help modal

---

## Phase 4: Security Audit (MEDIUM PRIORITY)

### 4.1 DOMPurify Integration
- [ ] Install DOMPurify
- [ ] Create useSanitizedHTML hook
- [ ] Audit AIAssistant response rendering
- [ ] Audit Investigation notes rendering
- [ ] Audit all innerHTML usage

### 4.2 RBAC UI Cleanup
- [ ] Convert disabled buttons to conditional renders
- [ ] Audit Settings page permissions
- [ ] Audit Cases page permissions
- [ ] Add permission tooltips where needed

---

## Phase 5: Optimization (LOW PRIORITY)

### 5.1 React.memo Expansion
- [ ] Memoize all graph node components
- [ ] Memoize live metrics components
- [ ] Add useMemo for expensive calculations
- [ ] Memoize CaseCard components
- [ ] Memoize AlertCard components

### 5.2 Split View Standardization
- [ ] Create reusable SplitView component
- [ ] Standardize Chat+Artifact pattern
- [ ] Apply to all major pages
- [ ] Ensure artifact persistence

---

## Phase 6: Backend Streaming (COMPLEX)

### 6.1 SSE Endpoint
- [ ] Create /api/ai/stream endpoint
- [ ] Implement token-by-token streaming
- [ ] Wire to AIAssistant frontend
- [ ] Add reconnection logic
- [ ] Test streaming performance

### 6.2 WebSocket Completion
- [ ] Complete backend WebSocket handlers
- [ ] Wire all real-time features
- [ ] Add connection health monitoring
- [ ] Test concurrent connections

---

## Execution Order

1. **NOW:** Install dependencies (5 min)
2. **NOW:** Create virtualized components (2 hours)
3. **NOW:** Upgrade NetworkGraph WebGL (3 hours)
4. **TODAY:** Wire HITL components (4 hours)
5. **TODAY:** Add keyboard navigation (3 hours)
6. **TODAY:** Security audit (2 hours)
7. **LATER:** React.memo expansion (2 hours)
8. **LATER:** Backend streaming (8+ hours - complex)

---

## Progress Tracker

- [ ] Phase 1: Performance & Virtualization (0%)
- [ ] Phase 2: HITL Integration (0%)
- [ ] Phase 3: Keyboard Navigation (0%)
- [ ] Phase 4: Security Audit (0%)
- [ ] Phase 5: Optimization (0%)
- [ ] Phase 6: Backend Streaming (0%)

**Overall Progress: 0%**
