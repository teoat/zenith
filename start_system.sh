#!/bin/bash

# Ensure log directory exists
mkdir -p backend/logs

# Kill any existing processes on ports 8000 (backend) and 5174 (frontend)
echo "Cleaning up ports..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

# Start Backend
echo "Starting Backend..."
source backend/venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
# Run in background with nohup
nohup uvicorn backend.main:app --reload --port 8000 > backend/logs/server.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 5

# Start Frontend
echo "Starting Frontend..."
cd frontend
# Run in background with nohup
nohup npm run dev -- --port 5174 > ../frontend_server.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID"

echo "System is up!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5174"
