# Comprehensive Fraud & AML Typologies Diagnosis

> **Purpose**: Catalog "all known" fraud and money laundering methods and map them to Simple378's current capabilities.
> **Status**: Diagnosis Phase
> **Date**: 2025-12-10

## 1. Money Laundering Typologies

| Typology | Description | Current Coverage | Proposed Enhancement | Integration Method |
|:---|:---|:---:|:---|:---|
| **Structuring (Smurfing)** | Breaking large transactions into smaller ones to avoid thresholds. | ✅ Strong | Existing rule. | **Static Rule**: `count(txn) > N` where `$9k < amount < $10k`. |
| **Layering** | Moving funds rapidly to distance from source. | ❌ Missing | **New Rule**: "Rapid Pass-Through". | **Behavioral Analysis**: Calculate `residence_time` of funds. `Time(Out) - Time(In) < 1h`. |
| **Integration** | Re-entering laundered funds (property, sham loans). | ❌ Missing | **RAG**: Red flags list. | **RAG/Context**: AI searches `typologies/integration.md` to highlight "Property Real Estate" keywords in evidence. |
| **Trade-Based ML (TBML)** | Over/under-invoicing, phantom shipments. | ❌ Missing | **Enhancement**: OCR Matching. | **New Service**: `DocumentAnalysisService` extracts invoice totals $\leftrightarrow$ matches transaction amount. |
| **Money Mules** | Individuals transferring stolen/laundered money. | ❌ Missing | **New Rule**: "Mule Profile". | **Behavioral Analysis**: `FlowRatio = TotalOut / TotalIn`. If $\approx 1.0$ and Velocity High $\to$ Mule. |
| **Shell Companies** | Inactive companies used for maneuvers. | ⚠️ Partial | Disjoint entity analysis. | **Graph/Metadata**: Check Company Age < 6mo + High Vol. Link entities via `beneficial_owner` field. |
| **Cuckoo Smurfing** | 3rd party pays beneficiary without knowledge. | ❌ Missing | **RAG**: Interview context. | **Analyst Prompt**: Alert user to separate "Source of Funds" from "Sender". |
| **Transaction Laundering** | Using legitimate merchant to process illicit txns. | ❌ Missing | Web crawling. | **External API**: Use `GoogleSearchTool` or Crawler to verify Merchant URL matches Business Type. |

## 2. Fraud Typologies

| Typology | Description | Current Coverage | Proposed Enhancement | Integration Method |
|:---|:---|:---:|:---|:---|
| **Account Takeover (ATO)** | Unauthorized access to user accounts. | ⚠️ Partial | Device Fingerprinting. | **Metadata Rule**: `IP_Geo != User_Home_Geo` or `User_Agent` change detected in `login_logs`. |
| **Synthetic Identity** | Real SSN + Fake Name. | ❌ Missing | "SSN Scramble" check. | **Entity Resolution**: `SELECT count(DISTINCT name) FROM entities WHERE ssn = ?`. If > 1 $\to$ Synthetic. |
| **First-Party Fraud** | Bust-out / Friendly Fraud. | ❌ Missing | "Bust-Out Pattern". | **Time-Series**: Detect `CreditLimit` utilization spike $\to$ 100% followed by `PaymentFailure`. |
| **Ponzi Schemes** | Paying early investors with new funds. | ❌ Missing | "Hub-and-Spoke" flow. | **Graph Algo**: Cycle Detection. `A -> B -> C -> A`. Requires Graph DB or recursive SQL query. |
| **Invoice Fraud** | Fake invoices from scammers. | ❌ Missing | Vendor Matching. | **Fuzzy Matching**: Levenshtein distance on Vendor Name vs Master List (e.g., "M1crosoft" vs "Microsoft"). |
| **Payroll Fraud** | Ghost employees. | ❌ Missing | "Ghost Employee". | **Data Integrity**: `GROUP BY bank_account HAVING count(employee_id) > 1`. |
| **Elder Exploitation** | Coercing elderly victims. | ❌ Missing | "Vulnerable Person". | **Metadata Rule**: `Entity.age > 70` AND `Txn.recipient` in [Crypto, Offshore]. |

## 3. Emerging & High-Tech Typologies (2024+)

| Typology | Description | Current Coverage | Proposed Enhancement | Integration Method |
|:---|:---|:---:|:---|:---|
| **Authorized Push Payment (APP) Fraud** | Victim is manipulated into sending funds voluntarily (CEO Fraud, Impersonation). | ❌ Missing | **Session Behavioral Biometrics**. | **Telemetry**: Detect "Long Live Call" during transaction (Remote Access Tool indicator). <br> **Behavior**: Alert if `New Payee` + `High Value` + `Immediate Send`. |
| **Peel Chains** | Laundering crypto by peeling off small amounts in long chains. | ❌ N/A | **Blockchain Analytics**. | **External API**: Integration with Chainalysis/TRM Labs to score wallet addresses. <br> **Pattern**: Detect high volume of micro-transactions to new addresses. |
| **Deepfake / AI Impersonation** | Using AI voice/video to authorize wires (CEO Fraud). | ❌ Missing | **Verification Step-Up**. | **Workflow**: If `Amount > $50k` AND `Channel = Voice/Video` $\to$ Trigger `Out-of-Band Auth` (SMS/Push to registered mobile). |

## 4. Diagnosis & RoadMap

### Current State
- **Strengths**: The `FraudRulesEngine` is good at *Single Transaction* analysis (Thresholds, Geo-location, Time-of-day).
- **Weaknesses**: Weak at *Graph/Network* analysis (who knows whom) and *Complex Temporal* patterns (sequences of events over days).
- **Gap**: The RAG system has no knowledge of these definitions to explain *why* an alert matters.

### Immediate Enhancements (Phase 6)
1.  **Typology Knowledge Base**: Populate `plugins/knowledge_base/typologies` with definitions of all above methods.
2.  **Behavioral Rules**: Implement "Mule" and "Layering" rules (High ROI, Low Complexity).
3.  **Graph Analysis (Future)**: Plan for Phase 7 to handle Ponzi/Circular detections.
