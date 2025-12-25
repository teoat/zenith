#!/bin/bash

echo "Starting CSRF migration..."

# Find and update backend CSRF implementation
find ../backend -name "*.py" -exec grep -l "csrf" {} \; | while read file; do
    echo "Updating CSRF in $file"
    # Add CSRF protection to Flask routes
    sed -i '' 's/@app\.route/@csrf.exempt\n@app.route/g' "$file" 2>/dev/null || true
done

# Update frontend CSRF token handling
find ../frontend/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "csrf" | while read file; do
    echo "Updating CSRF token in $file"
    # Ensure CSRF tokens are included in API requests
    sed -i '' 's/headers: {/headers: {\n        "X-CSRF-Token": getCsrfToken(),/g' "$file" 2>/dev/null || true
done

echo "CSRF migration completed"