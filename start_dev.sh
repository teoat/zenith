#!/bin/bash
# Zenith Platform - Quick Start Script
# Starts all services for local development

set -e

echo "=========================================="
echo "  Zenith Platform - Development Startup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[92m'
YELLOW='\033[93m'
RESET='\033[0m'

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Please start Docker Desktop first.${RESET}"
    echo ""
    echo "After starting Docker Desktop, run:"
    echo "  docker-compose up -d"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}Starting services...${RESET}"
echo ""

# Start Redis separately first
echo "Starting Redis..."
docker run -d --name zenith-redis-dev \
    -p 6379:6379 \
    redis:7-alpine 2>/dev/null || echo "Redis container already exists"

# Start Backend
echo "Starting Backend..."
cd "$SCRIPT_DIR"
docker-compose up -d backend

# Start Frontend
echo "Starting Frontend..."
docker-compose up -d frontend

echo ""
echo "=========================================="
echo -e "  ${GREEN}Services Started!${RESET}"
echo "=========================================="
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Redis:    localhost:6379"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down -v"
