#!/bin/bash
# backend-deploy-fix.sh
# Quick fix for backend deployment issues

set -e

echo "🔧 Backend Deployment Quick Fix"
echo "================================"
echo ""

# 1. Fix requirements.txt
echo "📦 Step 1: Fixing requirements.txt..."
cat > requirements.txt << 'EOF'
# Core Framework
fastapi==0.125.0
uvicorn==0.38.0
gunicorn==21.2.0
slowapi==0.1.9

# Database
alembic==1.17.2
sqlalchemy==2.0.45

# Security & Auth
bcrypt==5.0.0
passlib==1.7.4
python-jose==3.5.0
pyotp==2.9.0
rsa==4.9
cryptography==43.0.3

# Validation & Settings
pydantic==2.12.5
pydantic-settings==2.12.0
email-validator==2.3.0
python-dotenv==1.2.1
python-multipart==0.0.20

# HTTP & Requests
httpx==0.28.1
requests==2.32.5

# Data Processing
numpy==2.3.5
pandas==2.1.4
scipy==1.16.3
scikit-learn==1.3.2
xgboost==2.1.3
lightgbm==4.5.0
prophet==1.1.5
networkx==3.6.1
joblib==1.5.3

# ML & AI
tensorflow==2.18.0
sentence-transformers==2.5.1
faiss-cpu==1.9.0

# File Processing
pymupdf==1.25.1
pypdf==4.3.1
Pillow==10.4.0
python-docx==1.1.2
pytesseract==0.3.13
opencv-python==4.10.0.84
aiofiles==23.2.1
pydub==0.25.1
SpeechRecognition==3.10.1

# Utilities
python-dateutil==2.9.0.post0
babel==2.15.0

# Monitoring
prometheus_client==0.23.1
sentry-sdk==2.48.0

# Security
fastapi-csrf-protect==0.3.1
clamav==0.2.0

# Testing
pytest==9.0.2
pytest-asyncio==1.3.0
pytest-cov==7.0.0
EOF

echo "✅ requirements.txt updated with gunicorn"
echo ""

# 2. Fix Procfile for Railway
echo "🚂 Step 2: Fixing Procfile..."
cat > Procfile << 'EOF'
web: cd backend && gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120 --keep-alive 5 --log-level info
EOF

echo "✅ Procfile updated"
echo ""

# 3. Link Railway (interactive)
echo "🔗 Step 3: Linking Railway project..."
if command -v railway &> /dev/null; then
    echo "Railway CLI found. Linking project..."
    railway link || echo "⚠️  Railway link failed - you may need to run 'railway login' first"
else
    echo "⚠️  Railway CLI not found. Install: npm i -g @railway/cli"
fi
echo ""

# 4. Set environment variables
echo "🔐 Step 4: Setting environment variables..."
if command -v railway &> /dev/null; then
    railway variables set ENVIRONMENT=production
    railway variables set PYTHON_VERSION=3.12
    railway variables set PORT=8000
    echo "✅ Environment variables set"
else
    echo "⚠️  Skipping - Railway CLI not available"
fi
echo ""

# 5. Show deployment command
echo "🚀 Next Steps:"
echo "================================"
echo ""
echo "1. If Railway link failed, run:"
echo "   railway login"
echo "   railway link"
echo ""
echo "2. Deploy to Railway:"
echo "   railway up"
echo ""
echo "3. Monitor deployment:"
echo "   railway logs --tail 100"
echo ""
echo "4. Check health:"
echo "   curl https://your-app.railway.app/health"
echo ""
echo "5. Verify status:"
echo "   railway status"
echo ""

echo "✅ Quick fix complete!"
echo "📋 See BACKEND_DEPLOYMENT_DIAGNOSIS.md for details"
