# Deployment Documentation Consolidation Plan

> **Purpose**: Resolve duplicate deployment guides across root and docs/

---

## 📊 Current State

### Root Directory Deployment Files
1. `PRODUCTION_MASTER_SHEET.md` - **PRIMARY** (most recent)
2. `deployment.md` - Legacy deployment guide
3. `deployment2.md` - Deployment variant

### docs/ Directory Deployment Files
1. `docs/06-operations/production_operations.md` - Operations deployment guide
2. Potential duplicate in `docs/deployment/` (if exists)

---

## 🎯 Consolidation Strategy

### Phase 1: Review (Hours: 1-2)
```bash
# Compare files to understand differences
diff deployment.md docs/06-operations/production_operations.md
diff deployment2.md docs/06-operations/production_operations.md 2>&1 | head -50
```

### Phase 2: Merge (Hours: 2-3)
```bash
# Keep PRODUCTION_MASTER_SHEET.md as authoritative source
# Merge unique content from other files into it
# Add cross-references between files
```

### Phase 3: Archive (Hours: 0.5)
```bash
# Create archive for old versions
mkdir -p docs/archive/deployment/

# Move legacy files
mv deployment.md docs/archive/deployment/deployment_v1.md
mv deployment2.md docs/archive/deployment/deployment_v2.md
```

### Phase 4: Update Index (Hours: 0.5)
```bash
# Update 01_DOCUMENTATION_INDEX.md
# Mark consolidation as complete
# Add migration notes
```

---

## 📋 Action Checklist

- [ ] Review all deployment files
- [ ] Identify unique content in each file
- [ ] Merge content into PRODUCTION_MASTER_SHEET.md
- [ ] Archive legacy versions
- [ ] Update cross-references
- [ ] Update 01_DOCUMENTATION_INDEX.md
- [ ] Remove root-level duplicates

---

## 🔍 Questions to Answer

1. Which file is the most current and complete?
2. What unique content exists in each duplicate?
3. Are there conflicting procedures that need resolution?
4. Which format/style should be authoritative?

---

## 📈 Expected Outcome

**Before:**
- 3 deployment guides (1 root, 2 docs/)
- Duplicate procedures
- Confusing references
- No single source of truth

**After:**
- 1 comprehensive deployment guide (PRODUCTION_MASTER_SHEET.md)
- Archived historical versions
- Clear cross-references
- Single authoritative source

---

**Owner**: DevOps Team
**Est. Time**: 4-6 hours
**Priority**: Medium
