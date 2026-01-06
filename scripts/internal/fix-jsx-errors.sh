#!/bin/bash
# Automated JSX Error Fix Scripts
# Generated: 2025-12-23
# Purpose: Bulk fix common JSX patterns across frontend

set -e

echo "🔧 Starting automated JSX error fixes..."

cd "$(dirname "$0")/frontend/src"

# Backup files before modifications
echo "📦 Creating backup..."
tar -czf ../../frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz . 2>/dev/null || echo "⚠️  Backup skipped"

# Fix 1: Self-closing components with closing tags
echo "🔄 Fix 1: Removing unnecessary closing tags from self-closing components..."
find . \( -name "*.tsx" -o -name "*.ts" \) -type f -exec sed -i '' \
  -e 's/<\(CheckCircle\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  -e 's/<\(XCircle\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  -e 's/<\(Clock\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  -e 's/<\(AlertTriangle\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  -e 's/<\(Home\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  -e 's/<\(RefreshCw\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  -e 's/<\(Sparkles\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  -e 's/<\(Trophy\) \([^>]*\)\/><\/\1>/<\1 \2\/>/g' \
  {} \;

# Fix 2: Malformed generic type closing tags
echo "🔄 Fix 2: Fixing malformed generic type annotations..."
find . \( -name "*.tsx" -o -name "*.ts" \) -type f -exec sed -i '' \
  -e 's/React\.FC<\([^>]*\)><\/\1>/React.FC<\1>/g' \
  -e 's/useState<\([^>]*\)><\/\1>/useState<\1>/g' \
  -e 's/Component<><\([^,]*\), \([^>]*\)><\/\1>/Component<\1, \2>/g' \
  {} \;

# Fix 3: Interface property spacing issues
echo "🔄 Fix 3: Normalizing interface property spacing..."
find . \( -name "*.tsx" -o -name "*.ts" \) -type f -exec sed -i '' \
  's/\?  :  /?:/g' \
  {} \;

# Fix 4: Mixed opening/closing tags in fragments
echo "🔄 Fix 4: Cleaning up JSX fragment issues..."
find . \( -name "*.tsx" -o -name "*.ts" \) -type f -exec sed -i '' \
  -e 's/<><\/\([A-Za-z][A-Za-z0-9]*\)>/<\/\1>/g' \
  -e 's/<\([A-Za-z][A-Za-z0-9]*\)><\/<>//g' \
  {} \;

# Fix 5: Duplicate React imports (already mostly done, but ensure clean)
echo "🔄 Fix 5: Removing any remaining duplicate imports..."
# This is complex and better done with AST tools, skipping for safety

# Fix 6: Orphaned closing Card/div/etc tags
echo "🔄 Fix 6: Fixing common orphaned closing tags..."
find . \( -name "*.tsx" -o -name "*.ts" \) -type f -exec sed -i '' \
  -e 's/<Card className=\([^>]*\)><\/Card>/<Card className=\1>/g' \
  -e 's/<div \([^>]*\)><\/div>/<div \1>/g' \
  {} \;

echo "✅ Automated fixes completed!"
echo ""
echo "📊 Verification recommended:"
echo "  cd ../../frontend && npm run type-check 2>&1 | grep 'error TS' | wc -l"
echo ""
echo "⚠️  Note: Some errors require manual intervention."
echo "   Refer to JSX_ERROR_ANALYSIS_REPORT.md for detailed guidance."
