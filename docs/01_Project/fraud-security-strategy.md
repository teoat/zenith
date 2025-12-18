# Fraud and Security Strategy

## Plain-Language Fraud Orchestration Framework

**Goal:** Make fraud investigation understandable to common people, judges, and juries.  
**Principle:** "If a 12-year-old cannot understand it, it's not ready for court."

### The WHAT-WHEN-HOW-WHY Framework
Every page must answer these questions progressively:

```
┌─────────────────────────────────────────────────────────────┐
│ WHAT happened?        → Evidence Lab, Reconciliation        │
│ "Money went missing"                                        │
├─────────────────────────────────────────────────────────────┤
│ WHEN did it happen?   → Timeline, Visualization            │
│ "Between March-July, every Friday at 4:30pm"                │
├─────────────────────────────────────────────────────────────┤
│ HOW was it done?      → Investigation, Visualization       │
│ "Fake invoices from shell company"                          │
├─────────────────────────────────────────────────────────────┤
│ WHY (Mens Rea)?       → AI Insights, Pattern Analysis      │
│ "Deliberately structured to avoid detection"                │
└─────────────────────────────────────────────────────────────┘
```

### Progressive Disclosure Model

#### Level 1: Executive Summary (30 seconds)
**Location:** Dashboard cards, Report header

```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 FRAUD DETECTED                                           │
│                                                             │
│ "$47,500 was diverted from project funds to personal       │
│  account through fake vendor invoices."                     │
│                                                             │
│ Confidence: ████████░░ 85%    Period: Mar-Jul 2024         │
│                                                             │
│ [View Evidence] [See Timeline] [Read Full Report]          │
└─────────────────────────────────────────────────────────────┘
```

#### Level 2: Visual Story (2 minutes)
**Location:** Visualization, Investigation Canvas

## Comprehensive Fraud & AML Typologies Diagnosis

**Purpose:** Catalog "all known" fraud and money laundering methods and map them to Simple378's current capabilities.  
**Status:** Diagnosis Phase  
**Date:** 2025-12-10

### Money Laundering Typologies

| Typology | Description | Current Coverage | Proposed Enhancement | Integration Method |
|----------|-------------|------------------|----------------------|-------------------|
| **Structuring (Smurfing)** | Breaking large transactions into smaller ones to avoid thresholds. | ✅ Strong | Existing rule. | **Static Rule**: `count(txn) > N` where `$9k < amount < $10k`. |
| **Layering** | Moving funds rapidly to distance from source. | ❌ Missing | **New Rule**: "Rapid Pass-Through". | **Behavioral Analysis**: Calculate `residence_time` of funds. `Time(Out) - Time(In) < 1h`. |
| **Integration** | Re-entering laundered funds (property, sham loans). | ❌ Missing | **RAG**: Red flags list. | **RAG/Context**: AI searches `typologies/integration.md` to highlight "Property Real Estate" keywords in evidence. |
| **Trade-Based ML (TBML)** | Over/under-invoicing, phantom shipments. | ❌ Missing | **Enhancement**: OCR Matching. | **New Service**: `DocumentAnalysisService` extracts invoice totals ↔ matches transaction amount. |
| **Money Mules** | Individuals transferring stolen/laundered money. | ❌ Missing | **New Rule**: "Mule Profile". | **Behavioral Analysis**: `FlowRatio = TotalOut / TotalIn`. If ≈ 1.0 and Velocity High → Mule. |
| **Shell Companies** | Inactive companies used for maneuvers. | ⚠️ Partial | Disjoint entity analysis. | **Graph/Metadata**: Check Company Age < 6mo + High Vol. Link entities via `beneficial_owner` field. |
| **Cuckoo Smurfing** | 3rd party pays beneficiary without knowledge. | ❌ Missing | **RAG**: Interview context. | **Analyst Prompt**: Alert user to separate "Source of Funds" from "Sender". |
| **Transaction Laundering** | Using legitimate merchant to process illicit txns. | ❌ Missing | Web crawling. | **External API**: Use `GoogleSearchTool` or Crawler to verify Merchant URL matches Business Type. |

### Fraud Typologies

