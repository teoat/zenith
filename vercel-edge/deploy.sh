#!/bin/bash

# Zenith Vercel Edge Gateway Deployment Script

echo "🚀 Deploying Zenith Edge Gateway to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Link to Vercel project (creates .vercel directory)
echo "🔗 Linking to Vercel project..."
vercel link --yes 2>/dev/null || echo "Project already linked or using existing settings"

# Deploy to production
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Set environment variables in Vercel dashboard:"
echo "      - RAILWAY_API_GATEWAY_URL"
echo "      - KV_REST_API_URL (optional)"
echo "      - KV_REST_API_TOKEN (optional)"
echo ""
echo "   2. Test health endpoint:"
echo "      curl https://your-project.vercel.app/api/health"
echo ""
echo "   3. Test API proxy:"
echo "      curl https://your-project.vercel.app/api/auth?subpath=me"
