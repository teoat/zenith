#!/bin/bash
# Generate TypeScript API client using @hey-api/openapi-ts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Generating TypeScript API client..."

# Create output directory
mkdir -p src/api/generated

# Generate types
npx @hey-api/openapi-ts \
  -i ../backend/openapi-complete.yaml \
  -o src/api/generated

echo "✅ TypeScript API client generated!"
echo "📁 Generated files: src/api/generated"
echo ""
echo "📚 Usage:"
echo "  import { CaseApi, AuthApi, Configuration } from '@/api/generated'"
echo ""
echo "  const config = new Configuration({"
echo "    basePath: 'http://localhost:8000/api/v1',"
echo "    withCredentials: true"
echo "  })"
echo ""
echo "  const casesApi = new CaseApi(config)"
echo "  const cases = await casesApi.listCases(0, 100)"
