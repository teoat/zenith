# Documentation Synchronization Guide

## Purpose
Ensure `master_plan.md`, `master_todo.md`, and `orchestration_plan.md` remain consistent with accurate completion metrics, task statuses, and cross-references.

## Synchronization Points

### 1. Completion Metrics (MUST match across all docs)

**Source of Truth:** `master_todo.md` → Status Dashboard

**Fields to Sync:**
- Total Tasks
- Completed Count & Percentage  
- Phase Status (Completed, In Progress, Pending)
- Priority Distribution (Critical, High, Medium, Low)

**Sync Targets:**
- `orchestration_plan.md` → Completion Dashboard table
- Phase summary tables in both docs

### 2. Phase Task Status (Checklist ↔ Summary Tables)

**Master Source:** `master_todo.md` checklist items `[x]` or `[ ]`

**Derived Targets:**
- `orchestration_plan.md` → Phase 3/4/5 Summary Dashboard tables
- Status icons: ✅ DONE, 🟡 IN PROGRESS, ⚪ Pending

### 3. Cross-References (All docs must link to each other)

**Required Links (top of each file):**
```markdown
> **LINKS:** [Master Plan](master_plan.md) | [Master Todo](master_todo.md) | [Orchestration Plan](orchestration_plan.md) | [Testing Strategy](testing_strategy.md)

> **DOCUMENTATION:** [User Guides](user-guides/) | [Deployment](deployment/) | [API](API.md) | [Troubleshooting](TROUBLESHOOTING.md)
```

## Synchronization Rules

### Rule 1: Task Completion Count
When marking a task as `[x]` in `master_todo.md`:
1. Increment "Completed" count in Status Dashboard
2. Update percentage: `(completed / total) * 100`
3. Copy same numbers to `orchestration_plan.md` Completion Dashboard
4. Update corresponding Phase Summary table status to ✅ DONE

### Rule 2: Phase Status Updates
When a phase reaches milestones:
- **0-25% complete:** ⚪ Pending
- **26-75% complete:** 🟡 In Progress  
- **76-99% complete:** 🟡 Near Complete
- **100% complete:** ✅ COMPLETED

Update this status in:
- `master_todo.md` → Active Phase line
- `orchestration_plan.md` → Active Phase Status table

### Rule 3: Priority Totals
When adding/completing priority tasks:
1. Recount tasks by priority (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low)
2. Update both Status Dashboard and Completion Dashboard tables
3. Ensure row totals match overall Total Tasks

## Automated Synchronization Script

### Prerequisites
```bash
pip install pyyaml
```

### Sync Script: `sync_docs.py`

