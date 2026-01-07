#!/bin/bash
"""
Frontend Fix Script - Fixes all TypeScript and import issues
"""

echo "==================================================="
echo "🔧 Frontend Fixes Phase 1 - Diagnose & Fix Issues"
echo "==================================================="
echo ""

# 1. Check for missing UI components
echo "1. Checking for missing UI components..."
echo ""

missing_components=(
    "Switch"
    "Textarea"
    "Dialog"
    "Modal"
    "Toast"
    "Avatar"
    "Badge"
    "Input"
    "Select"
    "Table"
    "Progress"
    "Slider"
    "Label"
    "Alert"
)

for comp in "${missing_components[@]}"; do
    file="frontend/src/components/ui/$comp.tsx"
    if [ ! -f "$file" ]; then
        echo "  ⚠️  Missing: $comp"
    else
        echo "  ✅ Found: $comp"
    fi
done

echo ""
echo "2. Checking file casing consistency..."
echo ""

# Check for duplicate files
duplicates=$(find frontend/src/components -name "*.tsx" -o -name "*.ts" | while read f; do basename "$f"; done | sort | uniq -d)

if [ -n "$duplicates" ]; then
    echo "  ⚠️ Duplicate files found:"
    echo "$duplicates"
else
    echo "  ✅ No duplicate files"
fi

echo ""
echo "3. Checking import issues..."
echo ""

# Check for lowercase component imports
lowercase_files=("slider" "progress" "label" "avatar" "table" "alert" "dialog" "select")
for comp in "${lowercase_files[@]}"; do
    if [ -f "frontend/src/components/ui/$comp.tsx" ]; then
        echo "  ⚠️ Lowercase file exists: $comp.tsx (should be $comp with uppercase first letter)"
    fi
done

echo ""
echo "4. Checking for dialog.tsx import..."
echo ""

dialog_imports=$(grep -r "from.*@/components/ui/dialog\.tsx" frontend/src --include="*.tsx" --include="*.ts" | wc -l)
if [ "$dialog_imports" -gt 0 ]; then
    echo "  ℹ️ $dialog_imports files import dialog.tsx (lowercase)"
else
    echo "  ✅ No lowercase dialog imports"
fi

echo ""
echo "5. Checking TypeScript errors..."
echo ""

echo "Checking key files for TypeScript errors..."
echo ""

# Check RelationshipGraph.tsx
if [ -f "frontend/src/components/RelationshipGraph.tsx" ]; then
    echo "RelationshipGraph.tsx errors:"
    npx tsc --noEmit 2>&1 | grep "RelationshipGraph.tsx" | head -10 || echo "  No errors found"
fi

# Check api-generated.tsx
if [ -f "frontend/src/services/api-generated.tsx" ]; then
    echo "api-generated.tsx errors:"
    npx tsc --noEmit 2>&1 | grep "api-generated.tsx" | head -10 || echo "  No errors found"
fi

# Check api-client.tsx
if [ -f "frontend/src/services/api-client.tsx" ]; then
    echo "api-client.tsx errors:"
    npx tsc --noEmit 2>&1 | grep "api-client.tsx" | head -10 || echo "  No errors found"
fi

echo ""
echo "==================================================="
echo "✅ Frontend Diagnostics Complete"
echo "==================================================="