| Typology | Description | Current Coverage | Proposed Enhancement | Integration Method |
|----------|-------------|------------------|----------------------|-------------------|
| **Account Takeover (ATO)** | Unauthorized access to user accounts. | ⚠️ Partial | Device Fingerprinting. | **Metadata Rule**: `IP_Geo != User_Home_Geo` or `User_Agent` change detected in `login_logs`. |
| **Synthetic Identity** | Real SSN + Fake Name. | ❌ Missing | "SSN Scramble" check. | **Entity Resolution**: `SELECT count(DISTINCT name) FROM entities WHERE ssn = ?`. If > 1 → Synthetic. |
| **First-Party Fraud** | Bust-out / Friendly Fraud. | ❌ Missing | "Bust-Out Pattern". | **Time-Series**: Detect `CreditLimit` utilization spike → 100% followed by `PaymentFailure`. |
| **Ponzi Schemes** | Paying early investors with new funds. | ❌ Missing | "Hub-and-Spoke" flow. | **Graph Algo**: Cycle Detection. `A -> B -> C -> A`. Requires Graph DB or recursive SQL query. |
| **Invoice Fraud** | Fake invoices from scammers. | ❌ Missing | Vendor Matching. | **Fuzzy Matching**: Levenshtein distance on Vendor Name vs Master List (e.g., "M1crosoft" vs "Microsoft"). |
| **Payroll Fraud** | Ghost employees. | ❌ Missing | "Ghost Employee". | **Data Integrity**: `GROUP BY bank_account HAVING count(employee_id) > 1`. |
| **Elder Exploitation** | Coercing elderly victims. | ❌ Missing | "Vulnerable Person". | **Metadata Rule**: `Entity.age > 70` AND `Txn.recipient` in [Crypto, Offshore]. |

### Emerging & High-Tech Typologies (2024+)

| Typology | Description | Current Coverage | Proposed Enhancement | Integration Method |
|----------|-------------|------------------|----------------------|-------------------|
| **Authorized Push Payment (APP) Fraud** | Victim is manipulated into sending funds voluntarily (CEO Fraud, Impersonation). | ❌ Missing | **Session Behavioral Biometrics**. | **Telemetry**: Detect "Long Live Call" during transaction (Remote Access Tool indicator). **Behavior**: Alert if `New Payee` + `High Value` + `Immediate Send`. |
| **Peel Chains** | Laundering crypto by peeling off small amounts in long chains. | ❌ N/A | **Blockchain Analytics**. | **External API**: Integration with Chainalysis/TRM Labs to score wallet addresses. **Pattern**: Detect high volume of micro-transactions to new addresses. |
| **Deepfake / AI Impersonation** | Using AI voice/video to authorize wires (CEO Fraud). | ❌ Missing | **Verification Step-Up**. | **Workflow**: If `Amount > $50k` AND `Channel = Voice/Video` → Trigger `Out-of-Band Auth` (SMS/Push to registered mobile). |

### Diagnosis & Roadmap
**Current State:**
- **Strengths**: The `FraudRulesEngine` is good at *Single Transaction* analysis (Thresholds, Geo-location, Time-of-day).
- **Weaknesses**: Weak at *Graph/Network* analysis (who knows whom) and *Complex Temporal* patterns (sequences of events over days).
- **Gap**: The RAG system has no knowledge of these definitions to explain *why* an alert matters.

**Immediate Enhancements (Phase 6):**
1. **Typology Knowledge Base**: Populate `plugins/knowledge_base/typologies` with definitions of all above methods.
2. **Behavioral Rules**: Implement "Mule" and "Layering" rules (High ROI, Low Complexity).
3. **Graph Analysis (Future)**: Plan for Phase 7 to handle Ponzi/Circular detections.

## How We Prove Fraud & Embezzlement

**Objective:** Translate "UI Features" into "Court-Admissible Proof".  
**Audience:** Forensic Accountants, Legal Teams, Investigators.

This document analyzes how the specific features in the proposed Phase 4 designs allow an investigator to mechanically prove specific types of financial crimes.

### Proving Embezzlement (Theft by Insider)
Embezzlement usually involves an insider creating false expenses or vendors to siphon money.

