# Feature Organization Diagnosis & Reorganization Proposal

## Current State Analysis

### Page Categories

| Category | Pages | Purpose |
|----------|-------|---------|
| **Entry** | Login/Auth | Access control |
| **Command** | Dashboard | System overview, alerts, navigation |
| **Core Workflow** | Cases, Evidence, Reconciliation, Adjudication | Daily fraud operations |
| **Deep Analysis** | Investigation, Visualization | Complex pattern analysis |
| **Conclusion** | Reporting | Case closure, court docs |
| **Admin** | Settings | Config, audit, rules |
| **Cross-cutting** | AI Assistant, Error Handling, Desktop | System-wide features |

---

## 🔍 Identified Issues

### 1. Feature Overlap & Duplication

| Feature | Currently In | Should Be In | Issue |
|---------|--------------|--------------|-------|
| Transaction matching | Reconciliation | Reconciliation | ✅ OK |
| Alert management | Adjudication, Dashboard | Adjudication (primary), Dashboard (summary) | Minor overlap |
| Entity graph | Investigation, Visualization | Investigation (interactive), Visualization (charts) | Needs clarity |
| Case summary | Cases, Reporting | Cases (detail), Reporting (export) | ✅ OK |
| Fraud detection rules | Settings, AI Assistant | Settings (config), AI (runtime) | ✅ OK |
| Document viewer | Evidence | Evidence | ✅ OK |
| OCR/Forensics | Evidence | Evidence | ✅ OK |
| Audit log | Settings | Settings | ✅ OK |

### 2. Missing Features per Page

| Page | Missing Core Feature |
|------|---------------------|
| Dashboard | Quick actions panel for common tasks |
| Reconciliation | Timeline-based comparison view |
| Adjudication | Batch decision workflow |
| Investigation | Evidence attachment panel |
| Visualization | Case comparison mode |
| Reporting | Template library browser |

### 3. Feature Misplacement

| Feature | Current Location | Better Location | Reason |
|---------|-----------------|-----------------|--------|
| Milestone tracker | Visualization | Cases/Reporting | Relates to case progress |
| Financial health | Visualization | Reporting | Summarization feature |
| Project tracker | Visualization | Cases | Case management feature |

---

## 📊 Proposed Feature Distribution

### Tier 1: Entry & Overview

```
┌─────────────────────────────────────────┐
│ LOGIN                                   │
│ • Auth, MFA, biometrics                │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ DASHBOARD (Command Center)              │
├─────────────────────────────────────────┤
│ Features:                               │
│ • KPI cards (cases, alerts, match rate) │
│ • Live feed (WebSocket)                 │
│ • Quick actions (new case, upload)      │
│ • AI watchtower (risk summary)          │
│ • System health (status bar)            │
│                                         │
│ NOT HERE: Deep analytics, case details  │
└─────────────────────────────────────────┘
```

### Tier 2: Data Pipeline

```
┌─────────────────────────────────────────┐
│ EVIDENCE & INGESTION                    │
├─────────────────────────────────────────┤
│ Features:                               │
│ • File upload (drag-drop, wizard)       │
│ • OCR extraction                        │
│ • PDF/image viewer                      │
│ • Metadata analysis                     │
│ • Tamper detection (ELA)                │
│ • Forensic annotations                  │
│                                         │
│ OUTPUT → Reconciliation                 │
└─────────────────────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ RECONCILIATION                          │
├─────────────────────────────────────────┤
│ Features:                               │
│ • Transaction matching (auto/manual)    │
│ • Drag-drop pairing                     │
│ • Match rate KPIs                       │
│ • Conflict detection                    │
│ • Gap analysis                          │
│ • Batch matching                        │
│                                         │
│ OUTPUT → Adjudication (conflicts)       │
└─────────────────────────────────────────┘
```

### Tier 3: Decision Layer

