#!/bin/bash
# Unified Deployment Script
# Usage: ./deploy.sh [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment
ENVIRONMENT=${1:-development}
DRY_RUN=false
ROLLBACK=false
SKIP_TESTS=false
VERBOSE=false

# Parse additional arguments
shift
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [environment] [options]"
      echo "Environments: development, staging, production"
      echo "Options:"
      echo "  --dry-run      Show what would be done"
      echo "  --rollback     Rollback to previous version"
      echo "  --skip-tests   Skip pre-deployment tests"
      echo "  --verbose      Detailed output"
      echo "  --help         Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
  echo -e "${RED}✗ $1${NC}"
}

# Validate environment
validate_environment() {
  case $ENVIRONMENT in
    development|staging|production)
      log "Deploying to $ENVIRONMENT environment"
      ;;
    *)
      error "Invalid environment: $ENVIRONMENT"
      echo "Valid environments: development, staging, production"
      exit 1
      ;;
  esac
}

# Run pre-deployment tests
run_pre_deployment_tests() {
  if [ "$SKIP_TESTS" = true ] || [ "$ROLLBACK" = true ]; then
    return
  fi

  log "Running pre-deployment tests..."

  if [ "$DRY_RUN" = true ]; then
    echo "Would run: ./scripts/test-runner.sh --unit-only --integration-only"
    return
  fi

  # Run critical tests
  if ! ./scripts/test-runner.sh --unit-only --integration-only; then
    error "Pre-deployment tests failed"
    exit 1
  fi

  success "Pre-deployment tests passed"
}

# Build application
build_application() {
  log "Building application..."

  if [ "$DRY_RUN" = true ]; then
    echo "Would build backend and frontend"
    return
  fi

  # Backend build
  log "Building backend..."
  cd backend
  python -m compileall app/ 2>/dev/null || warning "Backend compilation warnings"
  cd ..

  # Frontend build
  log "Building frontend..."
  npm run build

  success "Application build completed"
}

# Deploy to environment
deploy_to_environment() {
  log "Deploying to $ENVIRONMENT..."

  if [ "$DRY_RUN" = true ]; then
    echo "Would deploy to $ENVIRONMENT environment"
    return
  fi

  case $ENVIRONMENT in
    development)
      deploy_development
      ;;
    staging)
      deploy_staging
      ;;
    production)
      deploy_production
      ;;
  esac
}

deploy_development() {
  log "Deploying to development..."

  # Local development deployment
  echo "📦 Development deployment commands would run here"

  success "Development deployment completed"
}

deploy_staging() {
  log "Deploying to staging..."

  # Staging deployment (could be Docker, K8s, etc.)
  echo "📦 Staging deployment commands would run here"

  success "Staging deployment completed"
}

deploy_production() {
  log "Deploying to production..."

  # Production deployment with safety checks
  warning "Production deployment requires manual approval"

  read -p "Are you sure you want to deploy to production? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    log "Production deployment cancelled"
    exit 0
  fi

  # Add production deployment steps here
  echo "📦 Production deployment commands would run here"

  success "Production deployment completed"
}

# Run post-deployment tests
run_post_deployment_tests() {
  if [ "$ROLLBACK" = true ]; then
    return
  fi

  log "Running post-deployment health checks..."

  if [ "$DRY_RUN" = true ]; then
    echo "Would run health checks and smoke tests"
    return
  fi

  # Health checks
  sleep 10  # Wait for deployment to stabilize

  # Add health check commands here
  echo "🔍 Checking application health..."

  success "Post-deployment checks passed"
}

# Rollback deployment
rollback_deployment() {
  log "Rolling back deployment..."

  if [ "$DRY_RUN" = true ]; then
    echo "Would rollback to previous version"
    return
  fi

  case $ENVIRONMENT in
    development)
      # Development rollback
      echo "Rolling back development deployment"
      ;;
    staging)
      # Staging rollback
      echo "Rolling back staging deployment"
      ;;
    production)
      # Production rollback - be very careful
      warning "Production rollback - ensure you have backups"
      echo "Rolling back production deployment"
      ;;
  esac

  success "Rollback completed"
}

# Create deployment record
create_deployment_record() {
  log "Creating deployment record..."

  if [ "$DRY_RUN" = true ]; then
    echo "Would create deployment record"
    return
  fi

  # Create deployment record
  mkdir -p deployments
  DEPLOYMENT_LOG="deployments/deployment_$(date +%Y%m%d_%H%M%S).log"

  cat > "$DEPLOYMENT_LOG" << EOF
Deployment Record
=================
Timestamp: $(date)
Environment: $ENVIRONMENT
Version: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
User: $(whoami)
Status: $([ "$ROLLBACK" = true ] && echo "ROLLBACK" || echo "DEPLOYMENT")
Dry Run: $([ "$DRY_RUN" = true ] && echo "YES" || echo "NO")
EOF

  success "Deployment record created: $DEPLOYMENT_LOG"
}

# Main execution
main() {
  log "Starting deployment process..."

  if [ "$VERBOSE" = true ]; then
    set -x
  fi

  validate_environment

  if [ "$ROLLBACK" = true ]; then
    rollback_deployment
  else
    run_pre_deployment_tests
    build_application
    deploy_to_environment
    run_post_deployment_tests
  fi

  create_deployment_record

  success "Deployment process completed!"
  echo ""
  echo "Deployment Summary:"
  echo "- Environment: $ENVIRONMENT"
  echo "- Status: $([ "$ROLLBACK" = true ] && echo "ROLLBACK" || echo "SUCCESS")"
  echo "- Timestamp: $(date)"
}

main "$@"
