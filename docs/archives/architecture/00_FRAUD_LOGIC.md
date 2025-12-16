# 🧠 Centralized Fraud Logic & Algorithms

**Scope:** Global Fraud Detection Engine
**Status:** ✅ Approved Standard
**Version:** 1.1 (Enhanced)

This document defines the core logic used across **Reconciliation**, **Forensics**, and **Frenly AI**.

---

## 1. Matching Logic (Reconciliation)

### A. Fuzzy Text Matching
Used to link Bank Statement descriptions to Internal Invoice records.
*   **Library:** `thefuzz` (Python)
*   **Algorithm:** Weighted Ratio of Levenshtein Distance.
*   **Parameters:**
    *   `threshold`: Configurable (Default: 80). Matches < Threshold are rejected.
    *   `stop_words`: ["LLC", "Inc", "Pty", "Ltd", "The"]. Removed before matching.

### B. Amount Matching Strategy
*   **Exact Match:** `abs(A - B) < 0.01`
*   **Tolerance Match:** `abs(A - B) <= (A * Config.tolerance_percent)` (Default 1% variance allowed for FX/Fees).
*   **Force Balancing:** If variance < $0.05, auto-post to "Rounding Error".

### C. "Ghost" Matching (Behavioral)
Matches without a common ID, based on recurrence.
*   **Formula:**
    ```python
    IF (Same Day of Month ± 2 days) 
    AND (Same Amount ± 1%) 
    AND (FuzzyMatch(MerchantNameA, MerchantNameB) > 70)  # <-- Added Fuzzy Check
    AND (Same Vendor Category) 
    THEN Match
    ```

---

## 2. Fraud Pattern Detection (Forensics/AI)

### A. 🪞 Mirror Transactions ("Round Tripping")
Money leaving and returning to the same entity group to inflate revenue or wash funds.
*   **Logic:**
    1.  Find Outflow A -> B ($X).
    2.  Find Inflow B -> A ($X ± 2%).
    3.  Time Window: < 48 hours.
*   **Risk Score:** 95/100 (Critical)

### B. 🧱 Structuring ("Smurfing")
Breaking large transactions into small ones to avoid regulatory reporting thresholds (e.g., $10k).
*   **Logic (Multi-Window):**
    *   **Level 1 (Critical):** Sum > Threshold within **24 hours**.
    *   **Level 2 (High):** Sum > Threshold within **7 days**.
    *   **Level 3 (Medium):** Sum > Threshold within **30 days**.
*   **Threshold:** Configurable per client (Default: $10,000).

### C. 🐚 Shell Company Detector
Identifying fake vendors.
*   **Indicators:**
    1.  **Invoice Sequence:** Sequential invoices (e.g., #101, #102, #103) issued > 30 days apart.
    2.  **Benford's Law:** Leading digits of amounts deviate > 20% from standard distribution.
    3.  **Data Overlap:** Vendor Address == Employee Address.
    4.  **Verification (New):**
        *   **Domain Age:** Invoice email domain created < 30 days ago.
        *   **Address Type:** Google Places API returns "Residential" for a B2B vendor.

### D. 📍 Geospatial Anomaly
*   **Logic:** Transaction Location vs Project Site > `Config.geo_limit_km` (Default: 50km).
*   **Exception:** Category == "Travel" OR "Online Service".

---

## 3. Scoring & Aggregation

### Alert Scoring
Each individual alert has a base score.
*   `Mirroring`: 95
*   `Structuring`: 90
*   `Duplicate`: 70
*   `Unknown Pattern`: 50

### Hybrid Case Score
Allows AI models to modulate rule-based scores.

```python
def calculate_case_risk(alerts, ai_confidence_score):
    # Base Rule Score
    rule_score = max(a.score for a in alerts) if alerts else 0
    
    # Volume Booster
    count_boost = len(alerts) * 2
    
    # Hybrid Calculation
    # AI can increase certainty but cannot override a Critical Rule (90+)
    if rule_score >= 90:
        final_score = min(100, rule_score + count_boost)
    else:
        # Weighted Average: 60% Rule, 40% AI
        final_score = (rule_score['total'] * 0.6) + (ai_confidence_score * 0.4)
        
    return min(100, final_score)
```

---

## 4. Closed-Loop Tuning

**Feedback Mechanism:**
When an Analyst marks an Alert as **"False Positive"**:
1.  **Tag:** The transaction pair is tagged `safe_pair`.
2.  **Log:** The triggering values are logged (e.g., "Variance detected: 1.8%").
3.  **Auto-Tune:** If > 5 False Positives with similar variance (e.g., 1.8%), the system proposes updating `Config.tolerance_percent` to 1.9%.

---

> [!NOTE]
> All automated detection engines (Python backend or AI) must implement these rules to ensure consistency.
