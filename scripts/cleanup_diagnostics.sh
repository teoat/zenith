#!/bin/bash
mkdir -p archive/diagnostics_2026_01_07
mv *DIAGNOSTIC.md archive/diagnostics_2026_01_07/ 2>/dev/null
mv *REPORT.md archive/diagnostics_2026_01_07/ 2>/dev/null
mv *EXECUTION_REPORT.md archive/diagnostics_2026_01_07/ 2>/dev/null
mv *COMPLETION_REPORT.md archive/diagnostics_2026_01_07/ 2>/dev/null
mv *SUMMARY.md archive/diagnostics_2026_01_07/ 2>/dev/null
mv *CHECKLIST.md archive/diagnostics_2026_01_07/ 2>/dev/null
mv *PLAN.md archive/diagnostics_2026_01_07/ 2>/dev/null
mv *AUDIT.md archive/diagnostics_2026_01_07/ 2>/dev/null
echo "Cleanup complete. Diagnostic reports archived."
