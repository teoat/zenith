#!/bin/bash

# Test Runner with Environment Setup
# Sets up required environment variables and runs tests

set -e

# Generate encryption key if needed
if [ -z "$FIELD_ENCRYPTION_KEY" ]; then
    echo "🔐 Generating encryption key..."
    FIELD_ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
    export FIELD_ENCRYPTION_KEY
fi

# Set other required environment variables
export ENCRYPTION_KEY="${FIELD_ENCRYPTION_KEY}"
export SECRET_KEY="${FIELD_ENCRYPTION_KEY}"
export DATABASE_URL="sqlite:///test_zenith.db"
export ENVIRONMENT="test"
export REDIS_URL="redis://localhost:6379/0"

echo "✅ Environment configured"
echo "Running tests: $@"

# Run the tests
cd backend
python -m pytest "$@"