```
┌─────────────────────────────────────────┐
│ ADJUDICATION QUEUE                      │
├─────────────────────────────────────────┤
│ Features:                               │
│ • Alert queue (sortable)                │
│ • Decision workflow (approve/reject)    │
│ • AI reasoning panel (4 personas)       │
│ • Evidence quick-view                   │
│ • Batch decisions                       │
│ • Keyboard shortcuts                    │
│                                         │
│ OUTPUT → Cases (confirmed fraud)        │
└─────────────────────────────────────────┘
```

### Tier 4: Investigation Layer

```
┌─────────────────────────────────────────┐
│ CASES                                   │
├─────────────────────────────────────────┤
│ Features:                               │
│ • Case list (table/kanban)              │
│ • Case detail (tabs)                    │
│ • Status workflow                       │
│ • Assignment                            │
│ • Timeline                              │
│ • Evidence attachments                  │
│ • Milestone tracking ← MOVED FROM VIZ   │
│                                         │
│ LINKED TO: Investigation, Reporting     │
└─────────────────────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ INVESTIGATION CANVAS                    │
├─────────────────────────────────────────┤
│ Features:                               │
│ • Force-directed graph                  │
│ • Entity registry                       │
│ • Path finding                          │
│ • Node inspector (+ AI insights)        │
│ • Evidence panel ← NEW                  │
│ • Timeline playback                     │
│                                         │
│ LINKED TO: Cases (context)              │
└─────────────────────────────────────────┘
```

### Tier 5: Analysis Layer

```
┌─────────────────────────────────────────┐
│ VISUALIZATION                           │
├─────────────────────────────────────────┤
│ Features:                               │
│ • Cashflow charts                       │
│ • Anomaly heatmaps                      │
│ • Peer benchmarks                       │
│ • Trend analysis                        │
│ • Fraud pattern detection               │
│ • Scenario simulation                   │
│                                         │
│ REMOVED: Milestone tracker, Fin Health  │
│ (moved to Cases/Reporting)              │
└─────────────────────────────────────────┘
```

### Tier 6: Conclusion Layer

```
┌─────────────────────────────────────────┐
│ REPORTING                               │
├─────────────────────────────────────────┤
│ Features:                               │
│ • Summary preview                       │
│ • Report builder (4-step wizard)        │
│ • Template library ← EMPHASIZED         │
│ • Financial health ← MOVED FROM VIZ     │
│ • Project tracker ← MOVED FROM VIZ      │
│ • Export (PDF, Excel, ZIP)              │
│ • Scheduled reports                     │
│ • Plain-language mode                   │
│                                         │
│ OUTPUT: Court-ready documents           │
└─────────────────────────────────────────┘
```

---

## 🔄 Recommended Changes

### Move Features

| Feature | From | To | Reason |
|---------|------|-----|--------|
| Milestone Tracker | Visualization | Cases | Case lifecycle management |
| Financial Health | Visualization | Reporting | Summary/export feature |
| Project Tracker | Visualization | Reporting | Progress reporting |
| Evidence Panel | (new) | Investigation | Link evidence to graph |

### Add Features

| Feature | Page | Description |
|---------|------|-------------|
| Quick Actions | Dashboard | Frequent task shortcuts |
| Batch Decisions | Adjudication | Bulk approve/reject |
| Evidence Panel | Investigation | Attach docs to nodes |
| Case Comparison | Visualization | Compare multiple cases |
| Template Library | Reporting | Pre-built report formats |

### Rename/Clarify

| Current Name | Proposed Name | Reason |
|--------------|---------------|--------|
| Evidence & Forensics | Evidence Lab | Shorter, clearer |
| Visualization | Analytics | More accurate |
| AI Assistant | Frenly AI | Brand consistency |

---

## 📁 Updated Doc Structure

```
docs/features/
├── 01-authentication.md      # Entry
├── 02-dashboard.md           # Command Center
├── 03-evidence-lab.md        # Data Ingestion + Forensics
├── 04-reconciliation.md      # Transaction Matching
├── 05-adjudication.md        # Decision Queue
├── 06-cases.md               # Case Management
├── 07-investigation.md       # Graph Canvas
├── 08-analytics.md           # Visualization (renamed)
├── 09-reporting.md           # Conclusion
├── 10-settings.md            # Admin
├── 11-frenly-ai.md           # Cross-cutting AI
├── 12-desktop-experience.md  # Electron-specific
└── 13-error-handling.md      # System errors
```

