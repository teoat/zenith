#!/bin/bash

echo "Adding intelligence service test files..."

files=(
    "backend/tests/unit/test_time_travel_service.py"
    "backend/tests/unit/test_temporal_burst_detector.py"
    "backend/tests/unit/test_zenith_horizon.py"
    "backend/tests/unit/test_zenith_scoring.py"
    "backend/tests/unit/test_intelligence_services_comprehensive.py"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  Adding: $file"
        git add "$file"
    echo "    ✅ Added $file"
    else
        echo "  ⚠️  Not found: $file"
    fi
done

echo ""
echo "Checking staged files..."
git status --short
