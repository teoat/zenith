# 🚀 Local Development Guide

This guide helps you run the fraud detection system locally for development and testing.

---

## Quick Start

### 1. Start Local Environment
```bash
./scripts/start-local.sh
```

This script will:
- ✅ Check prerequisites (Python, Node.js)
- ✅ Create `.env` files
- ✅ Install dependencies
- ✅ Initialize database
- ✅ Run tests
- ✅ Start backend (port 8000)
- ✅ Start frontend (port 5173)

### 2. Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### 3. Stop Services
```bash
./scripts/stop-local.sh
```

---

## Manual Setup (Alternative)

If you prefer to run services manually:

### Backend
```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or source ../.venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=sqlite:///./fraud_detection.db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=local-dev-secret
OPENAI_API_KEY=your-key-here
ENVIRONMENT=development
EOF

# Run server
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF

# Run dev server
npm run dev
```

---

## Environment Variables

### Backend (.env)
```bash
# Required
DATABASE_URL=sqlite:///./fraud_detection.db
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...

# Optional
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENVIRONMENT=development
```

---

## Testing

### Run All Tests
```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm test
```

### Run Specific Tests
```bash
# Fraud detection tests
pytest backend/tests/test_fraud_detection.py -v

# Evidence processor tests
pytest backend/tests/test_evidence_processor.py -v

# Frontend component tests
npm test -- VirtualizedList
```

### With Coverage
```bash
# Backend
pytest --cov=app --cov-report=html

# Frontend
npm test -- --coverage
```

---

## Common Tasks

### View Logs
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log

# Both together
tail -f backend.log frontend.log
```

### Restart Services
```bash
# Stop
./scripts/stop-local.sh

# Start
./scripts/start-local.sh
```

### Reset Database
```bash
cd backend
rm fraud_detection.db
alembic upgrade head
```

### Access Database
```bash
cd backend
sqlite3 fraud_detection.db
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Backend Won't Start
```bash
# Check logs
cat backend.log

# Check if virtual environment is activated
which python

# Reinstall dependencies
pip install -r backend/requirements.txt
```

### Frontend Won't Build
```bash
# Check logs
cat frontend.log

# Clear node_modules and reinstall
cd frontend
rm -rf node_modules
npm install
```

### Database Errors
```bash
# Reset database
cd backend
rm fraud_detection.db
alembic upgrade head
```

---

## Production Deployment

For production deployment to Kubernetes, see:
- **Deployment Script:** `./scripts/deploy-production.sh`
- **Runbook:** `docs/PRODUCTION_RUNBOOK.md`
- **K8s Guide:** `docs/KUBERNETES_DEPLOYMENT.md`

**Note:** Production deployment requires:
- Kubernetes cluster
- Domain names configured
- Production secrets
- Database (PostgreSQL)
- Redis instance

---

## Development Workflow

### 1. Make Changes
```bash
# Backend: Edit Python files
# Frontend: Edit React/TypeScript files
```

### 2. Test Changes
```bash
# Backend (auto-reload enabled)
# Just save files, server reloads automatically

# Frontend (HMR enabled)
# Save files, browser updates automatically
```

### 3. Run Tests
```bash
pytest backend/tests/
npm test --prefix frontend
```

### 4. Commit
```bash
git add .
git commit -m "Your changes"
git push
```

---

## Available Scripts

| Script | Purpose |
|--------|---------|
| `./scripts/start-local.sh` | Start local dev environment |
| `./scripts/stop-local.sh` | Stop local services |
| `./scripts/deploy-production.sh` | Deploy to production K8s |

---

## Quick Reference

### URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Ports
- Frontend: 5173
- Backend: 8000
- Redis: 6379
- PostgreSQL: 5432 (production)

### Logs
- Backend: `backend.log`
- Frontend: `frontend.log`

### Process IDs
- Backend: `backend.pid`
- Frontend: `frontend.pid`

---

**Last Updated:** 2025-12-17  
**For Issues:** Check troubleshooting section above
