#!/bin/bash

# Zenith Production Deployment Script
# This script handles the complete production deployment process

set -e

echo "🚀 Starting Zenith Production Deployment"

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_ID=${RAILWAY_PROJECT_ID}
VERCEL_TOKEN=${VERCEL_TOKEN}
RAILWAY_TOKEN=${RAILWAY_TOKEN}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if required environment variables are set
    if [ -z "$PROJECT_ID" ]; then
        log_error "RAILWAY_PROJECT_ID not set"
        exit 1
    fi

    if [ -z "$VERCEL_TOKEN" ]; then
        log_error "VERCEL_TOKEN not set"
        exit 1
    fi

    if [ -z "$RAILWAY_TOKEN" ]; then
        log_error "RAILWAY_TOKEN not set"
        exit 1
    fi

    # Check if required tools are installed
    command -v railway >/dev/null 2>&1 || { log_error "Railway CLI not installed"; exit 1; }
    command -v vercel >/dev/null 2>&1 || { log_error "Vercel CLI not installed"; exit 1; }

    log_info "Pre-deployment checks passed"
}

# Deploy backend services
deploy_backend() {
    log_info "Deploying backend services to Railway..."

    # Authenticate with Railway
    railway login --token "$RAILWAY_TOKEN"

    # Link to project
    railway link "$PROJECT_ID"

    # Set environment
    railway environment --environment "$ENVIRONMENT"

    # Deploy each service
    for service_dir in services/*/; do
        if [ -f "$service_dir/railway.json" ]; then
            service_name=$(basename "$service_dir")
            log_info "Deploying $service_name..."

            cd "$service_dir"
            railway up --detach

            # Wait for deployment and health check
            sleep 30
            if curl -f "https://$service_name-$PROJECT_ID.railway.app/health" >/dev/null 2>&1; then
                log_info "$service_name deployed successfully"
            else
                log_warn "$service_name health check failed, but continuing deployment"
            fi

            cd ../..
        fi
    done
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend to Vercel..."

    cd frontend

    # Build and deploy
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --token "$VERCEL_TOKEN" --prod
    else
        vercel --token "$VERCEL_TOKEN" --prod=false
    fi

    cd ..
}

# Run post-deployment tests
post_deployment_tests() {
    log_info "Running post-deployment tests..."

    # Wait for all services to be ready
    sleep 60

    # Test API Gateway
    if curl -f "${PRODUCTION_URL}/api/health" >/dev/null 2>&1; then
        log_info "API Gateway health check passed"
    else
        log_error "API Gateway health check failed"
        exit 1
    fi

    # Test Frontend
    if curl -f "${PRODUCTION_URL}/health" >/dev/null 2>&1; then
        log_info "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi

    # Test service mesh
    # Add more comprehensive tests here

    log_info "Post-deployment tests completed successfully"
}

# Main deployment flow
main() {
    log_info "Starting deployment to $ENVIRONMENT environment"

    pre_deployment_checks
    deploy_backend
    deploy_frontend
    post_deployment_tests

    log_info "🎉 Deployment to $ENVIRONMENT completed successfully!"
    log_info "Application is available at: $PRODUCTION_URL"
}

# Rollback function (for future use)
rollback() {
    log_error "Deployment failed, initiating rollback..."
    # Implement rollback logic here
}

# Trap errors and call rollback
trap rollback ERR

# Run main deployment
main