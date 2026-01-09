#!/bin/bash

# Branch Cleanup Script
# Generated: 2026-01-09
# Purpose: Clean up stale and duplicate branches from GitHub

set -e

echo "🧹 Git Branch Cleanup Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: Must be on 'main' branch. Currently on: $CURRENT_BRANCH${NC}"
    exit 1
fi

# Ensure main is up to date
echo -e "${BLUE}📥 Fetching latest changes...${NC}"
git fetch --all --prune

# Ensure main is pushed
echo -e "${BLUE}📤 Ensuring main is pushed...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ Ready to clean up branches${NC}"
echo ""

# Function to delete remote branch safely
delete_remote_branch() {
    local branch=$1
    echo -e "${YELLOW}Deleting: $branch${NC}"
    if git push origin --delete "$branch" 2>/dev/null; then
        echo -e "${GREEN}  ✓ Deleted${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Failed or already deleted${NC}"
        return 1
    fi
}

# Phase 1: Delete UI/Palette duplicate branches
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 1: UI/Palette Duplicate Branches${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

UI_BRANCHES=(
    "palette-button-loading-state-18044717855848483269"
    "palette-button-loading-state-7401340122884976402"
    "palette-button-loading-ux-5791598483941414936"
    "palette-button-loading-ux-6280978094768122259"
)

for branch in "${UI_BRANCHES[@]}"; do
    delete_remote_branch "$branch"
done

echo ""

# Phase 2: Delete Bolt optimization duplicates
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 2: Bolt Performance Duplicates${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BOLT_BRANCHES=(
    "bolt-performance-case-stats-5536000967639330997"
    "bolt-optimize-temporal-detector-12205334801190713546"
    "bolt-fix-indexes-and-analytics-v2-3095930437151090765"
)

for branch in "${BOLT_BRANCHES[@]}"; do
    delete_remote_branch "$branch"
done

echo ""

# Phase 3: Delete Sentinel security fix duplicates
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 3: Sentinel Security Duplicates${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SENTINEL_BRANCHES=(
    "sentinel-auth-zombie-fix-9254559149433086030"
    "sentinel-auth-zombie-user-fix-6434102693445338801"
)

for branch in "${SENTINEL_BRANCHES[@]}"; do
    delete_remote_branch "$branch"
done

echo ""

# Phase 4: Delete old diagnostic and planning branches
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 4: Old Diagnostic Branches${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

DIAGNOSTIC_BRANCHES=(
    "copilot/configure-vite-frontend-deployment"
    "diagnosis-ai-system-8180319537093825793"
    "backend-diagnosis-cleanup-refactor-13726377198936295128"
    "diagnostic-report-frontend-15706334803128230596"
    "fix-frontend-diagnosis-lint-types-5444160744348700948"
    "fix-frontend-diagnostics-v2-3498179717030491757"
    "diagnostic-review-and-config-fix-7359778847944534388"
)

for branch in "${DIAGNOSTIC_BRANCHES[@]}"; do
    delete_remote_branch "$branch"
done

echo ""

# Phase 5: Delete miscellaneous old branches
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 5: Miscellaneous Old Branches${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MISC_BRANCHES=(
    "logging-pii-scrubber-optimization-12556612224882266742"
    "async-db-exec-fix-15484847360517825499"
    "jules-8599532460305825643-ea84c152"
    "cleanup/folder-structure-optimization"
)

for branch in "${MISC_BRANCHES[@]}"; do
    delete_remote_branch "$branch"
done

echo ""

# Phase 6: Review branches (for manual decision)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 6: Branches Requiring Review${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}The following branches may contain important work:${NC}"
echo ""
echo "  • palette-fix-input-aria-3265327616775991471"
echo "  • palette-breadcrumbs-a11y-3104453749996068362"
echo "  • palette-add-aria-label-chatbot-10190255164625352483"
echo "  • sentinel/fix-hardcoded-secrets-16198280358136880331"
echo "  • sentinel-auth-refresh-vuln-12566397776344278335"
echo "  • sentinel-fix-path-traversal-evidence-10077771600401819506"
echo "  • bolt-perf-case-stats-4119406659941234187"
echo "  • bolt-case-counts-optimization-1375122870273118849"
echo "  • bolt/optimize-analytics-queries-2803632039090178624"
echo "  • bolt-db-query-optimization-13036822775550593953"
echo "  • fix-backend-security-and-cleanup-11014462601590195127"
echo ""
echo -e "${YELLOW}Run the following commands to review each branch:${NC}"
echo "  git diff main...origin/BRANCH_NAME"
echo "  git log main..origin/BRANCH_NAME --oneline"
echo ""
echo -e "${YELLOW}To delete after review, uncomment the lines below:${NC}"
echo ""

# Uncomment to delete after review
# REVIEW_BRANCHES=(
#     "palette-fix-input-aria-3265327616775991471"
#     "palette-breadcrumbs-a11y-3104453749996068362"
#     "palette-add-aria-label-chatbot-10190255164625352483"
#     "sentinel/fix-hardcoded-secrets-16198280358136880331"
#     "sentinel-auth-refresh-vuln-12566397776344278335"
#     "sentinel-fix-path-traversal-evidence-10077771600401819506"
#     "bolt-perf-case-stats-4119406659941234187"
#     "bolt-case-counts-optimization-1375122870273118849"
#     "bolt/optimize-analytics-queries-2803632039090178624"
#     "bolt-db-query-optimization-13036822775550593953"
#     "fix-backend-security-and-cleanup-11014462601590195127"
# )

# for branch in "${REVIEW_BRANCHES[@]}"; do
#     delete_remote_branch "$branch"
# done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Branch Cleanup Complete${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  • Deleted duplicate UI/palette branches"
echo "  • Deleted duplicate performance optimization branches"
echo "  • Deleted duplicate security fix branches"
echo "  • Deleted old diagnostic branches"
echo "  • Deleted miscellaneous old branches"
echo ""
echo "Next steps:"
echo "  1. Review remaining branches listed above"
echo "  2. Delete 'master' branch if no longer needed: git push origin --delete master"
echo "  3. Set up branch protection rules on GitHub"
echo "  4. Configure automated cleanup in CI/CD"
echo ""
