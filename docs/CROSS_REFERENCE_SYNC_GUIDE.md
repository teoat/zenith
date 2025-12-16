# Cross-Reference Synchronization Guide

**Last Updated:** 2025-12-12  
**Purpose:** Comprehensive synchronization instructions for agents and editors maintaining documentation consistency.

---

## 0. Quick Start Checklist (TL;DR)

> **For all agents editing markdown documentation** — use this checklist before, during, and after edits.

### ✅ Pre-Edit

- [ ] Check if file has **"Change Impact" block** at top → Read to identify affected documents
- [ ] Identify document priority:
  - 🔴 **CRITICAL:** `master_plan.md`, `master_todo.md`, `MASTER_ROADMAP.md` → Changes cascade to 8-10 files
  - 🟠 **HIGH:** Framework docs (Feature Flags, UX Metrics, Compliance)
  - 🟡 **MEDIUM:** Spike docs, API docs
  - 🟢 **LOW:** User guides, tutorials
- [ ] List all affected files before starting

### ✏️ During Edit

- [ ] Update **all affected documents** simultaneously
- [ ] Maintain **bidirectional links** (if A→B, ensure B→A)
- [ ] Update "Last Updated" timestamps

### ✅ Post-Edit

- [ ] Run link checker: `python3 docs/scripts/check_links.py`
- [ ] Verify master document consistency (if applicable)
- [ ] Commit message references synchronization

### 🚨 If You Discover Issues

- **Broken link:** Check target exists, update all instances with grep
- **Documents diverge:** Use most recent timestamp as source of truth

---

## 1. Critical Master Document Links

### 1.1 Master Plan ➔ All Other Documents

**File:** `master_plan.md`

**Outgoing References:**
- Links to: `master_todo.md` (task tracking)
- Links to: `task_registry.md` (progress dashboard)
- Links to: `testing_strategy.md` (QA procedures)
- Links to: `docs/DOCUMENTATION_INDEX.md` (central docs hub)
- Links to: `docs/user-guides/` (user documentation)
- Links to: `docs/deployment/` (deployment procedures)
- Links to: `docs/API.md` (API reference)
- Links to: `docs/TROUBLESHOOTING.md` (troubleshooting)
- Links to: `docs/developer/finesse-enhancements.md` (Phase 6 roadmap)

**Synchronization Rule:** When updating master_plan.md:
1. Any strategic phase/priority changes must cascade to `master_todo.md` (Phase sections)
2. Timeline changes must update `docs/planning/MASTER_ROADMAP.md` 
3. New documentation index entries must update `docs/DOCUMENTATION_INDEX.md`
4. Architecture changes must cross-reference `docs/architecture/CORE_ARCHITECTURE.md` and `docs/architecture/ELECTRON_ARCHITECTURE.md`

**Change Impact Block (Add to master_plan.md):**
```
## ⚠️ CHANGE IMPACT
When updating this document:
- Changes to Phase definitions → Update: master_todo.md, MASTER_ROADMAP.md
- Changes to strategy/vision → Update: docs/developer/finesse-enhancements.md, docs/README.md
- Changes to architecture → Update: docs/architecture/CORE_ARCHITECTURE.md, docs/architecture/ELECTRON_ARCHITECTURE.md
- Changes to timelines → Update: docs/planning/MASTER_ROADMAP.md
- Changes to procedures → Update: docs/deployment/README.md, docs/guides/documentation-maintenance.md
```

---

### 1.2 Master TODO ➔ Phase-Specific Details

**File:** `master_todo.md`

**Outgoing References:**
- Links to: `master_plan.md` (strategy context)
- Links to: `task_registry.md` (task progress)
- Links to: `testing_strategy.md` (QA requirements)
- Links to: `docs/DOCS_MIGRATION_GUIDE.md` (documentation rules)

