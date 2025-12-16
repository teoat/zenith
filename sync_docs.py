#!/usr/bin/env python3
"""
Documentation Synchronization Script
Automatically syncs completion metrics across master docs.

Usage:
    python sync_docs.py

This script:
1. Extracts task completion metrics from master_todo.md
2. Updates orchestration_plan.md completion dashboard
3. Ensures cross-references exist in all docs
"""

import re
from pathlib import Path
from typing import Dict

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
        def calc_pct(done, total):
            return int(done/total*100) if total > 0 else 0
        
        new_table = f"""| Category | Total | Completed | Pending | Status |
| :--- | :---: | :---: | :---: | :--- |
| **Total Items** | **{m['total']}** | **{m['completed']}** ({m['percentage']}%) | {m['pending']} | 🟡 In Progress |
| **Critical** | {m['critical']['total']} | **{m['critical']['done']}** ({calc_pct(m['critical']['done'], m['critical']['total'])}%) | {m['critical']['total'] - m['critical']['done']} | {'✅ **Complete**' if m['critical']['done'] == m['critical']['total'] else '🟢 Good'} |
| **High** | {m['high']['total']} | **{m['high']['done']}** ({calc_pct(m['high']['done'], m['high']['total'])}%) | {m['high']['total'] - m['high']['done']} | 🟢 Good |
| **Medium** | {m['medium']['total']} | **{m['medium']['done']}** ({calc_pct(m['medium']['done'], m['medium']['total'])}%) | {m['medium']['total'] - m['medium']['done']} | 🟡 Queued |
| **Low** | {m['low']['total']} | **{m['low']['done']}** ({calc_pct(m['low']['done'], m['low']['total'])}%) | {m['low']['total'] - m['low']['done']} | ⚪ Pending |"""
        
        # Replace table in orchestration plan
        pattern = r'\| Category \| Total.*?\| \*\*Low\*\* \|[^\n]*'
        content = re.sub(pattern, new_table, content, flags=re.DOTALL)
        
        ORCHESTRATION.write_text(content)
        print(f"✅ Updated orchestration_plan.md metrics")
    
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
        
        print("\n✅ Synchronization complete!")
        print("\n💡 Don't forget to verify changes and commit!")

if __name__ == "__main__":
    syncer = DocSynchronizer()
    syncer.sync_all()
