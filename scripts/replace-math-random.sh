#!/bin/bash
# replace-math-random.sh - Replace Math.random() with secureRandom

echo "🔄 Replacing Math.random() with secureRandom..."

# Find all TypeScript files with Math.random()
find frontend/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "Math\.random" | while read file; do
  echo "Processing: $file"

  # Add secureRandom import if not present
  if ! grep -q "secureRandom" "$file"; then
    # Find a good place to add the import (after other imports)
    sed -i '/^import.*from.*;$/a import { secureRandom } from '\''../utils/secureRandom'\'';' "$file"
  fi

  # Replace Math.random() calls with appropriate secureRandom methods
  # Replace Math.random() with secureRandom.random()
  sed -i 's/Math\.random()/secureRandom.random()/g' "$file"

  # Replace Math.random() * number with secureRandom.id(number)
  sed -i 's/Math\.random() \* \([0-9]*\)/secureRandom.id(\1)/g' "$file"

  # Replace Math.floor(Math.random() * number) with secureRandom.id(number)
  sed -i 's/Math\.floor(Math\.random() \* \([0-9]*\))/secureRandom.id(\1)/g' "$file"

done

echo "✅ Math.random() replacement completed"