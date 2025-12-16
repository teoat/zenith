# Documentation Master Index

Welcome to the AntiGravity Project Documentation.

This directory contains the single source of truth for all technical, strategic, and user-facing documentation.

---

## 📂 Directory Structure

### 🏗 [Architecture](./architecture/)

> **For:** Engineers, Architects  
> **Contains:** Comprehensive system design and technical details.

- [System Architecture](./architecture/SYSTEM_ARCHITECTURE.md) — Single source of truth for Architecture, Tech Stack, Data Models, and Core Logic

### 🎨 [Frontend Pages](./frontend/pages/)

> **For:** UI/UX Designers & Frontend Developers  
> **Contains:** Detailed technical specifications, layout designs, and component breakdowns for each application page.

| Page | Description |
|:-----|:------------|
| [Dashboard](./frontend/pages/dashboard.md) | KPIs, Threat Map, AI Watchtower |
| [Cases](./frontend/pages/cases.md) | Investigation workflow, timeline |
| [Evidence](./frontend/pages/evidence.md) | Multi-modal ingestion, forensics |
| [Reconciliation](./frontend/pages/reconciliation.md) | Matching engine, exceptions |
| [Adjudication](./frontend/pages/adjudication.md) | Decision workflow |
| [Reporting](./frontend/pages/reporting.md) | SAR generation, exports |
| [Settings](./frontend/pages/settings.md) | User preferences, system config |
| [AI Assistant](./frontend/pages/ai_assistant.md) | RAG, chat, personas |
| [Visualizations](./frontend/pages/visualizations.md) | Network graphs, charts |

### 📖 [User Manual](./guides/)

> **For:** End Users & Stakeholders  
> **Contains:** Unified guide for all features and workflows.

- [User Manual](./guides/USER_MANUAL.md) — Detailed guides for Dashboard, Cases, Evidence, AI, etc.

### 💻 [Developer](./developer/)

> **For:** Contributors  
> **Contains:** Setup, standards, and contribution guidelines.

- [Developer Guide](./developer/DEVELOPER_GUIDE.md)

### 🚀 [Deployment](./deployment/)

> **For:** DevOps  
> **Contains:** Deployment, CI/CD, and configuration.

- [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)

### 🔧 [Operations](./operations/)

> **For:** DevOps & SREs  
> **Contains:** Diagnostics, monitoring, and testing procedures.

- [Operations Guide](./operations/OPERATIONS_GUIDE.md) — Unified diagnostics, monitoring, and testing

### 📅 [Planning](./planning/)

> **For:** Project Managers  
> **Contains:** Vision and tracking.

- [Master Roadmap](./planning/MASTER_ROADMAP.md)
- [Implementation Status](./planning/implementation-status.md)

### 🔒 [Security](./security/)

> **For:** Security Engineers  
> **Contains:** Security policies and procedures.

- [Security Guide](./security/SECURITY.md)

### 🛠 [API](./api/)

> **For:** Backend Developers  
> **Contains:** API reference and OpenAPI specification.

- [API Documentation](./api/README.md)
- [Combined API Reference](./api/COMBINED_API.md)
- [OpenAPI Spec](./api/openapi.yaml)

---

## 📝 Master Documents & Synchronization

### Critical Master Documents (Project Root)

| Document | Purpose |
|:---------|:--------|
| **[Master Plan](../master_plan.md)** | Strategic vision, architecture, and execution framework |
| **[Master TODO](../master_todo.md)** | Detailed task tracking and phase management |
| **[Master Roadmap](./planning/MASTER_ROADMAP.md)** | Timeline, feature sequence, and delivery schedule |

### Documentation Synchronization

> **Required reading for all agents editing documentation:**

📖 **[Cross-Reference Sync Guide](./CROSS_REFERENCE_SYNC_GUIDE.md)** — Complete synchronization procedures

- Section 0: Quick Start Checklist (TL;DR)
- Section 1-6: Document-specific sync rules
- Section 7-12: Procedures, matrix, and incident response

---

## 🛠 Maintenance

Run link checker after any documentation change:

```bash
python3 docs/scripts/check_links.py
```

---

## 📁 Archives

Historical and superseded documentation is preserved in `docs/archives/` for reference:

- `archives/meta/` — Migration guides, audit summaries
- `archives/ops/` — Legacy monitoring/testing docs
- `archives/security/` — Superseded security files
- `archives/guides_features/` — Original feature documentation