**Internal Structure References:**
- Section 4.A → Backend API Gaps
- Section 4.B → Frontend Implementation
- Section 6 → Phase 6 Finesse Enhancements
- Section 6.A → Discovery Spikes
- Section 6.B → Smart Loading States
- Section 6.C → Enhanced Error Messages
- Section 6.D → Keyboard Shortcuts
- Section 6.E → Feature Flag Implementation
- Section 6.F → UX Metrics & Monitoring

**Synchronization Rule:** When updating master_todo.md:
1. Any new Phase 6 tasks must reference corresponding `docs/planning/DISCOVERY_SPIKE_TEMPLATE.md`
2. Feature flag tasks must link to `docs/planning/FEATURE_FLAG_SYSTEM.md`
3. Metrics tasks must link to `docs/planning/UX_METRICS_BASELINE.md`
4. Compliance tasks must link to `docs/planning/COMPLIANCE_REVIEW_FRAMEWORK.md`
5. Completed tasks must cross-reference spike documentation

**Change Impact Block (Add to master_todo.md):**
```
## ⚠️ CHANGE IMPACT
When updating this document:
- New Phase 6 tasks → Cross-reference: docs/planning/spikes/*.md
- Feature flag work → Update: docs/planning/FEATURE_FLAG_SYSTEM.md
- Metrics tracking → Update: docs/planning/UX_METRICS_BASELINE.md
- Compliance checks → Update: docs/planning/COMPLIANCE_REVIEW_FRAMEWORK.md
- Task completion → Update: task_registry.md and appropriate spike documentation
```

---

### 1.3 Master Roadmap ➔ Timeline & Planning

**File:** `docs/planning/MASTER_ROADMAP.md`

