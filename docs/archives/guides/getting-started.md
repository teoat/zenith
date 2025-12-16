# Developer Onboarding Guide - Electron Desktop App

Welcome to the Simple378 Fraud Detection System! This guide will help you get up and running with **Electron desktop application development**.

> **Note**: This project is a cross-platform **Electron desktop app** with embedded Python backend, NOT a web application.

## Quick Start (10 minutes)

### Prerequisites
- **Node.js** 20+ (for Electron and React frontend)
- **Python** 3.12+ (for FastAPI backend)
- **Git**
- **Platform-specific tools**:
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Windows: Visual Studio Build Tools
  - Linux: `build-essential` package

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 378x492
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Set up Python backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

4. **Start Electron in development mode**
   ```bash
   npm run electron:dev
   # This starts:
   # - React frontend (renderer process)
   # - Python FastAPI backend (embedded server)
   # - Electron main process (window management)
   ```

5. **App opens automatically**
   - Login screen appears in Electron window
   - Test credentials: `admin@example.com` / `admin123`


## Project Structure

```
378x492/
├── electron/                # Electron main process
│   ├── main.js             # App lifecycle, window management
│   ├── preload.js          # Secure IPC bridge
│   ├── ipc/                # IPC handlers
│   └── utils/              # Electron utilities
│
├── backend/                 # FastAPI backend (embedded)
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── schemas/        # Pydantic schemas
│   ├── core/               # Core utilities
│   ├── tests/              # Test suite
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React + TypeScript (renderer)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── package.json       # Node dependencies
│
├── release/                # Built installers (.dmg, .exe, AppImage)
├── package.json            # Electron app  dependencies
└── electron-builder.json   # Packaging configuration
```

## Development Workflow

### Electron Development (All-in-One)

**Recommended**: Run complete Electron app with hot-reload

```bash
npm run electron:dev
# Starts React + Python backend + Electron window
# Hot-reload enabled for frontend changes
```

### Backend Development (Standalone)

For backend-only development:

1. **Create virtual environment** (first time only)
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize SQLite database**
   ```bash
   # Create database file
   python scripts/init_db.py
   ```

4. **Seed test data**
   ```bash
   python scripts/seed_data.py
   ```

5. **Start development server** (standalone)
   ```bash
   uvicorn main:app --reload
   # API will be at http://localhost:8000
   ```

### Frontend Development (Standalone)

For frontend-only development (useful for UI work):

1. **Install dependencies** (first time only)
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   # Opens at http://localhost:5173
   # Note: Backend must be running separately
   ```

3. **Run linter**
   ```bash
   npm run lint
   ```

4. **Build for production**
   ```bash
   npm run build
   # Outputs to frontend/dist/
   ```

### Electron-Specific Development

**Build Electron app** (for testing packaging):
```bash
npm run electron:build          # Current platform only
npm run electron:build:mac      # macOS .dmg
npm run electron:build:win      # Windows .exe
npm run electron:build:linux    # Linux AppImage
```

**Debug Electron main process**:
```bash
npm run electron:dev -- --inspect
# Then attach Node debugger to port 5858
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v                    # All tests
pytest tests/unit -v                # Unit tests only
pytest tests/integration -v         # Integration tests
pytest --cov=. --cov-report=html   # With coverage
```

### Frontend Tests
```bash
cd frontend
npm run test                        # Unit tests
npm run test:e2e                   # E2E tests
```

### Electron Tests
```bash
npm run test:electron              # Electron-specific tests
```

## Common Tasks

### Create a new API endpoint

1. Define route in `backend/app/routers/`
2. Add business logic to `backend/app/services/`
3. Create Pydantic schemas in `backend/app/schemas/`
4. Write tests in `backend/tests/`

### Create a new React component

1. Create component in `frontend/src/components/`
2. Export from `index.ts`
3. Use TypeScript for type safety
4. Follow accessibility guidelines

### Add a database migration

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Debug issues

- **Electron**: Check developer console (Cmd/Ctrl+Shift+I)
- **Backend**: Check terminal output where `uvicorn` is running
- **Frontend**: Use Electron DevTools (same as Chrome DevTools)
- **Database**: Use SQLite browser or `sqlite3` CLI tool

## Code Style

### Backend (Python)
- Follow PEP 8
- Use type hints
- Maximum line length: 100
- Use docstrings for functions

### Frontend (TypeScript)
- Use functional components
- Prefer hooks over class components
- Use TypeScript interfaces
- Follow React best practices

### Electron (Node.js/TypeScript)
- Secure IPC patterns (no `nodeIntegration`)
- HMAC-sign sensitive IPC messages
- Follow Electron security best practices

## Git Workflow

1. Create feature branch from `develop`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. Push and create pull request
   ```bash
   git push origin feature/your-feature-name
   ```

4. Request code review
5. Merge after approval

## Useful Commands

```bash
# Start full Electron app
npm run electron:dev

# Build Electron installer
npm run electron:build

# View backend logs
cd backend && uvicorn main:app --reload

# Check Electron app health
# (Opens in Electron window, check DevTools console)

# Reset local database
rm -rf ~/.378x492/frauddb.db
python backend/scripts/init_db.py
python backend/scripts/seed_data.py
```


## Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLCipher Documentation](https://www.zetetic.net/sqlcipher/documentation/)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Deployment Guide](./DEPLOYMENT.md) (Packaging & Distribution)

## Getting Help

- Check documentation first
- Search existing GitHub issues
- Ask in team Slack channel: `#fraud-detection-dev`
- Create GitHub issue for bugs/features

## Next Steps

1. Read the [Architecture Overview](../README.md)
2. Review [Electron Integration Guide](./PAGES_WORKFLOW.md)
3. Understand [SQLCipher Security](./developer/security.md)
4. Review [Packaging Guide](./DEPLOYMENT.md)
5. Join daily standup meetings

Welcome aboard! 🚀
```
