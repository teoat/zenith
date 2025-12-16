#!/bin/bash

# Git Commit Helper for Production Deployment
# Helps commit and push all Week 1 changes

echo "📦 Git Commit Helper - Week 1 Production Infrastructure"
echo "========================================================"
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Run 'git init' first."
    exit 1
fi

echo "📋 Changes Summary:"
echo "  ✅ Health check endpoints (4 new)"
echo "  ✅ Environment configuration (.env.example)"
echo "  ✅ GitHub Actions CI/CD workflow"
echo "  ✅ Sentry error monitoring integration"
echo "  ✅ Production-ready monitoring"
echo ""

# Show git status
echo "📊 Current Git Status:"
git status --short
echo ""

# Ask for confirmation
read -p "📝 Commit message (press Enter for default): " custom_message
echo ""

if [ -z "$custom_message" ]; then
    MESSAGE="feat: Add production infrastructure (health checks, CI/CD, monitoring)

- Add health check endpoints (/health, /health/ready, /health/live, /health/startup)
- Create comprehensive .env.example with 60+ variables
- Implement GitHub Actions workflow for automated testing
- Integrate Sentry for error monitoring and performance tracking
- Add production-ready configuration management

Week 1 Complete:
- Health monitoring ready
- CI/CD pipeline ready
- Error tracking configured
- Security scanning automated"
else
    MESSAGE="$custom_message"
fi

echo "💾 Commit Message:"
echo "─────────────────"
echo "$MESSAGE"
echo "─────────────────"
echo ""

read -p "Proceed with commit? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Commit cancelled"
    exit 1
fi

# Add files
echo "📦 Adding files..."
git add backend/app/routers/health.py
git add backend/core/sentry_config.py
git add backend/.env.example
git add .github/workflows/backend-tests.yml
git add backend/main.py
git add docs/planning/*.md
git add scripts/setup-sentry.sh
git add scripts/git-commit-week1.sh

# Commit
echo "💾 Committing..."
git commit -m "$MESSAGE"

echo ""
echo "✅ Committed successfully!"
echo ""

# Ask about push
read -p "Push to remote? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Get current branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "🚀 Pushing to $BRANCH..."
    
    git push origin "$BRANCH"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Pushed to GitHub!"
        echo ""
        echo "📊 Next Steps:"
        echo "  1. Go to: https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
        echo "  2. Watch your CI/CD pipeline run!"
        echo "  3. See automated tests execute"
        echo "  4. Review security scan results"
        echo ""
    else
        echo "❌ Push failed. Check your git remote configuration."
        exit 1
    fi
else
    echo "⏸️  Changes committed but not pushed"
    echo "   Run 'git push' when ready"
fi

echo ""
echo "✅ Week 1 Implementation Complete!"
