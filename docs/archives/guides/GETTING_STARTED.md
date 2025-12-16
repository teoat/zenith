# Getting Started — Canonical Guide

**Change impact (keep in sync):**
- Update nav links in `docs/README.md` and any product onboarding references in `docs/scripts/consolidate_root.py`.
- If you change install/prereq steps, also update installer notes in `docs/deployment/README.md` and desktop packaging notes in `docs/architecture/ELECTRON_ARCHITECTURE.md`.
- After edits, run the docs link check workflow or `lychee` locally to ensure links stay valid.

**Sources preserved in archives:**
- User guide archive: `docs/archives/guides/GETTING_STARTED.md`
- Developer guide archive: `docs/archives/guides/getting-started.md`

---

## Part A — User Onboarding (summary)
- Platforms: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+), 8GB RAM (16GB recommended), 2GB disk.
- Install: download from releases, run installer/DMG/AppImage; ensure executable bit on Linux.
- First launch wizard: set master password (SQLCipher), optional 2FA, auto-lock, DB location (`~/.378x492/`), theme, notifications, auto-update.
- UI basics: navigation bar + sidebar (Cases, Evidence, Analytics, Settings), status bar. Keyboard: `Cmd/Ctrl+N` new case, `Cmd/Ctrl+F` search, `Cmd/Ctrl+,` settings.
- First case flow: create case → add evidence (OCR, metadata, fraud patterns) → add transactions (manual/CSV/API) → review risk scoring (0–100).

## Part B — Developer Onboarding (summary)
- Project type: Electron desktop app with embedded FastAPI backend.
- Quick start: install Node 18+, Python 3.11+, create venv, `npm install`, `pip install -r backend/requirements.txt`, run `npm run electron:dev` (starts React, FastAPI via Uvicorn, Electron shell).
- Build: desktop packaging uses `electron-builder` + PyInstaller (see `docs/deployment/PRODUCTION_DEPLOYMENT.md`).
- Dev tips: keep `nodeIntegration` off, use `preload.js` for IPC, run `/health` and `/metrics` to verify backend.

## Troubleshooting pointers
- Desktop/ops issues: see `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md`.
- User-facing issues: see `docs/guides/TROUBLESHOOTING_USER.md`.

## When editing this file
- Keep user vs developer sections clearly separated.
- Add/update links to affected files above so downstream docs stay in sync.
- Re-run docs link check after changes.