**Outgoing References:**
- Links to: `docs/developer/finesse-enhancements.md` (enhancement catalog)
- Links to: `docs/planning/DISCOVERY_SPIKE_TEMPLATE.md` (planning template)
- Links to: `docs/planning/spikes/FE_UI_LOADING_STATES_SPIKE.md` (Q1 #1 detailed spike)
- Links to: `docs/planning/FEATURE_FLAG_SYSTEM.md` (safe rollout infrastructure)
- Links to: `docs/planning/UX_METRICS_BASELINE.md` (measurement framework)
- Links to: `docs/planning/COMPLIANCE_REVIEW_FRAMEWORK.md` (regulatory governance)
- Links to: `docs/planning/PHASE6_READINESS_SUMMARY.md` (implementation readiness)

**Synchronization Rule:** When updating MASTER_ROADMAP.md:
1. Q1/Q2/Q3 timelines must match `master_todo.md` phase timelines
2. Feature priorities must align with `docs/planning/COMPLIANCE_REVIEW_FRAMEWORK.md` risk ratings
3. ROI estimates must match spike documentation
4. Effort estimates must be consistent with `docs/planning/spikes/*.md` documents
5. Feature descriptions must link to appropriate spike documentation

**Change Impact Block (Add to MASTER_ROADMAP.md):**
```
## ⚠️ CHANGE IMPACT
When updating this document:
- Timeline changes → Update: master_plan.md, master_todo.md
- Priority changes → Update: docs/planning/spikes/*.md implementation sequence
- ROI/Cost estimates → Update: associated spike documentation
- Feature descriptions → Link to: docs/planning/spikes/FEATURE_NAME.md
- Risk assessments → Update: docs/planning/COMPLIANCE_REVIEW_FRAMEWORK.md
```

---

## 2. Planning & Framework Documents

### 2.1 Discovery Spike Template ➔ All Feature Spikes

**File:** `docs/planning/DISCOVERY_SPIKE_TEMPLATE.md`

**Purpose:** Standardized template for all Phase 6 feature planning

**Outgoing References:**
- Template for: `docs/planning/spikes/FE_UI_LOADING_STATES_SPIKE.md` (example implementation)
- Referenced in: `master_todo.md` (Section 6.A - Discovery Spikes)
- Referenced in: `MASTER_ROADMAP.md` (Phase A planning section)

**Synchronization Rule:** When updating DISCOVERY_SPIKE_TEMPLATE.md:
1. All existing spike documents must be updated to match new template structure
2. New sections must be added to `FE_UI_LOADING_STATES_SPIKE.md` and other spikes
3. Template version number must be noted with change date
4. Update guidance in `master_todo.md` Section 6.A

**Change Impact Block (Add to DISCOVERY_SPIKE_TEMPLATE.md):**
```
## ⚠️ CHANGE IMPACT
When updating this template:
- New sections → Apply to all spike files in docs/planning/spikes/
- Changes to estimation process → Update: master_todo.md, MASTER_ROADMAP.md
- Changes to compliance section → Update: docs/planning/COMPLIANCE_REVIEW_FRAMEWORK.md
- Changes to testing section → Update: test-results/README.md, docs/testing/TESTING_MASTER.md
```

---

### 2.2 Feature Flag System ➔ Implementation Details

**File:** `docs/planning/FEATURE_FLAG_SYSTEM.md`

**Purpose:** Design of custom in-house feature flag infrastructure

**Outgoing References:**
- Implements requirements from: `MASTER_ROADMAP.md` (Phase 6 infrastructure)
- Code patterns in: `docs/planning/PHASE6_READINESS_SUMMARY.md` (implementation checklist)
- Referenced in: `master_todo.md` (Section 6.E - Feature Flag Implementation)
- Example usage in: `docs/planning/spikes/FE_UI_LOADING_STATES_SPIKE.md` (Smart Loading States deployment)

**Related Documents (Must Synchronize):**
- Backend API: `docs/api/README.md` (must document `/api/feature-flags/*` endpoints)
- Frontend components: `docs/frontend/COMPONENTS.md` (must document flag-related hooks)
- Deployment: `docs/deployment/PRODUCTION_DEPLOYMENT.md` (must include flag initialization)

**Synchronization Rule:** When implementing feature flags:
1. Database schema changes must be documented in `docs/architecture/00_DATA_MODELS.md`
2. API endpoints must be registered in `docs/api/COMBINED_API.md`
3. Frontend hooks must be documented in `docs/frontend/COMPONENTS.md`
4. Deployment procedure must update `docs/deployment/PRODUCTION_DEPLOYMENT.md`
5. Admin UI instructions must update `docs/features/settings.md`

**Change Impact Block (Add to FEATURE_FLAG_SYSTEM.md):**
```
## ⚠️ CHANGE IMPACT
When implementing or updating this system:
- Database changes → Update: docs/architecture/00_DATA_MODELS.md, docs/api/COMBINED_API.md
- API endpoint changes → Update: docs/api/README.md, docs/api/COMBINED_API.md
- Frontend hook changes → Update: docs/frontend/COMPONENTS.md
- Deployment changes → Update: docs/deployment/PRODUCTION_DEPLOYMENT.md
- Admin UI changes → Update: docs/features/settings.md
- Rollout strategy changes → Update: MASTER_ROADMAP.md, spike documentation
```

---

### 2.3 UX Metrics Baseline ➔ Measurement & Validation

**File:** `docs/planning/UX_METRICS_BASELINE.md`

**Purpose:** Framework for measuring Phase 6 finesse enhancement impact

**Outgoing References:**
- Measurement categories referenced in: `docs/planning/spikes/FE_UI_LOADING_STATES_SPIKE.md`
- Baseline data collection referenced in: `master_todo.md` (Section 6.F)
- Test infrastructure referenced in: `test-results/README.md`
- Analytics implementation referenced in: `docs/monitoring/IMPLEMENTATION.md`

**Related Documents (Must Synchronize):**
- Monitoring: `docs/monitoring/IMPLEMENTATION.md` (instrumentation details)
- Testing: `docs/testing/TESTING_MASTER.md` (test framework integration)
- Spike templates: All `docs/planning/spikes/*.md` (success criteria)
- Performance: `docs/reports/PERFORMANCE_BASELINE_DEC_2025.md` (baseline reference)

**Synchronization Rule:** When updating metrics framework:
1. New metric categories must be defined before spike implementations
2. Collection procedures must be documented in `docs/monitoring/IMPLEMENTATION.md`
3. Baseline values must be recorded in `test-results/baseline-metrics/`
4. Success criteria in spikes must reference metric thresholds
5. Reporting templates must document how metrics are tracked

**Change Impact Block (Add to UX_METRICS_BASELINE.md):**
```
## ⚠️ CHANGE IMPACT
When updating this framework:
- New metrics → Update: docs/monitoring/IMPLEMENTATION.md, spike documentation
- Baseline changes → Update: test-results/baseline-metrics/*.json
- Collection procedures → Update: docs/testing/TESTING_MASTER.md
- Reporting format → Update: docs/reports/PERFORMANCE_BASELINE_DEC_2025.md
- Success criteria → Update: all spikes in docs/planning/spikes/
```

---

### 2.4 Compliance Review Framework ➔ Regulatory Governance

**File:** `docs/planning/COMPLIANCE_REVIEW_FRAMEWORK.md`

**Purpose:** 3-level review process for regulatory compliance

**Outgoing References:**
- Pre-assessment ratings in: `MASTER_ROADMAP.md` (Phase 6 features)
- Spike compliance sections in: `docs/planning/spikes/FE_UI_LOADING_STATES_SPIKE.md`
- Referenced in: `master_todo.md` (Section 6.F compliance items)

**Related Documents (Must Synchronize):**
- Security: `docs/security/SECURITY.md` (regulatory requirements)
- Testing: `docs/testing/TESTING_MASTER.md` (compliance test procedures)
- Deployment: `docs/deployment/PRODUCTION_DEPLOYMENT.md` (security validation)

**Synchronization Rule:** When updating compliance framework:
1. New regulation categories must update spike compliance templates
2. Updated risk ratings must cascade to `MASTER_ROADMAP.md` priorities
3. Review process changes must update `docs/testing/TESTING_MASTER.md`
4. Regulatory requirement changes must update `docs/security/SECURITY.md`

**Change Impact Block (Add to COMPLIANCE_REVIEW_FRAMEWORK.md):**
```
## ⚠️ CHANGE IMPACT
When updating this framework:
- New regulations → Update: docs/security/SECURITY.md, spike templates
- Risk rating changes → Update: MASTER_ROADMAP.md priority sequence
- Review process changes → Update: docs/testing/TESTING_MASTER.md
- Regulatory requirements → Update: docs/deployment/PRODUCTION_DEPLOYMENT.md
```

---

### 2.5 Phase 6 Readiness Summary ➔ Implementation Checklist

**File:** `docs/planning/PHASE6_READINESS_SUMMARY.md`

**Purpose:** Executive summary with go/no-go recommendation and pre-flight checklist

**Outgoing References:**
- References all framework documents (feature flags, metrics, compliance)
- References `MASTER_ROADMAP.md` for Q1 feature sequence
- References `docs/planning/spikes/FE_UI_LOADING_STATES_SPIKE.md` as Q1 #1

**Synchronization Rule:** This is a **read-only summary document**
- Do not directly edit; it summarizes other documents
- When framework documents change, update corresponding checklist items
- Maintain alignment with `MASTER_ROADMAP.md` go/no-go status
- Keep pre-flight checklist in sync with `master_todo.md` completion status

---

## 3. Feature Spike Documents

### 3.1 Smart Loading States Spike ➔ Q1 #1 Implementation

**File:** `docs/planning/spikes/FE_UI_LOADING_STATES_SPIKE.md`

**Purpose:** Detailed specification for first Phase 6 feature (smart loading states)

**Outgoing References:**
- References: `DISCOVERY_SPIKE_TEMPLATE.md` (structure/sections)
- Referenced in: `MASTER_ROADMAP.md` (Q1 #1 detailed plan)
- Referenced in: `master_todo.md` (Section 6.B)
- References: `FEATURE_FLAG_SYSTEM.md` (deployment strategy)
- References: `UX_METRICS_BASELINE.md` (success criteria)
- References: `COMPLIANCE_REVIEW_FRAMEWORK.md` (compliance assessment)

**Change Impact Block (Add to FE_UI_LOADING_STATES_SPIKE.md):**
```
## ⚠️ CHANGE IMPACT
When updating this spike:
- Effort/timeline changes → Update: MASTER_ROADMAP.md, master_todo.md
- ROI/cost changes → Update: MASTER_ROADMAP.md, PHASE6_READINESS_SUMMARY.md
- Scope changes → Update: DISCOVERY_SPIKE_TEMPLATE.md if pattern changes
- Success criteria → Update: UX_METRICS_BASELINE.md baseline targets
- Risk assessment → Update: COMPLIANCE_REVIEW_FRAMEWORK.md ratings
- Design files → Link to: Figma (TBD - add URL when available)
- Component implementations → Document in: docs/frontend/COMPONENTS.md
```

**Future Spikes (Apply Same Pattern):**
- `docs/planning/spikes/FE_ENHANCED_ERROR_MESSAGES_SPIKE.md` (Q1 #2)
- `docs/planning/spikes/FE_KEYBOARD_SHORTCUTS_SPIKE.md` (Q1 #3)
- `docs/planning/spikes/BE_PREDICTIVE_PREFETCH_SPIKE.md` (Q2 #1)
- And 6+ more for Q2/Q3

---

## 4. Supporting Documentation

### 4.1 Finesse Enhancements Guide ➔ Enhancement Catalog

**File:** `docs/developer/finesse-enhancements.md`

**Purpose:** Master catalog of 50+ Phase 6 enhancement opportunities

**Outgoing References:**
- Referenced in: `MASTER_ROADMAP.md` (source of enhancement list)
- Referenced in: `master_plan.md` (Phase 6 vision)
- Referenced in: `docs/reports/FINESSE_DIAGNOSTIC_SYNC_2025_12_10.md` (diagnostic)

**Synchronization Rule:** This is a **master catalog**
- Serves as source of truth for all Phase 6 planning
- When new enhancements discovered, update this document first
- Each enhancement entry should have Phase 6 mapping status (e.g., "Q1 #1", "Q2 #3", "Future")
- Changes here cascade to roadmap and spike documents

---

### 4.2 Architecture Documents ➔ System Foundation

**Files:**
- `docs/architecture/CORE_ARCHITECTURE.md` (backend system design)
- `docs/architecture/ELECTRON_ARCHITECTURE.md` (desktop integration)
- `docs/architecture/00_TECH_STACK.md` (technology choices)
- `docs/architecture/00_DATA_MODELS.md` (database schema)

**Cross-References:**
- Referenced in: `master_plan.md` (strategic context)
- Referenced in: Feature spikes (technical constraints)
- Must be updated when: Feature flag system adds database tables
- Must be updated when: Phase 6 spikes introduce new services

**Synchronization Rule:** When updating architecture:
1. Changes to data models must be reflected in API documentation
2. Changes to backend services must update `docs/api/COMBINED_API.md`
3. Changes to security architecture must update `docs/security/SECURITY.md`
4. Changes to Electron architecture must update deployment docs

**Change Impact Block (Add to architecture documents):**
```
## ⚠️ CHANGE IMPACT
When updating this architecture document:
- Database schema changes → Update: docs/architecture/00_DATA_MODELS.md, docs/api/COMBINED_API.md
- Service changes → Update: docs/api/README.md, docs/architecture/CORE_ARCHITECTURE.md
- Security changes → Update: docs/security/SECURITY.md, docs/deployment/PRODUCTION_DEPLOYMENT.md
- Electron changes → Update: docs/architecture/ELECTRON_ARCHITECTURE.md, docs/deployment/README.md
```

---

### 4.3 API Documentation ➔ Endpoint Reference

**Files:**
- `docs/api/README.md` (API overview)
- `docs/api/COMBINED_API.md` (comprehensive endpoint list)

**Cross-References:**
- Referenced in: `docs/deployment/PRODUCTION_DEPLOYMENT.md`
- Referenced in: Feature spikes (endpoint specifications)
- Referenced in: Frontend documentation

**Synchronization Rule:** When API changes:
1. Endpoint additions must cascade to `COMBINED_API.md`
2. Breaking changes must be documented in spike implementation guides
3. Feature flag endpoints must document gradual rollout strategy
4. Metrics endpoints must reference `UX_METRICS_BASELINE.md`

---

### 4.4 Deployment Documentation ➔ Production Operations

**Files:**
- `docs/deployment/README.md` (main deployment guide)
- `docs/deployment/PRODUCTION_DEPLOYMENT.md` (production-specific)
- `docs/deployment/CI_CD_STRATEGY.md` (automation)
- `docs/deployment/configuration.md` (config management)
- `docs/deployment/monitoring.md` (observability)
- `docs/deployment/backup-recovery.md` (data protection)
- `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md` (problem resolution)

**Cross-References:**
- All reference: `docs/architecture/` (system context)
- All reference: `docs/security/SECURITY.md` (security practices)
- Spike implementations must update: deployment checklists

**Synchronization Rule:** When deploying Phase 6 features:
1. Feature flag initialization must be documented in `PRODUCTION_DEPLOYMENT.md`
2. Metrics instrumentation must be added to monitoring docs
3. Database migrations must be added to deployment procedures
4. Rollback procedures must be defined for each feature

---

### 4.5 Testing Documentation ➔ Quality Assurance

**Files:**
- `docs/testing/TESTING_MASTER.md` (comprehensive test strategy)
- `test-results/README.md` (test infrastructure)

**Cross-References:**
- All spike implementations reference testing requirements
- Compliance framework references test procedures
- Performance baseline references test metrics

**Synchronization Rule:** When testing Phase 6 features:
1. New test categories must be added to `TESTING_MASTER.md`
2. Test results must be organized in `test-results/` structure
3. Performance baselines must update `test-results/baseline-metrics/`
4. Compliance tests must reference `COMPLIANCE_REVIEW_FRAMEWORK.md`

---

## 5. Documentation Index ➔ Central Navigation

**File:** `docs/DOCUMENTATION_INDEX.md` (or main `docs/README.md`)

**Purpose:** Central directory of all documentation

**Cross-References:**
- Lists all major sections: Architecture, Features, Guides, Deployment, etc.
- Should include links to: Planning documents, Master documents, Roadmaps

**Synchronization Rule:** When creating new documentation:
1. Add entry to appropriate section of `DOCUMENTATION_INDEX.md`
2. Update main `docs/README.md` with new links
3. If creating new category, add section header

---

## 6. Diagnostic & Report Documents

### 6.1 Finesse Diagnostic Report

**File:** `docs/reports/FINESSE_DIAGNOSTIC_SYNC_2025_12_10.md`

**Purpose:** Comprehensive audit of finesse enhancements and documentation synchronization

**Type:** **Read-only diagnostic** (generated artifact)
- Source of truth: `docs/developer/finesse-enhancements.md`
- References: All planning and roadmap documents

---

### 6.2 Performance Baseline Report

**File:** `docs/reports/PERFORMANCE_BASELINE_DEC_2025.md`

**Purpose:** Current-state performance metrics

**Cross-References:**
- Referenced in: `UX_METRICS_BASELINE.md` (baseline comparison)
- Referenced in: Spike success criteria (improvement targets)
- Updated by: Test collection procedures

---

## 7. Synchronization Procedures

### 7.1 For Agents Updating Documentation

**Before making changes:**
1. Read the "Change Impact" block at top of document (if present)
2. Identify all documents listed as affected
3. Read this synchronization guide for those documents
4. Plan changes across all affected documents simultaneously

**After making changes:**
1. Update change impact blocks in all affected documents
2. Verify all cross-references are accurate (use grep to check)
3. Update version dates/timestamps
4. If major structural change: Run documentation link checker

**Example Workflow:**
```
Task: Update feature flag implementation timeline from 1-2 days to 3-4 days

1. Find impact: Check FEATURE_FLAG_SYSTEM.md change impact block
2. Affected docs: MASTER_ROADMAP.md, master_todo.md, PHASE6_READINESS_SUMMARY.md
3. Update: Change effort estimates in all 4 documents
4. Update: timeline changes in MASTER_ROADMAP.md Phase 6 section
5. Update: task duration in master_todo.md Section 6.E
6. Update: readiness checklist in PHASE6_READINESS_SUMMARY.md
7. Verify: All cross-references still accurate
8. Document: "Updated feature flag timeline" in each affected document
```

### 7.2 For Master Document Updates

**When updating master_plan.md, master_todo.md, or MASTER_ROADMAP.md:**
1. Changes are **high-impact** and cascade to many documents
2. Before editing, review Section 1 above for all dependencies
3. Use multi_replace_string_in_file to update all affected documents simultaneously
4. Always update timestamps on all touched documents
5. Run comprehensive grep search to verify cross-references

**Example:** Changing Q1 priorities
- Update: MASTER_ROADMAP.md (feature sequence)
- Update: master_todo.md (task order)
- Update: FE_UI_LOADING_STATES_SPIKE.md (if Q1 #1 changes)
- Update: COMPLIANCE_REVIEW_FRAMEWORK.md (if risk tiers change)
- Verify: All spike documents still reference correct priorities

### 7.3 Documentation Link Checker

**Command to run after major changes:**
```bash
# Install lychee (macOS)
brew install lychee

# Run link checker on docs
lychee docs/ --exclude node_modules
```

**Alternative (if lychee unavailable):**
```bash
# Find broken links manually
grep -r "\[.*\](.*)" docs/ --include="*.md" | grep -v "http" | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  link=$(echo "$line" | grep -o "\[.*\]" | grep -o "(.*)" | tr -d '()')
  echo "Check: $link in $file"
done
```

---

## 8. Critical Synchronization Matrix

This matrix shows which documents must be updated together:

| Primary Document | Must Update | Reason | Urgency |
| :--- | :--- | :--- | :--- |
| **master_plan.md** | master_todo.md, MASTER_ROADMAP.md | Strategic changes cascade | 🔴 Critical |
| **master_todo.md** | master_plan.md, spike docs | Task changes affect timeline | 🔴 Critical |
| **MASTER_ROADMAP.md** | master_todo.md, spike docs, PHASE6_READINESS_SUMMARY.md | Timeline impacts tasks | 🔴 Critical |
| **DISCOVERY_SPIKE_TEMPLATE.md** | All spikes in docs/planning/spikes/ | Structure affects all spikes | 🟠 High |
| **FEATURE_FLAG_SYSTEM.md** | docs/api/*, docs/frontend/*, docs/deployment/* | Implementation affects multiple layers | 🟠 High |
| **UX_METRICS_BASELINE.md** | docs/monitoring/*, test-results/*, spike docs | Measurement affects all features | 🟠 High |
| **COMPLIANCE_REVIEW_FRAMEWORK.md** | MASTER_ROADMAP.md, spike docs | Risk affects priorities | 🟠 High |
| **Architecture docs** | docs/api/*, docs/deployment/*, docs/security/* | Foundation affects all systems | 🟠 High |
| **API docs** | docs/frontend/*, deployment docs | Endpoints affect implementation | 🟡 Medium |
| **Deployment docs** | docs/security/*, docs/monitoring/* | Operations affects all systems | 🟡 Medium |
| **Spike docs** | MASTER_ROADMAP.md, master_todo.md | Details inform timeline | 🟡 Medium |

---

## 9. Automated Synchronization Checklist

Use this checklist after any documentation change:

- [ ] All change impact blocks updated with affected documents
- [ ] Cross-references verified with grep (no 404 links)
- [ ] Version dates updated on all touched documents
- [ ] Related spike documents reviewed for consistency
- [ ] master_plan.md consistency checked (if strategic change)
- [ ] master_todo.md consistency checked (if task change)
- [ ] MASTER_ROADMAP.md consistency checked (if timeline change)
- [ ] Documentation index (docs/README.md) updated (if new doc created)
- [ ] Link checker run successfully (no broken links)
- [ ] Commit message references sync documentation requirement

---

## 10. Quick Reference: Which Docs Link Where

### Incoming Links (Most Referenced)
1. **MASTER_ROADMAP.md** — 8+ documents link here
2. **docs/architecture/CORE_ARCHITECTURE.md** — 6+ documents
3. **docs/planning/FEATURE_FLAG_SYSTEM.md** — 5+ documents
4. **docs/api/README.md** — 5+ documents
5. **docs/security/SECURITY.md** — 4+ documents

### Outgoing Links (Most Links Reference Other Docs)
1. **master_plan.md** — 8+ outgoing links
2. **MASTER_ROADMAP.md** — 7+ outgoing links
3. **docs/deployment/PRODUCTION_DEPLOYMENT.md** — 6+ outgoing links
4. **FE_UI_LOADING_STATES_SPIKE.md** — 5+ outgoing links

### Bidirectional Links (Should Update Both Ways)
- master_plan.md ↔ master_todo.md
- master_todo.md ↔ MASTER_ROADMAP.md
- spike documents ↔ MASTER_ROADMAP.md
- FEATURE_FLAG_SYSTEM.md ↔ docs/api/README.md

---

## 11. Special Cases & Exceptions

### External Links (No Synchronization Required)
- GitHub releases/repo links
- External documentation (React, Electron, FastAPI, etc.)
- Third-party services (Figma, analytics platforms)

### Template Documents (Require Cascading Updates)
- DISCOVERY_SPIKE_TEMPLATE.md → applies to all future spikes
- Any template changes must be applied to existing instances

### Read-Only Documents (No Direct Updates)
- PHASE6_READINESS_SUMMARY.md (summary of other docs)
- FINESSE_DIAGNOSTIC_SYNC_2025_12_10.md (diagnostic report)
- Performance baseline reports (generated from tests)

### Documents Under Development (May Have Incomplete Links)
- TBD design system links (Figma files, etc.)
- TBD API endpoint implementations
- TBD compliance checklist details

---

## 12. Synchronization Incident Response

**If you discover a broken cross-reference:**
1. Note the broken link (e.g., "master_todo.md references FEATURE_FLAG_SYSTEM.md but section 6.E is missing")
2. Check if the referenced section exists in the target document
3. If missing: Add the missing section to target document
4. If exists but moved: Update the link to new location
5. Run link checker to find all other instances of broken reference
6. Update all instances simultaneously

**If documents diverge (e.g., different timelines for same feature):**
1. Identify which document has most recent timestamp
2. Treat recent document as source of truth
3. Update older documents to match
4. Document the sync in commit message

---

## Summary

This guide establishes **comprehensive cross-reference tracking** for the documentation system. Key principles:

1. **All cross-references must be bidirectional** — if A links to B, B should link back to A
2. **Change impact blocks** — every document should declare what it affects
3. **Master documents are critical** — changes to master_plan.md, master_todo.md, or MASTER_ROADMAP.md cascade widely
4. **Spike documents are templates** — changes to DISCOVERY_SPIKE_TEMPLATE.md apply to all spikes
5. **Framework documents are foundational** — changes to Feature Flag System, UX Metrics, or Compliance framework affect multiple layers
6. **Synchronization is mandatory** — never update a document without checking its impact matrix

**For all agents reading this:** When updating any markdown file, follow the "Change Impact Block" guidance at the top of the document and refer to this guide for cascade requirements.
