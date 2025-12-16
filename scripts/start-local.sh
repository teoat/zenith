#!/bin/bash
# Local Development Setup Script
# Sets up and runs the application locally for development/testing

set -e

echo "🚀 Starting Local Development Environment..."
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running from project root
if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]]; then
  echo -e "${RED}Error: Please run this script from the project root${NC}"
  exit 1
fi

# 1. Check Prerequisites
echo -e "\n${YELLOW}📋 Checking Prerequisites${NC}"
echo "========================================"

# Check Python
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}Error: Python 3 not found${NC}"
  exit 1
fi
echo "✓ Python 3: $(python3 --version)"

# Check Node
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js not found${NC}"
  exit 1
fi
echo "✓ Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm not found${NC}"
  exit 1
fi
echo "✓ npm: $(npm --version)"

# 2. Set Up Environment Variables
echo -e "\n${YELLOW}🔧 Setting Up Environment${NC}"
echo "========================================"

# Create .env file if it doesn't exist
if [[ ! -f "backend/.env" ]]; then
  echo "✓ Creating backend/.env file..."
  cat > backend/.env << 'EOF'
# Local Development Environment Variables
DATABASE_URL=sqlite:///./fraud_detection.db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=local-dev-secret-change-in-production
OPENAI_API_KEY=your-openai-api-key-here
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Optional
TESSERACT_CMD=/usr/local/bin/tesseract
EOF
  echo -e "${YELLOW}⚠️  Please edit backend/.env and add your OPENAI_API_KEY${NC}"
else
  echo "✓ backend/.env exists"
fi

# Create frontend .env
if [[ ! -f "frontend/.env" ]]; then
  echo "✓ Creating frontend/.env file..."
  cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENVIRONMENT=development
EOF
else
  echo "✓ frontend/.env exists"
fi

# 3. Install Dependencies
echo -e "\n${YELLOW}📦 Installing Dependencies${NC}"
echo "========================================"

# Backend dependencies
echo "✓ Installing backend dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [[ ! -d "venv" ]] && [[ ! -d "../.venv" ]]; then
  echo "  Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate virtual environment
if [[ -d "venv" ]]; then
  source venv/bin/activate
elif [[ -d "../.venv" ]]; then
  source ../.venv/bin/activate
fi

# Install requirements
pip install -q -r requirements.txt
echo "  ✓ Backend dependencies installed"

cd ..

# Frontend dependencies
echo "✓ Installing frontend dependencies..."
cd frontend
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
npm install
=======
npm install --silent
>>>>>>> Stashed changes
=======
npm install --silent
>>>>>>> Stashed changes
=======
npm install --silent
>>>>>>> Stashed changes
echo "  ✓ Frontend dependencies installed"

cd ..

# 4. Initialize Database
echo -e "\n${YELLOW}🗄️  Initializing Database${NC}"
echo "========================================"

cd backend

# Check if Alembic is set up
if [[ -d "alembic" ]]; then
  echo "✓ Running database migrations..."
  alembic upgrade head 2>/dev/null || echo "  ⚠️  No migrations to run"
else
  echo "  ℹ️  No Alembic migrations configured"
fi

cd ..

# 5. Run Tests
echo -e "\n${YELLOW}🧪 Running Tests${NC}"
echo "========================================"

# Backend tests
echo "✓ Running backend tests..."
cd backend
python -m pytest tests/ -v --tb=short -q 2>&1 | tail -20 || echo "  ⚠️  Some tests may have failed"
cd ..

# Frontend tests (optional, can be slow)
# echo "✓ Running frontend tests..."
# cd frontend
# npm test -- --watchAll=false --silent 2>&1 | tail -10 || echo "  ⚠️  Some tests may have failed"
# cd ..

# 6. Start Services
echo -e "\n${YELLOW}🚀 Starting Services${NC}"
echo "========================================"

# Start backend in background
echo "✓ Starting backend server..."
cd backend
if [[ -d "venv" ]]; then
  source venv/bin/activate
elif [[ -d "../.venv" ]]; then
  source ../.venv/bin/activate
fi

# Start with uvicorn
nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo $BACKEND_PID > ../backend.pid

cd ..

# Wait for backend to start
echo "  Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓ Backend is running on http://localhost:8000${NC}"
else
  echo -e "  ${RED}✗ Backend failed to start. Check backend.log${NC}"
fi

# Start frontend
echo "✓ Starting frontend dev server..."
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo $FRONTEND_PID > ../frontend.pid

cd ..

# Wait for frontend to start
echo "  Waiting for frontend to start..."
sleep 5

# Summary
echo -e "\n${GREEN}✅ Local Development Environment Ready!${NC}"
echo "========================================"
echo ""
echo "📍 Application URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Process IDs:"
echo "  Backend:  $BACKEND_PID (saved to backend.pid)"
echo "  Frontend: $FRONTEND_PID (saved to frontend.pid)"
echo ""
echo "📝 Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop services:"
echo "  ./scripts/stop-local.sh"
echo "  or: kill \$(cat backend.pid) \$(cat frontend.pid)"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"
