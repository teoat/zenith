#!/bin/bash
# OpenAPI TypeScript Client Generator Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Generating TypeScript API client from OpenAPI spec..."

# Check if backend OpenAPI spec exists
if [ ! -f "../backend/openapi.json" ]; then
    echo "📝 OpenAPI spec not found, generating from backend..."
    cd ../backend
    python3 << 'EOF'
from main import app
import json

# Generate OpenAPI spec from FastAPI
spec = app.openapi()

# Add custom metadata
spec["info"]["description"] = """
Zenith Fraud Detection Platform API

A comprehensive API for fraud detection, investigation management, and regulatory compliance.

## Authentication
- Uses HttpOnly cookies for authentication
- Token refresh is automatic
- No manual token handling needed

## Error Handling
All errors follow a consistent format with request IDs for tracing.
"""

# Save spec
with open("openapi.json", "w") as f:
    json.dump(spec, f, indent=2)

print("✅ OpenAPI spec generated from backend")
EOF

    cd "$SCRIPT_DIR"
fi

# Generate TypeScript client
echo "📦 Generating TypeScript client..."
npx @openapitools/openapi-generator-cli generate \
    -g typescript-axios \
    -i ../backend/openapi.json \
    -o src/api/generated \
    -c openapi-config.json \
    --additional-properties=withInterfaces=true,withSeparateModelsAndApi=true,supportsES6=true

echo "✅ TypeScript API client generated successfully!"
echo "📁 Generated files: src/api/generated"
echo ""
echo "📚 Usage:"
echo "  import { CasesApi, AuthApi } from '@/api/generated'"
echo "  const casesApi = new CasesApi({ baseServerUrl: 'http://localhost:8000' })"
