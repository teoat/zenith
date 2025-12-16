# 07. Strategy: Interactivity, Integration & Real-Time Sync

> **Goal:** Transform the application from a "collection of pages" into a **"Unified Nervous System"**.
> **Context:** In high-stakes investigations, "Page Loads" and "Lost Context" break the analyst's flow.

## 1. Deep Diagnosis: Current "Friction Points"

Even with the new designs (`01`-`05`), the application risks behaving like a standard website.

| Friction Point | The Symptom | The "Deep" Problem |
| :--- | :--- | :--- |
| **Navigation Amnesia** | User filters Cases by "Risk > 90", goes to Dashboard, comes back -> Filters are gone. | **Page-Scoped State:** State dies when the component unmounts. |
| **Context Silos** | User selects "Suspect A" in the Graph. Needs to manually search for "Suspect A" again in Evidence. | **Lack of Global Selection:** No shared "Cursor" concept across domains. |
| **Disconnected Data** | User flags a transaction in the *Evidence* tab. The *Graph* node color doesn't change until refresh. | **Fractured Stores:** Components fetch their own data; they don't share a "Single Source of Truth". |
| **Screen Real Estate** | Analyst wants Graph on Monitor 1 and Evidence on Monitor 2. Cannot do this in a single browser tap. | **Single-Window Constraint:** Treating Electron like a Chrome tab inside a wrapper. |

---

## 2. Proposed "Nervous System" Architecture

We will implement three core patterns to solve this: **The Global Context**, **Data Brushing**, and **Multi-Window Sync**.

### 2.1 The "Active Investigation Context" (Global State)
Instead of state living in pages, state lives in a **Global "Session" Store** (Zustand + IndexedDB persistence).

*   **How it works:**
    *   When a user opens a Case, the **entire app** enters "Case Mode".
    *   **The Sidebar:** Changes from generic navigation to "Case-Specific" tools (Graph, Evidence, Notes).
    *   **The Header:** Displays "Active Case: #1234 - Operation Red" persistently.
    *   **Persistence:** If the user quits and reopens, they land *exactly* where they left off, down to the scroll position.

### 2.2 Data Brushing (Cross-View Interactivity)
"Brushing" is a visualization technique where interaction in one view highlights related data in *all* other views.

*   **Scenario:**
    1.  User acts on **Investigation Canvas (`03`)**: Hovers over a "Company Node".
    2.  **Dashboard (`01`) Reaction:** The "Trend Chart" instantly dims unrelated lines and highlights the specific trend line for that Company.
    3.  **Evidence (`04`) Reaction:** The File List auto-scrolls to documents related to that Company.
*   **Implementation:**
    *   **Event Bus:** `const { hoveredEntityId } = useInvestigationStore();`
    *   **Reactive UI:** All sensitive components subscribe to `hoveredEntityId`.

### 2.3 Detachable Windows (Electron Functionality)
Power users (Forensic Accountants) use 2-3 monitors. We must support this.

*   **The Feature:** "Pop Out" button on the **Investigation Graph** and **Evidence Lab**.
*   **The Tech:**
    *   `ipcRenderer.send('open-window', { route: '/graph/123' })`.
    *   **State Sync:** This is the hard part. We use a **SharedWorker** or **IPC Relay** so that if the user clicks a node in Window A (Graph), the PDF opens in Window B (Main App).
    *   **Result:** A true multi-monitor workspace.

### 2.4 "Command Palette" (Integration Hub)
Accessing features shouldn't require clicking menus.

*   **The feature:** `Cmd+K` (macOS) / `Ctrl+K` (Windows).
*   **Capabilities:**
    *   "Nav to Settings"
    *   "Create New Case"
    *   "Search for entity 'John Doe'" (Global Search)
    *   "Set Risk Score to 90" (Action Execution)
*   **Integration:** This unifies the navigation and action layers into a single keyboard-driven interface.

---

## 3. Synchronization Strategy (Real-Time)

To prove fraud, the team must see the same truth.

### 3.1 Optimistic UI Updates
*   **Problem:** Waiting 200ms for the server to confirm a "Flag" feels sluggish.
*   **Solution:**
    1.  User clicks "Flag".
    2.  **UI Updates Instantly:** Button turns red, Graph node turns red.
    3.  **Background:** API call is sent.
    4.  **Rollback:** If API fails, UI reverts and shows a "Retry" toast.

### 3.2 WebSocket "Pulse"
*   **Scope:** Not just "Chat", but **Data**.
*   **Mechanism:**
    *   Server pushes `ENTITY_UPDATED` event `{ id: 123, risk: 90 }`.
    *   React Query Client (`queryClient.setQueryData`) intercepts this and updates the local cache.
    *   **Result:** All connected clients (and all open windows) update simultaneously without a reload.

---

## 4. User Journey: The "Integrated" Experience

1.  **Analyst** hits `Cmd+K`, types "Case 404", hits Enter.
2.  App transitions context. Sidebar shifts.
3.  Analyst pops the **Graph** to Monitor 2.
4.  On Monitor 2, Analyst clicks a **Suspicious Node**.
5.  On Monitor 1, the **Evidence List** instantly filters to show only PDFs linked to that node.
6.  Analyst flags a PDF on Monitor 1.
7.  On Monitor 2, the Node turns **Red** instantly.

This is "Deep Integration".
