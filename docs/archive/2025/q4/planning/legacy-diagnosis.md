# 🩺 Application Diagnostics & Gap Analysis

> **Date:** 2025-12-09
> **Scope:** Frontend Application (React/Electron)
> **Goal:** Align with "Phase 4: Advanced Intelligence" and "Premium/Military-Grade" standards.

## Index of Design Documents
### Strategy & Context
*   [00_STRATEGY_DIAGNOSIS.md](00_STRATEGY_DIAGNOSIS.md) (You are here)
*   [00_STRATEGY_USER_JOURNEY.md](00_STRATEGY_USER_JOURNEY.md) (The Golden Path)
*   [00_STRATEGY_FRAUD_MECHANICS.md](00_STRATEGY_FRAUD_MECHANICS.md) (Legal Strategy)
*   [00_STRATEGY_INTERACTIVITY.md](00_STRATEGY_INTERACTIVITY.md) (Sync Architecture)
*   [00_STRATEGY_FRENLY_AI.md](00_STRATEGY_FRENLY_AI.md) (AI Integration)
*   [00_STRATEGY_FRENLY_AI_FUTURE.md](00_STRATEGY_FRENLY_AI_FUTURE.md) (Future Roadmap)
*   [00_STRATEGY_ONBOARDING.md](00_STRATEGY_ONBOARDING.md) (User Guidance)

### Functional Pages (The Workflow)
1.  [01_DASHBOARD.md](01_DASHBOARD.md) (Command Center)
2.  [02_CASES.md](02_CASES.md) (Triage & Management)
3.  [03_INVESTIGATION.md](03_INVESTIGATION.md) (Deep Graph Analysis)
4.  [04_EVIDENCE.md](04_EVIDENCE.md) (Forensics Lab)
5.  [05_REPORTING.md](05_REPORTING.md) (Conclusion Wizard)
6.  [06_SETTINGS.md](06_SETTINGS.md) (Mission Control)

## 1. Executive Summary

The current application is a functional **CRUD Prototype**. It successfully handles the basics of Case Management (List/Detail) and File Uploads, but it lacks the "Intelligence" and "Investigation" workflows promised in the Master Plan. The UI is utilitarian ( MVP level) rather than "Premium" or "Data-Dense".

### Strategic Context: Why Change?
*   **Why:** The current "Admin Dashboard" paradigm is reactive. Operators only see what they look for. A "Military-Grade" system must be proactive, alerting operators to threats they haven't noticed.
*   **What:** Shift from "Data Entry" to "Data Investigation". Every page must offer insights, not just tables.
*   **How:** By implementing a "Thick Client" architecture (Electron) that leverages local hardware for heavy visualization (WebGL) and immediate interactions, bypassing web latency.

---

## 2. Page-by-Page Diagnosis (Why, What, How)

### 2.1 Dashboard (`Dashboard.tsx`)
*   **Why (The Gap):** Currently serves static data. Fails to answer "What is happening *right now*?".
*   **What (The Fix):** Transform into a "Command Center" with live feeds and geospatial context.
*   **How (The Tech):** Replace `useEffect` polling with WebSockets. Use `react-map-gl` for the threat map.

### 2.2 Case Management (`Cases.tsx`)
*   **Why (The Gap):** List view hides urgency. Only shows "Open/Closed", not "Structuring" or "Legal Review".
*   **What (The Fix):** Implement a Kanban workflow board and faceted search.
*   **How (The Tech):** Use `dnd-kit` for drag-and-drop columns. Implement a client-side search engine (e.g., `flexsearch`) for instant filtering of thousands of cases.

### 2.3 Forensics & Evidence (`Forensics.tsx`)
*   **Why (The Gap):** Blind file management. Users must download files to see them.
*   **What (The Fix):** Integrated "Forensic Lab" with in-app PDF/Image analysis.
*   **How (The Tech):** Embed `react-pdf` for rendering. Use `tesseract.js` (or backend OCR) to overlay text layers on canvas.

### 2.4 Investigation / Network Analysis
*   **Why (The Gap):** **Critical Feature Missing.** No way to see relationships (e.g., A pays B, B pays C).
*   **What (The Fix):** A "Canvas" view for visual link analysis.
*   **How (The Tech):** `react-force-graph` for the visualization engine. `zustand` for managing complex graph state (nodes/edges).

---

### 2.5 Global UI Elements (New)
*   **Notification Center (Task 4.7):** A "Bell" icon in the header expanding to a message tray for Alerts and System Updates.
*   **Collaboration Bar (Task 4.6):** "Facepile" of active users on the current page with cursor presence.

---

## 3. Technical & Architectural Improvement Plan

### 3.1 State Management
*   **Why:** Complex investigations require persistent state (e.g., "Draft Graph"). Local state is lost on navigation.
*   **What:** Global, persistent client-state.
*   **How:** `Zustand` for UI state (sidebar toggles), `TanStack Query` for server state (caching), and `IndexedDB` for offline persistence.

### 3.2 Visualization Engine
*   **Why:** DOM nodes are too slow for thousands of data points.
*   **What:** GPU-accelerated rendering.
*   **How:** `Canvas` or `WebGL` based libraries (`Recharts`, `react-force-graph`) to maintain 60FPS.

### 3.3 AI Integration Pattern
*   **Why:** AI should not be a "popup"; it should be a "copilot".
*   **What:** Context-aware sidebar.
*   **How:** A persistent `Drawer` component that listens to the active page/selection context and queries the local LLM/Rule Engine for relevant suggestions.
