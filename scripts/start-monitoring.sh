#!/bin/bash
# Monitoring Stack Quick Start
# This script sets up and verifies the monitoring infrastructure

set -e

echo "🚀 Starting Monitoring Stack Setup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Navigate to monitoring directory
cd "$(dirname "$0")/../monitoring"

# Pull latest images
echo ""
echo "📦 Pulling latest Docker images..."
docker-compose pull

# Start the stack
echo ""
echo "🎬 Starting monitoring stack..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Check service status
echo ""
echo "🔍 Checking service status..."
docker-compose ps

# Test Prometheus
echo ""
echo "🧪 Testing Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "⚠️  Prometheus may not be ready yet"
fi

# Test Grafana
echo ""
echo "🧪 Testing Grafana..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "⚠️  Grafana may not be ready yet"
fi

# Print access info
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Monitoring Stack Started Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Access Dashboards:"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana:    http://localhost:3001 (admin/admin)"
echo "  • Alertmanager: http://localhost:9093"
echo ""
echo "🔧 Useful Commands:"
echo "  • View logs:    docker-compose logs -f"
echo "  • Stop stack:   docker-compose down"
echo "  • Restart:      docker-compose restart"
echo ""
echo "📖 Next Steps:"
echo "  1. Open Grafana and add Prometheus data source"
echo "  2. Import pre-built dashboards"
echo "  3. Configure alert notifications"
echo ""
