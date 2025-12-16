#!/bin/bash
# Load Testing Quick Start
# Runs initial performance baseline tests

set -e

echo "🚀 Starting Performance Load Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed"
    echo ""
    echo "Please install k6:"
    echo "  macOS:   brew install k6"
    echo "  Windows: choco install k6"
    echo "  Linux:   https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo "✅ k6 is installed ($(k6 version))"

# Check if backend is running
echo ""
echo "🔍 Checking backend status..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend is not running at http://localhost:8000"
    echo "   Please start the backend first:"
    echo "   cd backend && python main.py"
    exit 1
fi

# Navigate to test directory
cd "$(dirname "$0")/.."

# Create results directory
mkdir -p test-results

# Run load test
echo ""
echo "🧪 Running performance tests..."
echo "   This will simulate load from 100 → 1000 concurrent users"
echo "   Estimated time: ~20 minutes"
echo ""

# Set API URL
export API_URL=http://localhost:8000

# Run k6 with results output
k6 run tests/performance/load-test.js \
  --out json=test-results/load-test-$(date +%Y%m%d-%H%M%S).json \
  --summary-export=test-results/summary-$(date +%Y%m%d-%H%M%S).json

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Load Tests Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Results saved to: test-results/"
echo ""
echo "🔍 Quick Analysis:"
echo "   View detailed results: cat test-results/summary-*.json | jq ."
echo ""
echo "📈 Next Steps:"
echo "   1. Review test results"
echo "   2. Identify performance bottlenecks"
echo "   3. Set up performance regression testing in CI"
echo ""
