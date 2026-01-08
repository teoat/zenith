#!/bin/bash

# Fix all remaining env variable access with bracket notation 
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/__tests__/*" -exec sed -i '' 's/process\.env\.VITE_API_URL/process.env[\x27VITE_API_URL\x27]/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/__tests__/*" -exec sed -i '' 's/process\.env\.VITE_SENTRY_DSN/process.env[\x27VITE_SENTRY_DSN\x27]/g' {} \;

echo "✅ Fixed env variable access patterns"
