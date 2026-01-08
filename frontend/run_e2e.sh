#!/bin/bash
set -e

# Kill any existing server on 5178 to be safe
lsof -ti:5178 | xargs kill -9 2>/dev/null || true

echo "🚀 Starting Dev Server on port 5178..."
npm run dev -- --port 5178 > dev_server_fresh.log 2>&1 &
SERVER_PID=$!

# Wait for port 5178
echo "⏳ Waiting for port 5178..."
count=0
while ! lsof -i :5178 > /dev/null; do
    sleep 1
    count=$((count+1))
    if [ $count -ge 30 ]; then
        echo "❌ Server failed to start within 30 seconds."
        echo "📜 Logs:"
        cat dev_server_fresh.log
        exit 1
    fi
done

echo "✅ Server is listening on 5178."

echo "🧪 Running Playwright Tests..."
npx playwright test --reporter=line || {
    echo "❌ Tests failed."
    # Don't exit yet, we want to kill the server
    FAIL=1
}

echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true

if [ "$FAIL" = "1" ]; then
    exit 1
fi
echo "🎉 All done."
