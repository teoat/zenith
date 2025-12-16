# Getting Started - Canonical Guide

> **Resides at:** `docs/guides/GETTING_STARTED_FINAL.md`
> **Consolidates:** `docs/guides/installation.md`, `docs/guides/getting-started.md`
> **Status:** Active / Canonical Source of Truth
> **Last Updated:** 2025-12-10

This document is the **single source of truth** for getting started with Simple378, covering both **End Users** (Installation) and **Developers** (Development Setup).

---

## 🧭 Table of Contents

1. [Part A: End User Installation](#part-a-end-user-installation)
    - [System Requirements](#system-requirements)
    - [Installation Steps (Windows/Mac/Linux)](#installation-steps)
    - [First Launch & Setup](#first-launch--setup)
2. [Part B: Developer Onboarding](#part-b-developer-onboarding)
    - [Prerequisites](#prerequisites)
    - [Initial Setup](#initial-setup)
    - [Development Workflow](#development-workflow)
3. [Part C: Where to Go Next](#part-c-where-to-go-next)

---

# Part A: End User Installation

This section is for investigators and analysts who need to install the application.

## System Requirements

| Requirement | Minimum | Recommended |
|:---|:---|:---|
| **OS** | Windows 10+, macOS 10.15+, Ubuntu 18.04+ | Windows 11+, macOS 13+ (Apple Silicon), Ubuntu 22.04+ |
| **RAM** | 8 GB | 16 GB+ |
| **Disk** | 10 GB free | 20 GB free (SSD) |

## Installation Steps

### 🍎 macOS
1. **Download**: `Simple378-1.0.0.dmg` (Intel) or `Simple378-1.0.0-arm64.dmg` (M1/M2) from [Releases](https://github.com/your-org/378x492/releases).
2. **Install**: Open `.dmg` and drag icon to **Applications**.
3. **Launch**: Right-click icon -> "Open" (first time only security verification).

### 🪟 Windows
1. **Download**: `Simple378-Setup-1.0.0.exe`.
2. **Install**: Run installer. Accept admin prompts.
3. **Launch**: Open "Simple378" from Start Menu.

### 🐧 Linux
1. **Download**: `Simple378-1.0.0.AppImage` (Recommended) or `.deb`.
2. **Run**:
   ```bash
   chmod +x Simple378-1.0.0.AppImage
   ./Simple378-1.0.0.AppImage
   ```

## First Launch & Setup
1. **Master Password**: You will be asked to set a compliant master password (12+ chars, mixed). This encrypts your local database. **Do not lose this.**
2. **Database Location**: Defaults to `~/.378x492/frauddb.db`.
3. **Theme**: Choose Light/Dark/System.

---

# Part B: Developer Onboarding

This section is for software engineers contributing to the codebase.
**Architecture Note**: Simple378 is a cross-platform **Electron** app with an embedded **FastAPI** (Python) backend.

## Prerequisites
- **Node.js** 20+
- **Python** 3.12+
- **Git**
- **Platform Tools**: Xcode CLI (Mac), VS Build Tools (Win), `build-essential` (Linux).

## Initial Setup

1. **Clone & Install Frontend:**
   ```bash
   git clone <repo> && cd 378x492
   npm install
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Win: venv\Scripts\activate
   pip install -r requirements.txt
   # Initialize DB
   python scripts/init_db.py
   python scripts/seed_data.py
   ```

3. **Start Development (All-in-One):**
   ```bash
   # From root directory
   npm run electron:dev
   ```
   This launches: React Renderer (HMR) + FastAPI Backend + Electron Main Process.

## Development Workflow

- **Backend-only**: `cd backend && uvicorn main:app --reload` (http://localhost:8000)
- **Frontend-only**: `cd frontend && npm run dev` (http://localhost:5173 - needs backend running)
- **Tests**:
    - Backend: `pytest backend/tests`
    - Frontend: `npm run test`
    - E2E: `npm run test:e2e`

## Project Structure
- `electron/`: Main process & IPC.
- `backend/`: FastAPI app, SQLCipher models.
- `frontend/`: React + TypeScript UI.
- `release/`: Build artifacts.

---

# Part C: Where to Go Next

- **User**: Check out the [First Case Tutorial](first-case.md) or [Basic Usage](basic-usage.md).
- **Developer**: Read the [Architecture Overview](../architecture/CORE_ARCHITECTURE.md) or [Security Guide](../security/SECURITY_FULL.md).
