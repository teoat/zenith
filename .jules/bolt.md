## 2026-01-08 - Analytics Aggregation Optimization
**Learning:** Consolidating multiple separate COUNT queries into a single query using conditional aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) or `GROUP BY` significantly reduces database round-trips. In `get_case_analytics`, 3 separate queries were replaced with 1 `GROUP BY` query, with totals calculated in memory.
**Action:** When calculating multiple metrics from the same table (e.g., total vs. filtered subset), prefer a single aggregation query over multiple separate `count()` calls.
