#!/bin/bash
# Production Deployment Script
# Automates deployment to production environment

set -e  # Exit on error

echo "🚀 Starting Production Deployment..."
echo "======================================"

# Configuration
ENVIRONMENT="production"
VERSION=$(git describe --tags --always)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/${TIMESTAMP}"

# Colors for output
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Pre-deployment checks
echo -e "\n${YELLOW}📋 Pre-Deployment Checks${NC}"
echo "======================================"

# 1. Check Git status
echo "✓ Checking Git status..."
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Error: Uncommitted changes detected${NC}"
  exit 1
fi

# 2. Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo -e "${RED}Error: Not on main branch (current: $CURRENT_BRANCH)${NC}"
  exit 1
fi

# 3. Run tests
echo "✓ Running test suite..."
cd backend && python -m pytest -v --cov=app --cov-report=term-missing || {
  echo -e "${RED}Error: Backend tests failed${NC}"
  exit 1
}

cd ../frontend && npm test -- --watchAll=false --coverage || {
  echo -e "${RED}Error: Frontend tests failed${NC}"
  exit 1
}

cd ..

# 4. Check environment variables
echo "✓ Checking environment variables..."
required_vars=(
  "DATABASE_URL"
  "REDIS_URL"
  "JWT_SECRET"
  "OPENAI_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo -e "${RED}Error: $var not set${NC}"
    exit 1
  fi
done

# Build Phase
echo -e "\n${YELLOW}🏗️  Build Phase${NC}"
echo "======================================"

# 1. Build frontend
echo "✓ Building frontend..."
cd frontend
npm run build || {
  echo -e "${RED}Error: Frontend build failed${NC}"
  exit 1
}
cd ..

# 2. Install backend dependencies
echo "✓ Installing backend dependencies..."
cd backend
pip install -r requirements.txt --no-cache-dir || {
  echo -e "${RED}Error: Backend installation failed${NC}"
  exit 1
}
cd ..

# Database Migration
echo -e "\n${YELLOW}🗄️  Database Migration${NC}"
echo "======================================"

# 1. Backup current database
echo "✓ Creating database backup..."
mkdir -p "$BACKUP_DIR"
pg_dump $DATABASE_URL > "$BACKUP_DIR/database_backup.sql" || {
  echo -e "${RED}Warning: Database backup failed${NC}"
}

# 2. Run migrations
echo "✓ Running database migrations..."
cd backend
alembic upgrade head || {
  echo -e "${RED}Error: Migration failed${NC}"
  echo "Restoring from backup..."
  psql $DATABASE_URL < "../$BACKUP_DIR/database_backup.sql"
  exit 1
}
cd ..

# Deployment to Kubernetes
echo -e "\n${YELLOW}☸️  Kubernetes Deployment${NC}"
echo "======================================"

# 1. Apply configurations
echo "✓ Applying Kubernetes configurations..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 2. Deploy database
echo "✓ Deploying stateful services..."
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-statefulset.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l app=postgres -n fraud-detection --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n fraud-detection --timeout=300s

# 3. Deploy application
echo "✓ Deploying application services..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for deployment
kubectl rollout status deployment/backend -n fraud-detection --timeout=600s
kubectl rollout status deployment/frontend -n fraud-detection --timeout=600s

# 4. Apply autoscaling
echo "✓ Configuring autoscaling..."
kubectl apply -f k8s/hpa.yaml

# 5. Configure ingress
echo "✓ Setting up ingress..."
kubectl apply -f k8s/ingress.yaml

# Health Checks
echo -e "\n${YELLOW}🏥 Health Checks${NC}"
echo "======================================"

# Wait for services to be healthy
sleep 30

# Check backend health
echo "✓ Checking backend health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.fraud-detection.com/health)
if [[ "$BACKEND_HEALTH" != "200" ]]; then
  echo -e "${RED}Error: Backend health check failed (HTTP $BACKEND_HEALTH)${NC}"
  exit 1
fi

# Check frontend
echo "✓ Checking frontend..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://fraud-detection.com)
if [[ "$FRONTEND_HEALTH" != "200" ]]; then
  echo -e "${RED}Error: Frontend health check failed (HTTP $FRONTEND_HEALTH)${NC}"
  exit 1
fi

# Check database connectivity
echo "✓ Verifying database connectivity..."
kubectl exec -n fraud-detection deployment/backend -- python -c "
from app.core.database import engine
try:
    engine.connect()
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
"

# Post-Deployment Tasks
echo -e "\n${YELLOW}📊 Post-Deployment Tasks${NC}"
echo "======================================"

# 1. Tag release
echo "✓ Tagging release..."
git tag -a "v${VERSION}" -m "Production deployment ${TIMESTAMP}"
git push origin "v${VERSION}"

# 2. Create deployment log
echo "✓ Creating deployment log..."
cat > "$BACKUP_DIR/deployment.log" << EOF
Deployment Summary
==================
Version: ${VERSION}
Environment: ${ENVIRONMENT}
Timestamp: ${TIMESTAMP}
User: $(whoami)
Branch: ${CURRENT_BRANCH}
Commit: $(git rev-parse HEAD)

Services Deployed:
- Frontend: ✓
- Backend: ✓
- PostgreSQL: ✓
- Redis: ✓

Health Checks:
- Backend API: HTTP ${BACKEND_HEALTH}
- Frontend: HTTP ${FRONTEND_HEALTH}
- Database: Connected

Backup Location: ${BACKUP_DIR}
EOF

# 3. Notify team
echo "✓ Sending notifications..."
if [[ -n "$SLACK_WEBHOOK" ]]; then
  curl -X POST -H 'Content-type: application/json' \
    --data '{
      "text":"🚀 Production Deployment Complete",
      "blocks":[
        {
          "type":"section",
          "text":{
            "type":"mrkdwn",
            "text":"*Production Deployment Successful*\n• Version: '"${VERSION}"'\n• Environment: Production\n• Status: All systems operational ✅"
          }
        }
      ]
    }' \
    "$SLACK_WEBHOOK"
fi

# Summary
echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "======================================"
echo "Version: ${VERSION}"
echo "Environment: ${ENVIRONMENT}"
echo "Deployed at: ${TIMESTAMP}"
echo ""
echo "URLs:"
echo "  Frontend: https://fraud-detection.com"
echo "  API: https://api.fraud-detection.com"
echo "  Monitoring: https://grafana.fraud-detection.com"
echo ""
echo "Backup: ${BACKUP_DIR}"
echo ""
echo -e "${GREEN}All systems operational! 🎉${NC}"
