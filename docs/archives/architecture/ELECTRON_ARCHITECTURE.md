# Electron Architecture — Canonical Full (Merged)

**Change impact (keep in sync):**
- Reflect IPC or packaging changes in `docs/deployment/PRODUCTION_DEPLOYMENT.md`, `docs/guides/GETTING_STARTED.md`, and any security notes in `docs/security/SECURITY.md`.
- If preload/IPC contracts change, sync related snippets in `electron/*.js` and update developer tips in `docs/developer/MCP_CONFIG.md` if tooling changes.
- Keep originals in `architecture/01_*.md`/`02_*.md`/`03_*.md` for traceability until archived, and rerun docs link check after edits.

This canonical document consolidates desktop-specific architecture and UI implementation details from:
- `architecture/01_core_foundation_electron.md`
- `architecture/02_ui_design_electron.md`
- `architecture/03_technical_electron.md`

It summarizes key sections and points to the original files (left in place) for full verbatim content. Originals can be archived in a follow-up step if you want them moved.

---

## 1. Core Foundation — Desktop App (summary)
- Desktop framework: Electron (main + renderer)
- Embedded backend: Python 3.11 + FastAPI, packaged with PyInstaller for releases
- IPC: secure IPC patterns (HMAC signed), `preload.js` context isolation, no `nodeIntegration`
- Packaging: `electron-builder` + PyInstaller for cross-platform installers
- Local DB: SQLite with SQLCipher encryption

## 2. UI Design System — Desktop
- Layout: Sidebar navigation, main content, status bar, detachable windows
- Component system: `shadcn/ui` + Tailwind CSS; component design optimized for multi-monitor workflows
- Accessibility: WCAG 2.1 AA checks, keyboard navigation, ARIA roles, focus management
- Performance: virtualization, worker offloads, code splitting

## 3. Technical Implementation
- Process architecture: Electron main ↔ renderer ↔ Python backend (HTTP over loopback or IPC)
- Development workflow: `npm run electron:dev` starts React, Python backend, and Electron with hot reload
- Build steps: detailed packaging commands live in `deployment/PRODUCTION_DEPLOYMENT.md` and `electron-builder.json`

## 4. Communication & State Sync
- Global session store (Zustand + IndexedDB) for cross-window synchronization
- IPC patterns: event bus for hover/select sync, secure message signing
- Multi-window strategy: Pop-out routes via `ipcRenderer.send('open-window', { route })` and state relay via SharedWorker or IPC relay

---

## Preservation & Next Steps
- Full verbatim content remains in the original files. If you approve, I will create archived copies under `docs/archives/architecture/` and replace the originals with forwarded pointers or move them into an `archive/` folder.
- Cross-references will be updated after you confirm the merge strategy.
