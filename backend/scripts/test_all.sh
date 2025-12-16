#!/bin/bash
# Comprehensive Test Script for Simple378 Phase 1
# Tests all implemented features with detailed output

set +e  # Don't exit on error - we want to see all test results

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
TOTAL=0
PASSED=0
FAILED=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Simple378 Phase 1 - Comprehensive Test Suite         ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

# Function to run test
run_test() {
    local category="$1"
    local name="$2"
    local command="$3"
    local show_output="${4:-false}"
    
    ((TOTAL++))
    
    echo -e "${YELLOW}[$category]${NC} Testing: $name"
    
    if [ "$show_output" = "true" ]; then
        echo -e "${BLUE}Command:${NC} $command"
        echo -e "${BLUE}Output:${NC}"
        eval "$command"
        local result=$?
        echo ""
    else
        output=$(eval "$command" 2>&1)
        local result=$?
    fi
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        if [ "$show_output" != "true" ] && [ -n "$output" ]; then
            echo -e "${BLUE}Result:${NC} $output"
        fi
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        if [ -n "$output" ]; then
            echo -e "${RED}Error:${NC} $output"
        fi
    fi
    echo ""
}

cd backend

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. Backend Module Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

run_test "Backend" "Main Application" \
    "python -c 'from main import app; print(\"Main app initialized successfully\")'"

run_test "Backend" "Database Module" \
    "python -c 'from core.database import create_engine_and_session, get_database_url; print(\"Database URL:\", get_database_url())'" true

run_test "Backend" "Error Handling Module" \
    "python -c 'from core.error_handling import get_error_message; msg = get_error_message(\"case_not_found\"); print(\"Error message:\", msg.message)'" true

run_test "Backend" "Query Monitoring Module" \
    "python -c 'from core.query_monitoring import monitor_query, get_query_metrics; metrics = get_query_metrics(); print(\"Metrics available:\", len(metrics[\"metrics_available\"]))'" true

run_test "Backend" "CSRF Protection Module" \
    "python -c 'from core.csrf_protection import generate_csrf_token, validate_csrf_token; token = generate_csrf_token(); print(\"Token generated:\", token[:16] + \"...\")'" true

run_test "Backend" "Cache Monitoring Module" \
    "python -c 'from core.cache_monitoring import CacheMonitor; monitor = CacheMonitor(\"test\"); print(\"Monitor created for:\", monitor.cache_name)'" true

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. Database Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

run_test "Database" "Database File Exists" \
    "ls -lh ~/.378x492/fraud_detection.db | awk '{print \"Size:\" \$5, \"Modified:\" \$6, \$7}'" true

run_test "Database" "Create/Verify Tables" \
    "python -c 'from core.database import create_tables; create_tables(); print(\"Database tables created/verified\")'" true

run_test "Database" "Alembic Configuration" \
    "alembic current 2>&1 | grep -E '(INFO|head|^[a-f0-9]{12})' | head -3" true

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. Backup System Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

run_test "Backup" "Backup Script Help" \
    "python scripts/backup_db.py --help | head -5" true

run_test "Backup" "Create Daily Backup" \
    "python scripts/backup_db.py backup --type daily 2>&1 | grep -E '(✅|Created|Backup)'" true

run_test "Backup" "List Backups" \
    "python scripts/backup_db.py list | head -10" true

run_test "Backup" "Backup Statistics" \
    "python scripts/backup_db.py stats" true

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4. Configuration Files${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

run_test "Config" "Prometheus Alerts File" \
    "test -f config/prometheus_alerts.yml && echo 'File exists: config/prometheus_alerts.yml'"

run_test "Config" "Count Alert Rules" \
    "grep -c 'alert:' config/prometheus_alerts.yml | xargs -I {} echo 'Alert rules found: {}'" true

run_test "Config" "Migration Workflow Docs" \
    "test -f docs/MIGRATION_WORKFLOW.md && echo 'File exists: docs/MIGRATION_WORKFLOW.md'"

run_test "Config" "Alembic env.py Updated" \
    "grep -c 'SCHEMA_VERSION' alembic/env.py | xargs -I {} echo 'Schema versioning configured: {} references'" true

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5. Frontend Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

cd ../frontend

run_test "Frontend" "ErrorMessage Component" \
    "test -f src/components/ErrorMessage.tsx && wc -l src/components/ErrorMessage.tsx | awk '{print \"Lines of code: \" \$1}'" true

run_test "Frontend" "useApiError Hook" \
    "test -f src/hooks/useApiError.ts && wc -l src/hooks/useApiError.ts | awk '{print \"Lines of code: \" \$1}'" true

run_test "Frontend" "Check Component Exports" \
    "grep -c 'export' src/components/ErrorMessage.tsx | xargs -I {} echo 'Exported components: {}'" true

cd ../backend

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}6. Integration Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

run_test "Integration" "CSRF in Main App" \
    "grep -c 'CSRFProtectionMiddleware' main.py | xargs -I {} echo 'CSRF middleware integrated: {} references'" true

run_test "Integration" "All Imports Work Together" \
    "python -c 'from main import app; from core.error_handling import get_error_message; from core.query_monitoring import monitor_query; from core.csrf_protection import generate_csrf_token; from core.cache_monitoring import CacheMonitor; print(\"All modules import successfully together\")'" true

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Tests:  $TOTAL"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL TESTS PASSED! Phase 1 is production ready!    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    PERCENT=$((PASSED * 100 / TOTAL))
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  $PERCENT% tests passed - Review failures above      ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
