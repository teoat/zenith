## 2026-01-07 - Temporal Burst Detector Optimization
**Learning:** Replacing iterative queries inside a loop with a single `GROUP BY` or aggregated `case` query can drastically reduce database round-trips. In `detect_burst`, a loop of 12 queries was replaced by a single query using 13 `func.sum(case(...))` expressions.
**Action:** Always check for loops that execute SQL queries (N+1 problem) and attempt to consolidate them into a single query using aggregation, `case` statements, or `GROUP BY`.
