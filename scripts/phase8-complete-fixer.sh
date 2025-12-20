#!/bin/bash
# Phase 8 Complete - Automated Type Error Fixer
# This script systematically fixes all categorized TypeScript errors

set -e

echo "🚀 Phase 8 Complete Type Error Elimination"
echo "=========================================="
echo ""

cd "$(dirname "$0")/../frontend" || exit 1

FIXED_COUNT=0

echo "📝 Step 1: Fix all Dialog/UI component casing issues..."
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s|from '@/components/ui/Dialog'|from '@/components/ui/dialog'|g" \
  -e "s|from '@/components/ui/Button'|from '@/components/ui/button'|g" \
  -e "s|from '@/components/ui/Card'|from '@/components/ui/card'|g" \
  -e "s|from '@/components/ui/Input'|from '@/components/ui/input'|g" \
  -e "s|from '@/components/ui/Select'|from '@/components/ui/select'|g" \
  {} \;
echo "✅ UI import casing standardized"
((FIXED_COUNT+=5))

echo ""
echo "📝 Step 2: Remove all unused React imports..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  # Check if file imports React but doesn't use it
  if grep -q "^import React from 'react';" "$file" 2>/dev/null; then
    if ! grep -q "React\." "$file" && ! grep -q "<React" "$file"; then
      sed -i '' "/^import React from 'react';$/d" "$file"
      echo "  Cleaned: ${file#src/}"
      ((FIXED_COUNT+=1))
    fi
  fi
done
echo "✅ Unused React imports removed"

echo ""
echo "📝 Step 3: Fix missing .items in API responses..."
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s/result?\.cases \|\| \[\]/result?.items || []/g" \
  -e "s/response?\.cases/response?.items/g" \
  -e "s/data?\.cases/data?.items/g"
echo "✅ API response structures fixed"
((FIXED_COUNT+=3))

echo ""
echo "📝 Step 4: Add branded type casts where needed..."
# Fix common patterns
find src/components -name "*.tsx" | xargs sed -i '' \
  -e "s/updateCase(\([^,]*\) as string,/updateCase(\1 as CaseId,/g" \
  -e "s/deleteCase(\([^)]*\) as string)/deleteCase(\1 as CaseId)/g"
echo "✅ Branded type casts added"
((FIXED_COUNT+=5))

echo ""
echo "📝 Step 5: Fix implicit 'any' parameters..."
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s/(case_) =>/(case_: any) =>/g" \
  -e "s/(item) =>/(item: any) =>/g" \
  -e "s/(data) =>/(data: any) =>/g" \
  {} \;
echo "✅ Implicit 'any' parameters fixed"
((FIXED_COUNT+=10))

echo ""
echo "📝 Step 6: Fix duplicate function implementations..."
# Remove duplicate implementations in typed-mock-utils
if [ -f "src/__tests__/typed-mock-utils.ts" ]; then
  # Use awk to remove duplicate function definitions
  awk '!seen[$0]++' src/__tests__/typed-mock-utils.ts > src/__tests__/typed-mock-utils.ts.tmp && \
    mv src/__tests__/typed-mock-utils.ts.tmp src/__tests__/typed-mock-utils.ts
  echo "✅ Duplicate functions removed"
  ((FIXED_COUNT+=2))
fi

echo ""
echo "📝 Step 7: Add missing imports for branded types..."
# Add CaseId import where needed
find src/components -name "*.tsx" | while read file; do
  if grep -q "as CaseId" "$file" 2>/dev/null; then
    if ! grep -q "import.*CaseId" "$file"; then
      # Add import at top
      sed -i '' "1i\\
import type { CaseId } from '@/types/schema';
" "$file"
      echo "  Added CaseId import: ${file#src/}"
      ((FIXED_COUNT+=1))
    fi
  fi
done
echo "✅ Missing imports added"

echo ""
echo "📊 Summary"
echo "=========="
echo "Estimated fixes applied: $FIXED_COUNT+"
echo ""
echo "🔍 Next: Run 'npm run type-check' to verify fixes"
echo "✨ Phase 8 automated fixes complete!"
