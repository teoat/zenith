#!/bin/bash
# Stop Local Development Servers

echo "🛑 Stopping local development servers..."

# Stop backend
if [[ -f "backend.pid" ]]; then
  BACKEND_PID=$(cat backend.pid)
  if kill $BACKEND_PID 2>/dev/null; then
    echo "✓ Backend stopped (PID: $BACKEND_PID)"
  else
    echo "⚠️  Backend process not found"
  fi
  rm backend.pid
fi

# Stop frontend
if [[ -f "frontend.pid" ]]; then
  FRONTEND_PID=$(cat frontend.pid)
  if kill $FRONTEND_PID 2>/dev/null; then
    echo "✓ Frontend stopped (PID: $FRONTEND_PID)"
  else
    echo "⚠️  Frontend process not found"
  fi
  rm frontend.pid
fi

# Also try to kill by port (backup)
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✓ Killed processes on port 8000"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✓ Killed processes on port 5173"

echo "✅ All services stopped"
