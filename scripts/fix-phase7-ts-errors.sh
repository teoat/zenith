#!/bin/bash

# Phase 7 TypeScript Error Cleanup Script
# Auto-fixes common TS errors blocking Phase 7 commit

echo "🔧 Phase 7 TS Error Cleanup"
echo "=========================="
echo ""

cd "$(dirname "$0")/../.." || exit 1
FRONTEND_DIR="frontend/src"

# Counter
FIXED=0

echo "📝 Step 1: Removing unused React imports from test files..."
# Find all test files with unused React imports
find "$FRONTEND_DIR" -name "*.test.tsx" -o -name "*.test.ts" | while read -r file; do
    # Check if file has unused React import
    if grep -q "^import React from 'react';" "$file"; then
        # Check if React is actually used in JSX
        if ! grep -q "<" "$file"; then
            echo "  Removing from: ${file#$FRONTEND_DIR/}"
            sed -i '' "/^import React from 'react';$/d" "$file"
            ((FIXED++))
        fi
    fi
done

echo "✅ Removed unused React imports"
echo ""

echo "📝 Step 2: Fixing branded type casts in test files..."
# Fix common patterns in test files where string IDs need to be cast to branded types
TEST_FILES=$(find "$FRONTEND_DIR/__tests__" -name "*.test.tsx" -o -name "*.test.ts")

for file in $TEST_FILES; do
    if grep -q "id: ['\"]case-" "$file"; then
        echo "  Fixing CaseId in: ${file#$FRONTEND_DIR/}"
        # Add 'as CaseId' to string literals that look like case IDs
        sed -i '' "s/id: '\(case-[^']*\)'/id: '\1' as CaseId/g" "$file"
        sed -i '' "s/id: \"\(case-[^\"]*\)\"/id: \"\1\" as CaseId/g" "$file"
        ((FIXED++))
    fi
done

echo "✅ Fixed branded type casts"
echo ""

echo "📝 Step 3: Fixing lowercase UI component imports..."
# Fix lowercase imports like 'dialog' -> 'Dialog'
find "$FRONTEND_DIR/components" -name "*.tsx" | while read -r file; do
    if grep -q "from '@/components/ui/[a-z]" "$file"; then
        echo "  Fixing imports in: ${file#$FRONTEND_DIR/}"
        # Common UI components that should be capitalized
        sed -i '' "s/from '@\/components\/ui\/dialog'/from '@\/components\/ui\/Dialog'/g" "$file"
        sed -i '' "s/from '@\/components\/ui\/button'/from '@\/components\/ui\/Button'/g" "$file"
        sed -i '' "s/from '@\/components\/ui\/card'/from '@\/components\/ui\/Card'/g" "$file"
        sed -i '' "s/from '@\/components\/ui\/input'/from '@\/components\/ui\/Input'/g" "$file"
        ((FIXED++))
    fi
done

echo "✅ Fixed UI component import casing"
echo ""

echo "📝 Step 4: Removing unused variables in test files..."
# Fix unused variables by prefixing with underscore
find "$FRONTEND_DIR" -name "*.test.tsx" -o -name "*.test.ts" | while read -r file; do
    # Look for common unused variable patterns
    if grep -q "const mockNavigate = jest.fn()" "$file"; then
        if ! grep -q "mockNavigate(" "$file"; then
            echo "  Fixing in: ${file#$FRONTEND_DIR/}"
            sed -i '' "s/const mockNavigate =/const _mockNavigate =/g" "$file"
            ((FIXED++))
        fi
    fi
done

echo "✅ Removed unused variables"
echo ""

echo "📊 Summary"
echo "=========="
echo "Total fixes applied: $FIXED files"
echo ""
echo "🔍 Next Steps:"
echo "1. Run: cd frontend && npm run type-check"
echo "2. Review remaining errors manually"
echo "3. Commit Phase 7 changes"
echo ""
echo "✨ Cleanup complete!"