#### The Feature: Entity Graph
**Scenario:** An employee approves payments to a "Vendor" that they secretly own.
**Proof Mechanism:**
- **Node Analysis:** The Graph renders the Employee node and the Vendor node.
- **Link Detection:** The system automatically draws an edge if they share metadata (same Phone Number, same physical Address, or shared IP address).
- **Visual Proof:** A triangle graph (Company -> Vendor -> Employee's Private Bank) visually demonstrates the Round Trip of funds.
**Court Value:** "Your Honor, this chart shows the 'Vendor' shares a home address with the Defendant."

#### The Feature: OCR & Semantic Search
**Scenario:** "Ghost Employees" or Fake Invoices.
**Proof Mechanism:**
- **Anomaly detection:** OCR extracts 500 invoice templates. The AI detects variations in font or pixel alignment.
- **Metadata Analysis:** File metadata shows creation by Photoshop instead of QuickBooks.
**Court Value:** Demonstrates Intent to Deceive (Forgery).

### Proving Structuring (Smurfing)
Structuring is breaking large transactions into smaller ones to avoid regulatory reporting.

#### The Feature: Temporal Playback Slider
**Scenario:** A launderer moves $50,000 via fifty $990 transfers over 3 days.
**Proof Mechanism:**
- **Dynamic View:** Time slider shows distinct "Pulse" or "Burst" of edges forming rapidly.
- **Velocity Metrics:** Dashboard highlights "High Frequency / Low Value" patterns.
**Court Value:** Proves Pattern & Practice. "This wasn't 50 isolated payments; it was one coordinated event."

### Proving Shell Company Networks
#### The Feature: Community Detection
**Scenario:** A fraudster sets up 10 shell companies to obscure fund destinations.
**Proof Mechanism:**
- **Force-Directed Layout:** Graph algorithm clusters nodes that transact frequently with each other.
- **Visual Isolation:** "Shell Network" floats as a detached island or tightly wound "hairball".
**Court Value:** Visualizes the Conspiracy, shows the scope of the network.

## API Endpoint Security - Implementation Plan

This document tracks the implementation of authentication across all API endpoints identified in the security audit.

### Progress Tracking
**Overall Progress:** 22% (8/28 routers completed)

**Legend:**
- ✅ Completed
- 🚧 In Progress
- ⏳ Planned
- ⚠️ Blocked

### Phase 1: Critical Security (Priority 1) - Week 1

#### 1.1 Admin Endpoints ✅
**File:** `backend/app/routers/admin.py`  
**Status:** ✅ COMPLETED  
**Completed:** 2025-12-12  
**Effort:** 4 hours

**Tasks:**
- [x] Create `require_admin` dependency function
- [x] Add authentication to all 7 endpoints: GET /database/performance, GET /database/stats, POST /database/optimize, etc.
- [x] Add audit logging for all admin actions
- [x] Write integration tests for admin endpoints
- [x] Update API documentation

#### 1.2 Backup Endpoints ✅
**File:** `backend/app/routers/backup.py`  
**Status:** ✅ COMPLETED  
**Completed:** 2025-12-12  
**Effort:** 6 hours

**Tasks:**
- [x] Implement authentication for backup operations
- [x] Add role-based access control (RBAC) for backup permissions
- [x] Secure backup file storage and retrieval
- [x] Add audit trails for backup operations
- [x] Update backup API documentation

### Current Implementation Status
**Completed Routers:** 8/28 (28.6%)
- Admin (7 endpoints)
- Backup (6 endpoints)
- Authentication (15 endpoints)
- Users (12 endpoints)
- Cases (18 endpoints)
- Evidence (25 endpoints)
- Reporting (8 endpoints)
- Stats (5 endpoints)

**Remaining:** 20 routers with approximately 219 endpoints to secure.

### Security Architecture
- JWT-based authentication with role hierarchy
- CSRF protection on state-changing endpoints
- Rate limiting per user/IP
- Comprehensive audit logging
- Input validation and sanitization

### Next Steps
1. Complete remaining router implementations
2. Implement advanced security features (MFA, session management)
3. Conduct security testing and penetration testing
4. Update all API documentation with authentication requirements
5. Deploy to staging for integration testing

This comprehensive fraud and security strategy combines orchestration frameworks, typology diagnosis, proof mechanisms, and API security implementation to provide a complete approach to fraud detection and prevention.