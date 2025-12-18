# 📘 Zenith Platform: Technical Manual & Feature Guide

This document serves as the authoritative technical reference for the Zenith Platform's advanced modules, including Deep Forensics, Diagnostics, and Automated Documentation.

---

## 🔍 Module 1: Deep Forensics (Phase 14.2)

### Overview
The Deep Forensics module provides production-grade tools for analyzing legal and financial evidence. It powers the "Evidence Locker" and "Forensic Canvas" interfaces.

### Technical Implementation

#### 1. Backend: Evidence Service (`evidence_service.py`)
- **Pagination:** Supports cursor-based and offset-based pagination.
- **Search:** `ILike` queries on filenames and metadata.
- **Highlight Persistence:**
  - `GET /evidence/{id}/highlights`: Retrieves `Highlight` JSON objects.
  - `POST /evidence/{id}/highlights`: Appends new highlights.

#### 2. Frontend: PDF Viewer (`PdfViewer.tsx`)
- **Engine:** `react-pdf-highlighter-extended` (v8.1.0+).
- **Features:**
  - **Text Selection:** Native text layer extraction.
  - **Area Highlights:** `Alt + Drag` to snapshot charts/images.
  - **Forensic Notes:** Attach JSON metadata to any highlight.

### Usage Guide
1. **Upload:** Drag/drop PDFs into the Evidence Locker.
2. **Review:** Click "Visual" mode.
3. **Annotate:** Select text or drag areas to highlight.
4. **Save:** Highlights auto-save on release.

---

## 🛠️ Module 2: System Diagnostics

### Quick Reference
Run the full diagnostic suite to verify system health:
```bash
python comprehensive_diagnostic_suite.py
```

### Diagnostic Layers
1.  **Frontend Build Integrity:** Checks `package.json` vs `node_modules`.
2.  **Backend Dependency Check:** Verifies imports and `requirements.txt`.
3.  **Database Integrity:** Checks connections and model schema headers.
4.  **Route Verification:** Pings all registered API endpoints (Dry Run).

---

## 📄 Module 3: Automated Documentation

### Overview
The `generate_docs.py` script (when implemented) will auto-generate API references from the OpenAPI schema.

### Doc-String Standards
- **Python:** Google Style Guide.
- **TypeScript:** JSDoc for all public interfaces.
- **API:** OpenAPI 3.1 tags in FastAPI routers.
