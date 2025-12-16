# Plain-Language Fraud Orchestration Framework

> **Goal:** Make fraud investigation understandable to common people, judges, and juries.
> **Principle:** "If a 12-year-old cannot understand it, it's not ready for court."

---

## 🎯 The WHAT-WHEN-HOW-WHY Framework

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

---

## 📖 Progressive Disclosure Model

### Level 1: Executive Summary (30 seconds)
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

### Level 2: Visual Story (2 minutes)
**Location:** Visualization, Investigation Canvas

```
┌─────────────────────────────────────────────────────────────┐
│              The Money Trail                                │
│                                                             │
│  Company ──$47,500──► Fake Vendor ──$45,000──► Personal    │
│  Account              "ABC Services"           Bank         │
│                                                             │
│  [Animated Flow] [Click nodes for details]                  │
└─────────────────────────────────────────────────────────────┘
```

### Level 3: Evidence Deep-Dive (10 minutes)
**Location:** Evidence Lab, Adjudication

```
┌─────────────────────────────────────────────────────────────┐
│ Document Evidence                                           │
│                                                             │
│ ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│ │ Invoice #001 │   │ Bank Record  │   │ Email Chain  │    │
│ │ 🔴 Forged    │   │ ✅ Authentic │   │ ⚠️ Suspicious│    │
│ │              │   │              │   │              │    │
│ │ [View]       │   │ [View]       │   │ [View]       │    │
│ └──────────────┘   └──────────────┘   └──────────────┘    │
│                                                             │
│ AI Says: "Invoice signature doesn't match known samples"   │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 4-Persona Integration with Professional Ethics

Each persona provides insights while **respecting their professional authority**:

### 👮‍♀️ Frenly AI (Friendly Guide)
**Role:** Translator, simplifier
**Ethics:** Accuracy, avoiding legal conclusions

| Do | Don't |
|----|-------|
| "This pattern is commonly associated with fraud" | "This proves fraud" |
| "The numbers seem unusual" | "They committed a crime" |
| Explain in simple terms | Use legal jargon |

**Example Output:**
> "The numbers in these transactions follow an unusual pattern that's often seen in fabricated data. A judge will need to decide if this constitutes fraud."

---

### ⚖️ Legal Advisor
**Role:** Legal framework guidance
**Ethics:** ABA Model Rules, Judicial Conduct Codes

| Do | Don't |
|----|-------|
| "This MAY constitute [crime] under [statute]" | "This IS a crime" |
| Cite relevant laws | Make guilt determinations |
| Explain admissibility requirements | Assert conclusions |

**Ethical Guidelines Referenced:**
- ABA Model Rules of Professional Conduct
- Judicial Conduct Codes (per jurisdiction)
- Prosecutor Ethics Guidelines

**Example Output:**
> "Based on Article 378 KUHP (Indonesia) or 18 U.S.C. § 1343 (US), this pattern MAY constitute wire fraud. For admissibility, chain of custody documentation is essential."

---

### 📊 Forensic Accountant  
**Role:** Financial quantification
**Ethics:** AICPA Code of Professional Conduct

| Do | Don't |
|----|-------|
| "Records show $X transferred" | "They stole $X" |
| Present calculations with methodology | Hide assumptions |
| State confidence intervals | Claim certainty |

**Example Output:**
> "Based on documented transactions:
> - Direct Loss: $47,500 (supported by 12 invoices)
> - Confidence: 95% ± $2,000
> - Methodology: Bank statement reconciliation"

---

### 🔍 Senior Investigator
**Role:** Pattern recognition, next steps
**Ethics:** Law enforcement due process

| Do | Don't |
|----|-------|
| "Evidence suggests..." | "The suspect did..." |
| Recommend investigation steps | Presume guilt |
| Note patterns objectively | Make accusations |

**Example Output:**
> "The evidence pattern suggests:
> 1. ✅ Request bank records for Account #XXX
> 2. ✅ Compare signatures with HR file
> 3. ⏳ Interview vendor contact
> 
> Note: This is investigative guidance, not a conclusion."

---

## 🎬 Synchronized Visual Components

### Timeline Narrative (All Pages)

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Case Timeline                                            │
├─────────────────────────────────────────────────────────────┤
│ Mar 5   │ Mar 12  │ Apr 3   │ May 15  │ Jul 20  │ Aug 1   │
│ ●───────●─────────●─────────●─────────●─────────●         │
│ First   │ Fake    │ Wire    │ Second  │ Last    │ Fraud   │
│ invoice │ vendor  │ sent    │ invoice │ payment │ detected│
└─────────────────────────────────────────────────────────────┘
```

### Money Flow Sankey (Reporting)

```
                     ┌─────────────────┐
 Company Funds ═════►│  Fake Vendor    │═════► Personal Account
 ($50,000)           │  "ABC Services" │       ($45,000)
                     └────────┬────────┘
                              ▼
                        Transaction Fees ($5,000)
```

### Confidence Indicator (All Findings)

```
┌────────────────────────────────────────────────────┐
│ Finding: Invoice appears forged                     │
│                                                     │
│ AI Confidence:  ████████░░ 85%                     │
│ Human Review:   Required                            │
│                                                     │
│ 👮 Frenly: "Signature mismatch detected"           │
│ ⚖️ Legal: "May support forgery claim under §463"  │
│ 📊 Forensic: "3 of 12 invoices affected"           │
│ 🔍 Investigator: "Compare with other vendors"      │
└────────────────────────────────────────────────────┘
```

---

## 📍 Feature Redistribution for Comprehension

| Feature | Current Page | Add To | Reason |
|---------|--------------|--------|--------|
| Plain Summary | Reporting only | ALL Pages | Universal need |
| Timeline Strip | Investigation | ALL Pages | Context everywhere |
| 4-Persona Panel | AI popup | Cases, Adj, Reporting | Decision points |
| Money Flow | Visualization | Reporting, Cases | Core fraud vis |
| Confidence Score | AI internal | ALL findings | Trust calibration |

---

## 📝 Reading Level Standards

| Audience | Grade Level | Example |
|----------|-------------|---------|
| Dashboard | Grade 6 | "Money is missing" |
| Case Summary | Grade 8 | "Funds were moved without approval" |
| Evidence | Grade 10 | "Transaction records show unauthorized transfers" |
| Legal Appendix | Professional | "Pursuant to §378 KUHP..." |

### Plain-Language Glossary

| Technical | Plain English |
|-----------|---------------|
| Benford's Law deviation | Numbers don't follow natural patterns |
| Structuring | Breaking up deposits to avoid reporting |
| Round-trip transaction | Money sent and returned to hide ownership |
| Mens rea | Evidence they knew it was wrong |
| Shell company | Fake business used to hide money |
| Layering | Moving money through multiple accounts |
| Actus reus | The actual criminal act |

---

## 🔄 Unified Visual Language

| Meaning | Color | Icon | Usage |
|---------|-------|------|-------|
| Fraud confirmed | Red | 🔴 | Alerts |
| Suspicious | Amber | ⚠️ | Warnings |
| Verified clean | Green | ✅ | Cleared |
| Unknown | Gray | ❓ | Pending |
| AI insight | Purple | 🤖 | AI content |
| Legal note | Blue | ⚖️ | Legal refs |
| Money flow | Teal | 💰 | Financial |

---

## 📚 Related Docs

- [FEATURE_ORGANIZATION.md](./FEATURE_ORGANIZATION.md) - Page structure
- [CROSS_PAGE_INTEGRATION.md](./CROSS_PAGE_INTEGRATION.md) - Data flows
- [ai-assistant.md](../features/ai-assistant.md) - 4-Persona system

