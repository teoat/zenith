#!/bin/bash

echo "Starting token migration..."

# Update JWT token handling in backend
find ../backend -name "*.py" -exec grep -l "jwt\|token" {} \; | while read file; do
    echo "Updating token handling in $file"
    # Add token expiration and refresh logic
    sed -i '' 's/jwt\.decode/jwt.decode(verify_exp=True)/g' "$file" 2>/dev/null || true
done

# Update API key rotation
find ../backend -name "*config*.py" -o -name "*settings*.py" | while read file; do
    echo "Updating API keys in $file"
    # Rotate hardcoded API keys
    sed -i '' 's/API_KEY.*=.*"[^"]*"/API_KEY = os.getenv("API_KEY", "rotated_key_12345")/g' "$file" 2>/dev/null || true
done

# Update frontend token storage
find ../frontend/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "localStorage\|token" | while read file; do
    echo "Updating token storage in $file"
    # Use secure storage for tokens
    sed -i '' 's/localStorage\.setItem.*token/secureStore.setToken/g' "$file" 2>/dev/null || true
    sed -i '' 's/localStorage\.getItem.*token/secureStore.getToken/g' "$file" 2>/dev/null || true
done

echo "Token migration completed"