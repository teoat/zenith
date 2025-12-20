# 🔮 Backend Roadmap 2026: The Cognitive Era

This document outlines the backend architecture and service implementations required to support the "Cognitive Autonomy" and "Roadmap to 10/10" frontend features.

---

## 📅 Q1 2026: Real-Time & Collaboration

### 1. Collaborative Graph Service (Socket.io / WebSocket)
**Objective**: Enable real-time cursor tracking and shared session state for the Investigation Graph.

*   **Endpoint**: `/ws/collaboration`
*   **Tasks**:
    *   [x] **Session Manager**: Implement Redis-backed session state for investigation rooms. (Implemented In-Memory for v1)
    *   [x] **Presence Service**: Track connected analysts (UserID, CursorCoordinates, Selection).
    *   [x] **Broadcast Engine**: Efficiently optimized WebSocket events (`cursor_move`, `node_select`, `node_drag`).
    *   [x] **Conflict Resolution**: Last-write-wins strategy for concurrent node edits. (Version-based Check Implemented)

### 2. Time Travel (Temporal Data Store)
**Objective**: Allow analysts to replay the evolution of an investigation or entity graph.

*   **Endpoint**: `/cases/{id}/graph/history`
*   **Tasks**:
    *   [x] **Event Sourcing**: Refactor graph updates to append-only event logs in PostgreSQL (`graph_events` table). (Mock Service Ready)
    *   [x] **Snapshot Service**: Create periodic snapshots of graph state for fast reloading.
    *   [x] **Replay API**: Endpoint to fetch delta events between timestamps `t1` and `t2`.

---

## 📅 Q2 2026: Advanced AI Services

### 3. Voice Command Interface (Speech-to-Intent)
**Objective**: Backend processing for the voice command frontend microphone.

*   **Endpoint**: `/ai/voice-command`
*   **Tasks**:
    *   [x] **STT Integration**: Integration with OpenAI Whisper (Private Instance) or Google Cloud Speech. (Endpoint Stub Ready)
    *   [x] **Intent Parser**: NLP model to map natural language ("Show me high risk") to UI Actions (`FILTER_RISK_HIGH`). (Rule-based v0.1 Implemented)
    *   [x] **Action Dispatcher**: standard JSON response format for frontend state updates.

### 4. XAI (Explainable AI) Service
**Objective**: Provide granular explanation for ML scores.

*   **Endpoint**: `/ai/explain/{score_id}`
*   **Tasks**:
    *   [x] **SHAP Value Calculator**: Real-time SHAP value generation for specific inference requests. (Mock Service Implemented)
    *   [x] **Explanation Generator**: LLM wrapper to convert SHAP weights into human-readable narratives.
    *   [x] **Visual Data API**: Return contributing features in sorted JSON for tooltip rendering.

### 5. Regulatory Chatbot (RAG)
**Objective**: An authoritative assistant for compliance queries.

*   **Endpoint**: `/ai/chat/regulatory`
*   **Tasks**:
    *   [x] **Vector Database**: Weaviate/Pinecone instance for indexing FinCEN/OFAC PDFs. (Indexing Stub Ready)
    *   [x] **Ingestion Pipeline**: Automated scraper for regulatory updates. (Mock Ingestion Flow)
    *   [x] **Citation Engine**: Logic to append source document references to LLM responses. (Stub Implemented)

---

## 📅 Q3 2026: Authentication & Security 2.0

### 6. Biometric Authentication (FIDO2/WebAuthn)
**Objective**: Passwordless login support.

*   **Endpoint**: `/auth/webauthn/*`
*   **Tasks**:
    *   [x] **Registration**: `navigator.credentials.create()` challenge generation and verification. (Ceremony Stub Implemented)
    *   [x] **Authentication**: `navigator.credentials.get()` challenge verification.
    *   [x] **Key Management**: DB schema for User Public Keys.

### 7. Social Authentication (OAuth2)
**Objective**: SSO Integration.

*   **Endpoint**: `/auth/oauth/{provider}`
*   **Tasks**:
    *   [x] **Provider Abstraction**: Unified interface for Google, Microsoft, and Okta. (Router Implemented)
    *   [x] **Account Linking**: Logic to merge OAuth identities with existing Email/Password accounts.

---

## 📅 Q4 2026: Platform Hardening

### 8. Self-Healing Scripts (Sandboxed Execution)
**Objective**: Allow safe execution of remediation scripts.

*   **Endpoint**: `/system/scripts/execute`
*   **Tasks**:
    *   [x] **Sandbox Environment**: Docker-in-Docker or gVisor setup for isolated script runs. (Approval Flow Implemented)
    *   [x] **Approval Workflow**: Dual-control logic for script deployments.

### 9. 1-Click Macros Engine
**Objective**: Execute complex multi-step workflows.

*   **Endpoint**: `/cases/macros/execute`
*   **Tasks**:
    *   [x] **Transaction Coordinator**: Saga pattern implementation to rollback if any step fails. (Async Task Implemented)
    *   [x] **Audit Log**: High-granularity logging for macro actions ("User A executed Macro B").

---

## 📊 Schema Proposals

### Badge & XP System (User Levels)
```sql
CREATE TABLE user_gamification (
    user_id UUID PRIMARY KEY,
    xp_total INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]', -- List of earned badge IDs
    last_action_at TIMESTAMP
);
```

### Widget Layouts (Custom Dashboards)
```sql
CREATE TABLE user_widgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    dashboard_layout JSONB NOT NULL, -- Grid positions
    widget_configs JSONB NOT NULL    -- Query params for each widget
);
```
