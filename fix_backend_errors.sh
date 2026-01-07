#!/bin/bash
# fix_backend_errors.sh - Comprehensive Backend Error Fix Script
# Generated: January 7, 2026

set -e  # Exit on any error

echo "🔧 Starting Backend Error Fixes..."
echo "===================================="

# Phase 1: Auto-fixable issues
echo "📦 Phase 1: Auto-fixing safe issues..."
ruff check backend/ --select F401,F811,E402 --fix --quiet
echo "✅ Auto-fixes completed"

# Phase 2: Manual critical fixes
echo "🔧 Phase 2: Applying manual fixes..."

# Fix bare except clauses in core/cdn.py
echo "Fixing bare except clauses in core/cdn.py..."
if [ -f "backend/core/cdn.py" ]; then
    # Line 279: bare except
    sed -i '' 's/except:/except Exception as e:/g' backend/core/cdn.py
    # Add logging to the fixes
    sed -i '' 's/except Exception as e:/except Exception as e:\n            logger.warning(f"CDN operation failed: {e}")/g' backend/core/cdn.py
    echo "✅ Fixed bare except in core/cdn.py"
fi

# Fix critical missing imports
echo "Adding missing imports..."

# collaboration.py - asyncio
if [ -f "backend/app/routers/collaboration.py" ]; then
    if ! grep -q "import asyncio" backend/app/routers/collaboration.py; then
        sed -i '' '1a\
import asyncio
' backend/app/routers/collaboration.py
        echo "✅ Added asyncio import to collaboration.py"
    fi
fi

# evidence.py - Evidence model
if [ -f "backend/app/routers/evidence.py" ]; then
    if ! grep -q "from core.models import Evidence" backend/app/routers/evidence.py; then
        sed -i '' '/from core.database import/a\
from core.models import Evidence
' backend/app/routers/evidence.py
        echo "✅ Added Evidence import to evidence.py"
    fi
fi

# onboarding.py - json
if [ -f "backend/app/routers/onboarding.py" ]; then
    if ! grep -q "import json" backend/app/routers/onboarding.py; then
        sed -i '' '1a\
import json
' backend/app/routers/onboarding.py
        echo "✅ Added json import to onboarding.py"
    fi
fi

# proof.py - auth_service
if [ -f "backend/app/routers/proof.py" ]; then
    if ! grep -q "from app.services.infrastructure.auth_service import auth_service" backend/app/routers/proof.py; then
        sed -i '' '/import logging/a\
from app.services.infrastructure.auth_service import auth_service
' backend/app/routers/proof.py
        echo "✅ Added auth_service import to proof.py"
    fi
fi

# reporting.py - logger
if [ -f "backend/app/routers/reporting.py" ]; then
    if ! grep -q "logger = logging.getLogger(__name__)" backend/app/routers/reporting.py; then
        sed -i '' '/import logging/a\
logger = logging.getLogger(__name__)
' backend/app/routers/reporting.py
        echo "✅ Added logger to reporting.py"
    fi
fi

# stats.py - logger and CaseStatus
if [ -f "backend/app/routers/stats.py" ]; then
    if ! grep -q "logger = logging.getLogger(__name__)" backend/app/routers/stats.py; then
        sed -i '' '/import logging/a\
logger = logging.getLogger(__name__)
' backend/app/routers/stats.py
        echo "✅ Added logger to stats.py"
    fi
    if ! grep -q "from core.models import CaseStatus" backend/app/routers/stats.py; then
        sed -i '' '/from core.database import/a\
from core.models import CaseStatus
' backend/app/routers/stats.py
        echo "✅ Added CaseStatus import to stats.py"
    fi
fi

# websocket.py - datetime
if [ -f "backend/app/routers/websocket.py" ]; then
    if ! grep -q "from datetime import datetime" backend/app/routers/websocket.py; then
        sed -i '' '1a\
from datetime import datetime
' backend/app/routers/websocket.py
        echo "✅ Added datetime import to websocket.py"
    fi
fi

# Phase 3: Fix ambiguous variable names
echo "🔧 Phase 3: Fixing ambiguous variable names..."
# This would need manual review of the 3 instances

echo "📊 Phase 4: Checking results..."
ruff check backend/ --select E,F --statistics 2>&1 | tail -10

echo ""
echo "🎉 Backend fixes completed!"
echo "Next steps:"
echo "- Review ambiguous variable names (3 instances)"
echo "- Test all functionality"
echo "- Run full test suite"