---

## 🗺️ User Journey Map with Checkpoints

### Fraud Investigation Journey Line

```
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                           FRAUD INVESTIGATION JOURNEY                                    │
  │                                                                                          │
  │  START                                                                              END  │
  │    ●                                                                                ●   │
  │    │                                                                                │   │
  │    ▼                                                                                ▼   │
  │ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐│
  │ │LOGIN │──│DASH  │──│EVID  │──│RECON │──│ADJUD │──│CASES │──│INVEST│──│VIZ   │──│REPORT││
  │ │  01  │  │  02  │  │  03  │  │  04  │  │  05  │  │  06  │  │  07  │  │  08  │  │  09  ││
  │ └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘│
  │    │         │         │         │         │         │         │         │         │   │
  │    ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼   │
  │  Access   Overview   Upload    Match    Decide   Manage   Analyze  Visualize  Export  │
  │  System   Alerts    Evidence   Trans    Alerts    Case     Links    Patterns   Report │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Journey Checkpoints

| Checkpoint | Page | User Goal | Success Criteria | AI Assist |
|------------|------|-----------|------------------|-----------|
| **01** | Login | Access system | Authenticated | - |
| **02** | Dashboard | See overview | Understand workload | 👮 Risk summary |
| **03** | Evidence Lab | Upload files | Files ingested, OCR'd | 📊 Forgery check |
| **04** | Reconciliation | Match transactions | Match rate >90% | 🔍 Suggest pairs |
| **05** | Adjudication | Decide on alerts | Queue cleared | ⚖️ Legal guidance |
| **06** | Cases | Manage investigation | Case status updated | 👮 Next steps |
| **07** | Investigation | Find connections | Key paths found | 🔍 Link analysis |
| **08** | Analytics | See patterns | Anomalies identified | 📊 Trend insights |
| **09** | Reporting | Export findings | Court-ready report | ⚖️ Format check |

### Journey Branching

```
                    ┌──── Quick Review ────┐
                    │  (no upload needed)  │
                    │                      │
    LOGIN ──► DASHBOARD ──► CASES ──► REPORTING
                    │                      │
                    └──── Full Analysis ───┘
                         (standard path)
                              │
                              ▼
    EVIDENCE ──► RECONCILIATION ──► ADJUDICATION ──► INVESTIGATION ──► VISUALIZATION
```

---

## 📷 EXIF-like Metadata Extraction

### Document Metadata Schema

Every uploaded document extracts metadata similar to EXIF:

```typescript
interface DocumentMetadata {
  // Core Identity
  id: string;              // UUID
  filename: string;        // Original name
  filetype: string;        // MIME type
  size: number;            // Bytes
  hash: {
    md5: string;
    sha256: string;        // For chain of custody
  };

  // Creation Context (Like EXIF)
  created: {
    date: string;          // ISO timestamp
    timezone: string;      // e.g., "Asia/Jakarta"
    software: string;      // e.g., "Microsoft Word 2019"
    author: string;        // Document author field
    device?: string;       // If from scanner/camera
  };

  // Modification History
  modified: {
    lastDate: string;
    count: number;         // Total edit count
    history: ModificationEvent[];
  };

