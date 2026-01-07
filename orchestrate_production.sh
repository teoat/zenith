#!/bin/bash
set -e

echo "🚀 ZENITH PRODUCTION ORCHESTRATOR"
echo "================================="

# 1. Project Configuration
SERVICE_NAME="zenith-fraud-detection"
FRONTEND_URL="https://zenith-fraud-detection.vercel.app"  # Update this after Vercel deploy

echo "🔧 Configuring Backend Environment Variables..."

# Security Settings
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set RELOAD=false
railway variables set ALLOWED_HOSTS="api.zenith.com,zenith-fraud-detection-production.up.railway.app"

# CORS (Critical for Vercel communication)
echo "🌐 Setting CORS for Vercel..."
railway variables set CORS_ALLOWED_ORIGINS="$FRONTEND_URL,http://localhost:3000"

# Performance Tuning
railway variables set WEB_CONCURRENCY=2  # Gunicorn workers
railway variables set WORKERS_PER_CORE=1

# 2. Database & Cache Reminders
echo "🗄️  Checking Database Configuration..."
CURRENT_VARS=$(railway variables)

if [[ $CURRENT_VARS != *"DATABASE_URL"* ]]; then
    echo "⚠️  PostgreSQL missing! Please run: railway add postgresql"
fi

if [[ $CURRENT_VARS != *"REDIS_URL"* ]]; then
    echo "⚠️  Redis missing! Please run: railway add redis"
fi

echo "================================="
echo "✅ Configuration Applied."
echo "👉 Next Step: Deploy Frontend to Vercel and update CORS_ALLOWED_ORIGINS if URL changes."
