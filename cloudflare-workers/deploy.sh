#!/bin/bash
# Zenith Platform - Cloudflare Workers Deployment Script

set -e

echo "🚀 Zenith Gateway Deployment"
echo "============================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing wrangler..."
    npm install -g wrangler
fi

# Check if logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Not logged in. Opening browser for authentication..."
    wrangler login
fi

# Get account info
echo "✅ Logged in as:"
wrangler whoami

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if KV namespaces exist
echo ""
echo "🗄️  Setting up KV namespaces..."

# Create CACHE namespace if not exists
if ! grep -q 'id = "[a-f0-9]' wrangler.toml 2>/dev/null; then
    echo "Creating CACHE namespace..."
    CACHE_ID=$(wrangler kv:namespace create "CACHE" 2>&1 | grep -oE '[a-f0-9]{32}' | head -1)
    echo "  CACHE ID: $CACHE_ID"
    
    echo "Creating RATE_LIMIT namespace..."
    RATE_LIMIT_ID=$(wrangler kv:namespace create "RATE_LIMIT" 2>&1 | grep -oE '[a-f0-9]{32}' | head -1)
    echo "  RATE_LIMIT ID: $RATE_LIMIT_ID"
    
    echo ""
    echo "⚠️  Please update wrangler.toml with these IDs:"
    echo ""
    echo 'kv_namespaces = ['
    echo "  { binding = \"CACHE\", id = \"$CACHE_ID\" },"
    echo "  { binding = \"RATE_LIMIT\", id = \"$RATE_LIMIT_ID\" }"
    echo ']'
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Deploy
echo ""
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your gateway is live at:"
echo "   https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev"
echo ""
echo "📊 View logs:"
echo "   wrangler tail"
echo ""
echo "🔧 Local development:"
echo "   npm run dev"
