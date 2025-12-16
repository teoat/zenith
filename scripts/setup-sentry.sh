#!/bin/bash

# Sentry Setup Guide
# Follow these steps to enable error monitoring

echo "🔧 Sentry Setup Guide"
echo "====================="
echo ""

echo "Step 1: Sign up for Sentry (Free Tier)"
echo "  1. Go to: https://sentry.io"
echo "  2. Create a free account"
echo "  3. Verify your email"
echo ""

echo "Step 2: Create a New Project"
echo "  1. Click 'Create Project'"
echo "  2. Select 'Python' as platform"
echo "  3. Select 'FastAPI' as framework"
echo "  4. Name it: simple378-fraud-detection"
echo "  5. Select your team"
echo "  6. Click 'Create Project'"
echo ""

echo "Step 3: Copy Your DSN"
echo "  1. You'll see a page with setup instructions"
echo "  2. Find your DSN - it looks like:"
echo "     https://abc123@o123456.ingest.sentry.io/7654321"
echo "  3. Copy this DSN"
echo ""

echo "Step 4: Add DSN to .env file"
echo "  1. Open backend/.env"
echo "  2. Find the line: SENTRY_DSN="
echo "  3. Paste your DSN after the ="
echo "  4. Example: SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7654321"
echo "  5. Save the file"
echo ""

echo "Step 5: Install Sentry SDK"
echo "  cd backend"
echo "  pip install 'sentry-sdk[fastapi]'"
echo ""

echo "Step 6: Verify Installation"
echo "  1. Start your backend:"
echo "     cd backend && uvicorn main:app --reload"
echo "  2. Check logs for:"
echo "     ✅ Sentry error monitoring enabled"
echo "  3. In Sentry dashboard, you should see your app connected"
echo ""

echo "Step 7: Test Error Capture"
echo "  1. In Sentry, trigger test event"
echo "  2. Or cause an error in your app"
echo "  3. Check Sentry dashboard - you should see the error!"
echo ""

echo "📊 Optional: Configure Alerts"
echo "  1. In Sentry, go to Alerts"
echo "  2. Create alert rules for:"
echo "     - Error rate spikes"
echo "     - New error types"
echo "     - Performance issues"
echo "  3. Set up email/Slack notifications"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "Need help? Visit: https://docs.sentry.io/platforms/python/guides/fastapi/"
echo ""

# Interactive mode (optional)
read -p "Do you want to open Sentry signup page? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    open "https://sentry.io/signup/"
fi