```python
#!/usr/bin/env python3
"""
Documentation Synchronization Script
Automatically syncs completion metrics across master docs.
"""

import re
from pathlib import Path
from typing import Dict, Tuple

# File paths
MASTER_TODO = Path("master_todo.md")
ORCHESTRATION = Path("orchestration_plan.md")
MASTER_PLAN = Path("master_plan.md")
TESTING_STRATEGY = Path("testing_strategy.md")

class DocSynchronizer:
    def __init__(self):
        self.metrics = {}
        
    def extract_metrics(self) -> Dict:
        """Extract completion metrics from master_todo.md"""
        content = MASTER_TODO.read_text()
        
        # Extract task counts
        total = len(re.findall(r'^\s*- \[(x| )\]', content, re.MULTILINE))
        completed = len(re.findall(r'^\s*- \[x\]', content, re.MULTILINE))
        percentage = int((completed / total * 100)) if total > 0 else 0
        
        # Extract by priority
        critical_total = len(re.findall(r'🔴 Critical.*\[(x| )\]', content))
        critical_done = len(re.findall(r'🔴 Critical.*\[x\]', content))
        
        high_total = len(re.findall(r'🟠 High.*\[(x| )\]', content))
        high_done = len(re.findall(r'🟠 High.*\[x\]', content))
        
        medium_total = len(re.findall(r'🟡 Medium.*\[(x| )\]', content))
        medium_done = len(re.findall(r'🟡 Medium.*\[x\]', content))
        
        low_total = len(re.findall(r'🟢 Low.*\[(x| )\]', content))
        low_done = len(re.findall(r'🟢 Low.*\[x\]', content))
        
        self.metrics = {
            'total': total,
            'completed': completed,
            'percentage': percentage,
            'pending': total - completed,
            'critical': {'total': critical_total, 'done': critical_done},
            'high': {'total': high_total, 'done': high_done},
            'medium': {'total': medium_total, 'done': medium_done},
            'low': {'total': low_total, 'done': low_done},
        }
        
        return self.metrics
    
    def update_orchestration_metrics(self):
        """Update completion dashboard in orchestration_plan.md"""
        content = ORCHESTRATION.read_text()
        m = self.metrics
        
        # Build new completion table
        new_table = f"""| Category | Total | Completed | Pending | Status |
| :--- | :---: | :---: | :---: | :--- |
| **Total Items** | **{m['total']}** | **{m['completed']}** ({m['percentage']}%) | {m['pending']} | 🟡 In Progress |
| **Critical** | {m['critical']['total']} | **{m['critical']['done']}** ({int(m['critical']['done']/m['critical']['total']*100) if m['critical']['total'] > 0 else 0}%) | {m['critical']['total'] - m['critical']['done']} | {'✅ **Complete**' if m['critical']['done'] == m['critical']['total'] else '🟡 In Progress'} |
| **High** | {m['high']['total']} | **{m['high']['done']}** ({int(m['high']['done']/m['high']['total']*100) if m['high']['total'] > 0 else 0}%) | {m['high']['total'] - m['high']['done']} | 🟢 Good |
| **Medium** | {m['medium']['total']} | **{m['medium']['done']}** ({int(m['medium']['done']/m['medium']['total']*100) if m['medium']['total'] > 0 else 0}%) | {m['medium']['total'] - m['medium']['done']} | 🟡 Queued |
| **Low** | {m['low']['total']} | **{m['low']['done']}** ({int(m['low']['done']/m['low']['total']*100) if m['low']['total'] > 0 else 0}%) | {m['low']['total'] - m['low']['done']} | ⚪ Pending |"""
        
        # Replace table in orchestration plan
        pattern = r'\| Category \| Total.*?\| \*\*Low\*\* \|[^\n]*'
        content = re.sub(pattern, new_table, content, flags=re.DOTALL)
        
        ORCHESTRATION.write_text(content)
        print(f"✅ Updated orchestration_plan.md metrics")
    
    def sync_cross_references(self):
        """Ensure all docs have proper cross-references"""
        links_block = """> **LINKS:** [Master Plan](master_plan.md) | [Master Todo](master_todo.md) | [Orchestration Plan](orchestration_plan.md) | [Testing Strategy](testing_strategy.md)

> **DOCUMENTATION:** [User Guides](user-guides/) | [Deployment](deployment/) | [API](API.md) | [Troubleshooting](TROUBLESHOOTING.md)"""
        
        for doc_path in [MASTER_PLAN, MASTER_TODO, ORCHESTRATION]:
            content = doc_path.read_text()
            if "**DOCUMENTATION:**" not in content:
                # Insert after first header
                lines = content.split('\n')
                header_idx = 0
                for i, line in enumerate(lines):
                    if line.startswith('> **LINKS:**'):
                        header_idx = i
                        break
                
                if header_idx > 0:
                    # Replace old links with new comprehensive links
                    lines[header_idx:header_idx+1] = links_block.split('\n')
                    doc_path.write_text('\n'.join(lines))
                    print(f"✅ Updated cross-references in {doc_path.name}")
    
    def sync_all(self):
        """Run full synchronization"""
        print("📊 Extracting metrics from master_todo.md...")
        self.extract_metrics()
        
        print(f"\n📈 Completion Status:")
        print(f"   Total: {self.metrics['completed']}/{self.metrics['total']} ({self.metrics['percentage']}%)")
        print(f"   Critical: {self.metrics['critical']['done']}/{self.metrics['critical']['total']}")
        print(f"   High: {self.metrics['high']['done']}/{self.metrics['high']['total']}")
        
        print("\n🔄 Synchronizing documents...")
        self.update_orchestration_metrics()
        self.sync_cross_references()
        
        print("\n✅ Synchronization complete!")

if __name__ == "__main__":
    syncer = DocSynchronizer()
    syncer.sync_all()
```

## Usage Instructions

### Manual Synchronization Checklist

When updating any document, follow this checklist:

1. **Update master_todo.md first**
   - Mark tasks as `[x]` complete or `[ ]` pending
   - Update Status Dashboard counts manually

2. **Run sync script**
   ```bash
   python sync_docs.py
   ```

3. **Verify sync**
   - Check orchestration_plan.md Completion Dashboard matches
   - Verify Phase Summary tables reflect task statuses
   - Ensure cross-links are present

### Pre-Commit Hook (Automatic Sync)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
#Automatically sync docs before commit

python sync_docs.py

# Add updated files to commit
git add master_todo.md orchestration_plan.md master_plan.md testing_strategy.md

echo "✅ Documentation synchronized automatically"
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Validation Rules

### Critical Validation Checks

Before committing any documentation changes:

```bash
# Check 1: Completion percentages match
grep -E "Completed.*\([0-9]+%\)" master_todo.md orchestration_plan.md

# Check 2: Total task count is consistent
grep -E "Total.*:.*[0-9]+" master_todo.md orchestration_plan.md

# Check 3: All docs have cross-references
grep -c "**LINKS:**" master_*.md orchestration_plan.md testing_strategy.md
```

### Expected Output
All checks should return matching values. If not, run `sync_docs.py` again.

## Troubleshooting

### Issue: Metrics Don't Match
**Solution:** Always treat `master_todo.md` as source of truth. Re-run sync script.

### Issue: Phase Status Confusion
**Solution:** Count checkboxes in each phase section manually, update summary tables.

### Issue: Cross-References Missing
**Solution:** Run `sync_cross_references()` function from sync script.

## Maintenance

### Weekly Review
- [ ] Verify all docs have matching completion %
- [ ] Check Phase statuses are accurate
- [ ] Ensure cross-links work
- [ ] Update sync script if new fields added

### When Adding New Tasks
1. Add to `master_todo.md` with proper priority emoji
2. Run `sync_docs.py`
3. Add detailed task definition to `orchestration_plan.md` if needed
4. Update `master_plan.md` if architectural changes required
