# 02 — Developer Guide

Overview
--------
Developer onboarding, coding standards, API pointers, testing and CI guidance. Use this page for quick developer tasks and links to detailed runbooks.

TOC
----
- Developer Quickstart & Setup — [docs/developers/README.md](developers/README.md)
- API Reference — [docs/api/README.md](api/README.md) and [docs/API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Contributing & Coding Standards — [docs/developers/contributing.md](developers/contributing.md)
- Testing & CI — [docs/developers/TESTING_DOCUMENTATION.md](developers/TESTING_DOCUMENTATION.md) and [docs/deployment/ci-cd.md](deployment/ci-cd.md)
- Frontend Standards & UI components — [docs/developers/FRONTEND_STANDARDS.md](developers/FRONTEND_STANDARDS.md)

Visualization — Developer flow
------------------------------
```mermaid
flowchart LR
  A[Clone repo] --> B[Setup env]
  B --> C[Run tests]
  C --> D[Create branch]
  D --> E[Open PR]
  E --> F[CI runs]
  F --> G[Merge & Deploy]
```

How to use
----------
- Start with the quickstart, then follow the API and testing links for task-specific guidance.
