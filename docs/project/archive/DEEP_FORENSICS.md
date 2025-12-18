# Deep Forensics & Server-Side Intelligence

## Overview
The Deep Forensics module (Phase 14.2) provides production-grade tools for analyzing legal and financial evidence. This document outlines the technical implementation of PDF highlighting, server-side pagination, and highlight persistence.

## Technical Components

### 1. Backend: Evidence Router (`evidence.py`)
- **Server-Side Pagination:** The `get_evidence` endpoint now supports `page`, `page_size`, and `q` (search) parameters.
  - Filtering is done at the database level using `LIMIT` and `OFFSET`.
  - Search is case-insensitive on `filename` and `uploaded_by` using `ILIKE`.
- **Highlight Persistence:** Two new endpoints manage forensic markings:
  - `GET /evidence/{evidence_id}/highlights`: Retrieves saved highlights from `evidence_metadata`.
  - `POST /evidence/{evidence_id}/highlights`: Appends new highlights with creator metadata and timestamps.

### 2. Frontend: PDF Viewer (`PdfViewer.tsx`)
- **Integration:** Powered by `react-pdf-highlighter-extended` (v8.1.0+).
- **Features:**
  - **Text Selection:** Standard highlighting of document text.
  - **Area Selection:** Press `Alt` + Drag to create area-based highlights (image snippets).
  - **Note Attachment:** Each highlight can have a forensic note attached.
- **State Restoration:** On mount, the component fetches existing highlights for the `evidenceId` and restores them on the document.

### 3. Frontend: Evidence Locker (`Forensics.tsx`)
- **Server-Side Interfacing:** Replaced client-side filtering with a debounced server-side search.
- **Pagination Controls:** Real-time pagination that resets on search query changes.

## Usage Guide
1. Navigate to the **Forensics** page.
2. Select a PDF document from the **Evidence Locker**.
3. Use the **Visual** tab in the canvas to view the document.
4. Select text to add a highlight and note.
5. Use `Alt` key for area highlights on images or diagrams.
6. Highlights are automatically saved and will be restored when you or another investigator re-opens the file.

## Troubleshooting
- **Missing Highlights:** Ensure the `evidenceId` is correctly passed to the `PdfViewer` component.
- **OCR Issues:** PDF text must be selectable for text highlights. For scanned documents, use the "OCR Text" panel to verify extraction.
