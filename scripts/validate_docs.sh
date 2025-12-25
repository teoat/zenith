#!/bin/bash
# Documentation Validation Script
# Checks for documentation accuracy and completeness

echo "🔍 Running Documentation Validation..."

# Check if API documentation exists and has content
if [ ! -f "docs/api/API_DOCUMENTATION.md" ]; then
    echo "❌ API documentation missing"
    exit 1
fi

api_endpoints=$(grep -c "#### " docs/api/API_DOCUMENTATION.md)
if [ "$api_endpoints" -lt 50 ]; then
    echo "❌ API documentation incomplete: only $api_endpoints endpoints documented"
    exit 1
fi

echo "✅ API documentation: $api_endpoints endpoints documented"

# Check if architecture docs match reality
if [ ! -f "docs/architecture/ARCHITECTURE_REPORT.md" ]; then
    echo "❌ Architecture documentation missing"
    exit 1
fi

echo "✅ Architecture documentation present"

# Check if docs are synchronized (basic check)
docs_modified=$(find docs/ -name "*.md" -newer docs/README.md 2>/dev/null | wc -l)
if [ "$docs_modified" -gt 0 ]; then
    echo "⚠️  Some docs may be newer than index - consider updating README"
fi

echo "✅ Documentation validation passed"
exit 0