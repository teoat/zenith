# Frontend-Backend Gap Analysis

## Executive Summary
This document outlines the discrepancies and missing links between the frontend components and the backend API. The primary focus is on the Integration Hub, Evidence Management (Forensics), and Dashboard Reporting.

## 1. Integration Hub (`IntegrationHub.tsx`)
**Status:** 🔴 Critical Gap
**Observation:** The Integration Hub works entirely on mock data defined within the component (`loadIntegrationData`).
**Missing Backend Requirements:**
- **Endpoints Needed:**
    - `GET /api/integrations`: List all integrations.
    - `GET /api/integrations/metrics`: Get overall metrics (success rate, total requests, etc.).
    - `POST /api/integrations`: Create a new integration.
    - `PUT /api/integrations/{id}`: Update an integration.
    - `DELETE /api/integrations/{id}`: Remove an integration.
    - `POST /api/integrations/{id}/test`: Test an integration connection.
- **Data Models Needed:**
    - `Integration` model in backend mirroring the frontend interface.
    - `IntegrationMetrics` model.

## 2. Evidence Management (`Forensics.tsx`)
**Status:** 🟡 Partial Gap
**Observation:** 
- The frontend expects `EvidenceItem` to have a `filePath`. 
- Currently, `Forensics.tsx` uses a hardcoded fallback PDF URL (`selectedFile` state) if `filePath` is missing.
- `api.getEvidence` is implemented, but we need to ensure the backend actually provides a viewable URL or a valid file path that the frontend can use to render the file in `ForensicCanvas`.
**Action Items:**
- Verify `GET /api/evidence/{case_id}` returns a valid `filePath` or `downloadUrl`.
- Ensure `UploadWizard` connects to a real file upload endpoint (`POST /api/evidence/upload`).

## 3. Dashboard (`Dashboard.tsx`)
**Status:** 🟡 Verification Needed
**Observation:**
- Uses `useDashboardMetrics` hook which calls `api.getMetrics()`.
- `api.getMetrics()` maps to `reportingService.getMetrics`.
- Need to verify if the backend endpoint for `getMetrics` returns the exact structure expected by `MetricsData` interface in `types/api.ts`.
- **Sparklines**: The interface `MetricsData` has `sparklineData?`, but we need to confirm the backend calculates and returns this historical data, otherwise the dashboard charts will be empty or flat.

## 4. Cases (`Cases.tsx`)
**Status:** 🟢 Mostly Synced (Needs Review)
**Observation:**
- `useCreateCase` calls `caseService.createCase`.
- Need to verify that the `CrimeCase` object constructed in `Cases.tsx` (specifically default strings for `status`, `priority`) matches the Enum values expected by the backend Pydantic models.

## 5. Metadata & Visualization
**Status:** 🟡 Unknown
**Observation:**
- `visualization.md` describes features like "Logical Deduction Views" and "Scenario Planning".
- These require supporting backend endpoints which likely do not exist yet.
