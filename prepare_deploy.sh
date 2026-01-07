#!/bin/bash
set -e

echo "🚀 Starting Deployment Preparation..."

# 1. Generate Secrets
echo "🔑 Generating Production Secrets..."
python3 generate_secrets.py

# 2. Update gitignore to exclude .env and local databases
echo "📝 Updating .gitignore..."
if ! grep -q ".env" .gitignore; then
    echo ".env" >> .gitignore
fi
if ! grep -q "*.db" .gitignore; then
    echo "*.db" >> .gitignore
fi
if ! grep -q "generate_secrets.py" .gitignore; then
    echo "generate_secrets.py" >> .gitignore
fi

# 3. Clean up legacy config
if [ -f "backend/railway.toml" ]; then
    echo "🗑️  Removing legacy backend/railway.toml..."
    rm backend/railway.toml
fi

if [ -f "backend/requirements.txt" ]; then
    echo "🗑️  Removing legacy backend/requirements.txt..."
    rm backend/requirements.txt
fi

# 4. Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "👉 Install it with: npm i -g @railway/cli"
else
    echo "✅ Railway CLI found."
fi

echo "✅ Preparation Complete!"
echo "---------------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Run the 'railway variables set ...' commands shown above."
echo "2. Run: railway login"
echo "3. Run: railway link (if not linked)"
echo "4. Run: railway up"
echo "---------------------------------------------------------"
