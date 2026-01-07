#!/bin/bash
set -e

# Confirmed Service Name from 'railway status'
SERVICE_NAME="zenith-fraud-detection"

echo "🚀 Deploying to Railway Service: $SERVICE_NAME"
echo "---------------------------------------------"

# Deploy using the explicit Service Name
railway up --service $SERVICE_NAME --detach

echo "---------------------------------------------"
echo "✅ Deployment Triggered!"
