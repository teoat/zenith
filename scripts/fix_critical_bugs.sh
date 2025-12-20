#!/bin/bash

# Critical Bug Fix Script
# Addresses the top priority issues identified in the diagnostic report
# Run from project root: ./scripts/fix_critical_bugs.sh

set -e

echo "🔧 Starting Critical Bug Fixes..."
echo "========================================"
echo ""

# Phase 1: Fix File Casing Issues (Critical Blocker)
echo "📁 Phase 1: Fixing UI component file casing..."
echo "--------------------------------------"

cd frontend/src/components/ui

# Check if files exist before renaming
if [ -f "Dialog.tsx" ] && [ -f "dialog.tsx" ]; then
    echo "⚠️  Both Dialog.tsx and dialog.tsx exist - manual intervention required"
elif [ -f "Dialog.tsx" ]; then
    echo "Renaming Dialog.tsx to dialog.tsx..."
    mv Dialog.tsx dialog.tsx.tmp
    mv dialog.tsx.tmp dialog.tsx
    echo "✅ Dialog.tsx renamed"
fi

if [ -f "Select.tsx" ] && [ -f "select.tsx" ]; then
    echo "⚠️  Both Select.tsx and select.tsx exist - manual intervention required"
elif [ -f "Select.tsx" ]; then
    echo "Renaming Select.tsx to select.tsx..."
    mv Select.tsx select.tsx.tmp
    mv select.tsx.tmp select.tsx
    echo "✅ Select.tsx renamed"
fi

cd ../../../../

echo ""
echo "📝 Phase 2: Updating imports to lowercase..."
echo "--------------------------------------"

# Update Dialog imports
echo "Updating Dialog imports..."
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
    -e 's/@\/components\/ui\/Dialog/@\/components\/ui\/dialog/g' \
    -e 's/"..\/components\/ui\/Dialog"/"..\/components\/ui\/dialog"/g' \
    -e "s/'..\/components\/ui\/Dialog'/'..\/components\/ui\/dialog'/g" \
    {} +

# Update Select imports
echo "Updating Select imports..."
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
    -e 's/@\/components\/ui\/Select/@\/components\/ui\/select/g' \
    -e 's/"..\/components\/ui\/Select"/"..\/components\/ui\/select"/g' \
    -e "s/'..\/components\/ui\/Select'/'..\/components\/ui\/select'/g" \
    {} +

echo "✅ Import updates complete"

echo ""
echo "🧪 Phase 3: Fixing test setup..."
echo "--------------------------------------"

# Update jest.setup.ts to include testing-library extensions
if ! grep -q "@testing-library/jest-dom" frontend/jest.setup.ts 2>/dev/null; then
    echo "Adding @testing-library/jest-dom to jest.setup.ts..."
    echo "import '@testing-library/jest-dom';" >> frontend/jest.setup.ts
    echo "✅ Test setup updated"
else
    echo "✅ Test setup already includes @testing-library/jest-dom"
fi

# Update jest.config.js to include .d.ts files
echo "Checking jest.config.js for .d.ts support..."
if ! grep -q "'d.ts'" frontend/jest.config.ts 2>/dev/null && ! grep -q "'d.ts'" frontend/jest.config.js 2>/dev/null; then
    echo "⚠️  Manual update required: Add 'd.ts' to moduleFileExtensions in jest.config"
else
    echo "✅ jest.config already includes d.ts support"
fi

echo ""
echo "🔍 Phase 4: Fixing electron type imports..."
echo "--------------------------------------"

# Update electron type imports to include .d.ts extension
echo "Updating electron type imports..."
find frontend/src/services -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
    -e "s/import '..\/types\/electron';/import '..\/types\/electron.d.ts';/g" \
    -e 's/import "..\/types\/electron";/import "..\/types\/electron.d.ts";/g' \
    {} +

echo "✅ Electron imports updated"

echo ""
echo "🧹 Phase 5: Auto-fixing linter errors..."
echo "--------------------------------------"

cd frontend
echo "Running ESLint auto-fix..."
npm run lint -- --fix --max-warnings=999 || echo "⚠️  Some lint errors require manual fixes"
cd ..

echo ""
echo "🧪 Phase 6: Verifying fixes..."
echo "--------------------------------------"

echo "Running TypeScript type check..."
cd frontend
if npm run type-check; then
    echo "✅ TypeScript compilation successful!"
else
    echo "⚠️  TypeScript errors remain - check output above"
fi

echo ""
echo "Running tests..."
if npm test -- --no-watch --passWithNoTests; then
    echo "✅ Tests passing!"
else
    echo "⚠️  Test failures remain - check output above"
fi

cd ..

echo ""
echo "========================================"
echo "✨ Critical Bug Fix Process Complete!"
echo "========================================"
echo ""
echo "📊 Next Steps:"
echo "1. Review any remaining TypeScript errors"
echo "2. Fix manual lint issues (explicit any types)"
echo "3. Update test mocks for type safety"
echo "4. Run full test suite: cd frontend && npm test"
echo ""
echo "📄 See COMPREHENSIVE_BUG_DIAGNOSTIC_REPORT.md for details"