  // GPS/Location (if available)
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
    source: string;        // "GPS" | "IP" | "manual"
  };

  // Print/Scan Metadata
  print?: {
    printerName: string;
    printDate: string;
    copies: number;
  };

  // PDF-Specific
  pdf?: {
    producer: string;      // "Adobe Acrobat"
    version: string;       // "1.7"
    pages: number;
    encrypted: boolean;
    permissions: string[];
  };

  // Image-Specific (EXIF)
  image?: {
    dimensions: { width: number; height: number };
    colorSpace: string;
    dpi: number;
    camera?: {
      make: string;
      model: string;
      exposure: string;
      iso: number;
    };
  };

  // Forensic Flags
  forensic: {
    tamperLikelihood: number;  // 0-100%
    anomalies: string[];       // ["metadata_mismatch", "edit_after_sign"]
    signatureValid: boolean;
    ocrConfidence: number;
  };
}
```

### Metadata Display UI

```
┌───────────────────────────────────────────────────────────────┐
│ 📄 Invoice_2024-03-15.pdf                                     │
├───────────────────────────────────────────────────────────────┤
│ CORE                          │ FORENSIC FLAGS               │
│ ─────────────────────────     │ ────────────────────────     │
│ Size:     245 KB              │ ⚠️ Tamper Risk: 72%          │
│ Pages:    3                   │ 🔴 Metadata mismatch         │
│ Hash:     a3f9b2...           │ ⚠️ Edit after signature      │
│                               │ ✅ OCR Confidence: 98%       │
├───────────────────────────────┴───────────────────────────────┤
│ CREATION                                                      │
│ ─────────────────────────────────────────────────────────     │
│ 📅 Created:  2024-03-15 14:32:05 (Asia/Jakarta)              │
│ 💻 Software: Microsoft Word 2019                              │
│ 👤 Author:   "John Smith"                                     │
│ 🖨️ Printed:  2024-03-16 09:15 (HP LaserJet Pro)              │
├───────────────────────────────────────────────────────────────┤
│ MODIFICATION HISTORY                                          │
│ ─────────────────────────────────────────────────────────     │
│ ● 2024-03-15 14:32  Created                                   │
│ ● 2024-03-15 16:45  Edited (content changed)                  │
│ ● 2024-03-16 09:00  Signature added                           │
│ ● 2024-03-16 09:30  🔴 Content modified after signature       │
└───────────────────────────────────────────────────────────────┘
```

### Metadata Extraction Functions

| Function | Source | Evidence Page | Description |
|----------|--------|---------------|-------------|
| `extractPdfMetadata()` | pdf-parse, pdf-lib | Evidence Lab | PDF producer, author, dates |
| `extractImageExif()` | exif-js, sharp | Evidence Lab | Camera, GPS, timestamps |
| `extractDocxMetadata()` | mammoth, docx | Evidence Lab | Word doc properties |
| `analyzeEditHistory()` | pdf-lib | Evidence Lab | Track all modifications |
| `detectTampering()` | ELA, metadata | Evidence Lab | Flag inconsistencies |
| `geolocateDocument()` | GPS, IP lookup | Evidence Lab | Location triangulation |
| `verifySignature()` | node-signpdf | Evidence Lab | Digital sig validation |
| `calculateHash()` | crypto | ALL pages | SHA-256 for chain of custody |

### Metadata Comparison View

```
┌─────────────────────────────┬─────────────────────────────┐
│ DOCUMENT A                  │ DOCUMENT B                  │
│ Invoice_v1.pdf              │ Invoice_v2.pdf              │
├─────────────────────────────┼─────────────────────────────┤
│ Created:  Mar 15, 14:32     │ Created:  Mar 15, 14:32     │
│ Modified: Mar 15, 16:45     │ Modified: Mar 17, 23:15 ⚠️  │
│ Author:   John Smith        │ Author:   J. Smith 🔴       │
│ Software: Word 2019         │ Software: LibreOffice 🔴    │
│ Hash:     a3f9b2...         │ Hash:     c7d2e1... 🔴      │
├─────────────────────────────┴─────────────────────────────┤
│ 🔴 DISCREPANCIES DETECTED:                                │
│ • Author name shortened (possible concealment)            │
│ • Different software used for "same" document             │
│ • Modified 2 days after original, late at night           │
│ • Hash mismatch confirms content change                   │
└───────────────────────────────────────────────────────────┘
```

---

## 📚 Related Docs

| Document | Purpose |
|----------|---------|
| [FRAUD_ORCHESTRATION.md](./FRAUD_ORCHESTRATION.md) | Plain-language framework |
| [CROSS_PAGE_INTEGRATION.md](./CROSS_PAGE_INTEGRATION.md) | Data flow between pages |
| [evidence-and-forensics.md](../features/evidence-and-forensics.md) | Evidence Lab implementation |



