#!/bin/bash
# replace-console-logs.sh - Automated console statement replacement

echo "🔄 Replacing console statements with secure logging..."

# Find all TypeScript files with console statements
find frontend/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\." | while read file; do
  echo "Processing: $file"

  # Add secureLogger import if not present and file has console statements
  if ! grep -q "secureLogger" "$file"; then
    # Find the last import line and add secureLogger import after it
    sed -i '/^import.*from.*;$/a import { secureLogger } from '\''../utils/secureLogger'\'';' "$file"
  fi

  # Replace console statements with secure logger calls
  sed -i \
    -e 's/console\.log(/secureLogger.info(/g' \
    -e 's/console\.error(/secureLogger.error(/g' \
    -e 's/console\.warn(/secureLogger.warn(/g' \
    -e 's/console\.info(/secureLogger.info(/g' \
    -e 's/console\.debug(/secureLogger.debug(/g' "$file"

done

echo "✅ Console statement replacement completed"