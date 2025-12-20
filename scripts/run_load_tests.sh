#!/bin/bash
# Comprehensive Load Testing Runner
# Runs various load tests against the Fraud Detection API

set -e

echo "🚀 Fraud Detection API Load Testing Suite"
echo "=========================================="

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend server not running on http://localhost:8000"
    echo "Please start the backend server first:"
    echo "  cd backend && source venv/bin/activate && ENABLE_COLLABORATION_WS=true uvicorn main:app --port 8000"
    exit 1
fi

echo "✅ Backend server is running"

# Function to run a load test
run_load_test() {
    local name="$1"
    local users="$2"
    local duration="$3"
    local description="$4"

    echo ""
    echo "📊 Running: $name"
    echo "   $description"
    echo "   Users: $users, Duration: ${duration}s"

    python scripts/load_test.py --url http://localhost:8000 --users "$users" --duration "$duration" --output "load_test_${name,,}.json"
}

# Run different load test scenarios
run_load_test "Light_Load" 5 30 "Light concurrent load test"
run_load_test "Medium_Load" 10 60 "Medium concurrent load test"
run_load_test "Stress_Test" 20 120 "High concurrency stress test"

echo ""
echo "📈 Load testing complete!"
echo "Results saved to load_test_*.json files"
echo ""
echo "To analyze results, check the generated JSON files or run:"
echo "  python scripts/analyze_load_test.py load_test_*.json"