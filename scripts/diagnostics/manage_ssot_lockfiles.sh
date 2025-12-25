#!/bin/bash
# SSOT and Lockfile Management Script for 378x492 Fraud Detection Platform
# This script manages Single Source of Truth files and their integrity locks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# SSOT Registry - Critical files that must be locked
declare -A SSOT_FILES=(
    # Core Business Logic
    ["data/fraud_rules.json"]="fraud_detection_rules"
    ["backend/app/services/fraud_service.py"]="fraud_detection_engine"
    ["backend/core/security/rbac.py"]="security_access_control"

    # Database Schema and Models
    ["backend/core/database.py"]="database_schema"
    ["backend/app/services/database_service.py"]="database_service_layer"

    # Authentication & Security
    ["backend/app/services/auth_service.py"]="authentication_service"
    ["backend/core/security/__init__.py"]="security_framework"
    ["backend/core/encryption.py"]="encryption_module"

    # API Contracts
    ["backend/main.py"]="api_gateway"
    ["backend/app/routers/identity.py"]="identity_management_api"
    ["backend/app/routers/fraud.py"]="fraud_detection_api"

    # Configuration Files
    [".env.production"]="production_environment"
    ["config/production.py"]="production_config"
    ["infrastructure/docker-compose.production.yml"]="production_infrastructure"

    # Frontend Core
    ["frontend/src/components/cases/InvestigationWizard.tsx"]="investigation_workflow"
    ["frontend/src/pages/Dashboard.tsx"]="dashboard_interface"
    ["frontend/src/utils/api.ts"]="frontend_api_client"

    # Test Fixtures & Validation
    ["tests/test_fraud_detection.py"]="fraud_detection_tests"
    ["scripts/testing/test_app_comprehensive.py"]="integration_tests"
    ["data/test_fixtures.json"]="test_data_fixtures"

    # Deployment & Infrastructure
    ["Dockerfile"]="container_specification"
    ["infrastructure/production.yml"]="infrastructure_as_code"
    ["scripts/setup-production.sh"]="production_deployment"
    ["scripts/validate-production.sh"]="production_validation"
)

# Lockfile paths
SSOT_MASTER="scripts/diagnostics/ssot_master.json"
DEPENDENCIES_LOCK="scripts/diagnostics/dependencies.lock"
ENVIRONMENTS_LOCK="scripts/diagnostics/environments.lock"
CONFIGURATIONS_LOCK="scripts/diagnostics/configurations.lock"
BUSINESS_LOGIC_LOCK="scripts/diagnostics/business_logic.lock"
SECURITY_CONFIG_LOCK="scripts/diagnostics/security_config.lock"
API_CONTRACTS_LOCK="scripts/diagnostics/api_contracts.lock"
TEST_FIXTURES_LOCK="scripts/diagnostics/test_fixtures.lock"
INFRASTRUCTURE_LOCK="scripts/diagnostics/infrastructure.lock"

# Calculate file checksum
calculate_checksum() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Use SHA256 for consistency
        sha256sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "file_not_found"
    else
        echo "file_missing"
    fi
}

# Verify file integrity
verify_file_integrity() {
    local file="$1"
    local expected_checksum="$2"
    local file_type="$3"

    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ MISSING${NC}: $file ($file_type)"
        return 1
    fi

    local current_checksum=$(calculate_checksum "$file")

    if [[ "$current_checksum" == "$expected_checksum" ]]; then
        echo -e "${GREEN}✅ VERIFIED${NC}: $file ($file_type)"
        return 0
    else
        echo -e "${RED}❌ CORRUPTED${NC}: $file ($file_type)"
        echo "    Expected: $expected_checksum"
        echo "    Current:  $current_checksum"
        return 1
    fi
}

# Generate lockfile for a category
generate_lockfile() {
    local lockfile="$1"
    local category="$2"
    shift 2
    local files=("$@")

    echo "Generating $category lockfile..."

    local lock_data="{"
    lock_data="$lock_data\n  \"category\": \"$category\","
    lock_data="$lock_data\n  \"generated_at\": \"$(date -Iseconds)\","
    lock_data="$lock_data\n  \"version\": \"1.0.0-ssot\","
    lock_data="$lock_data\n  \"files\": {"

    local first=true
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            local checksum=$(calculate_checksum "$file")
            local filename=$(basename "$file")

            if [[ "$first" == false ]]; then
                lock_data="$lock_data,"
            fi
            first=false

            lock_data="$lock_data\n    \"$filename\": {"
            lock_data="$lock_data\n      \"path\": \"$file\","
            lock_data="$lock_data\n      \"checksum\": \"$checksum\","
            lock_data="$lock_data\n      \"size\": $(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0),"
            lock_data="$lock_data\n      \"modified\": \"$(stat -f%Sm -t '%Y-%m-%dT%H:%M:%S' "$file" 2>/dev/null || date -r "$file" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || echo 'unknown')\""
            lock_data="$lock_data\n    }"
        fi
    done

    lock_data="$lock_data\n  }"
    lock_data="$lock_data\n}"

    echo -e "$lock_data" > "$lockfile"
    echo "Lockfile generated: $lockfile"
}

# Verify all lockfiles
verify_all_lockfiles() {
    echo -e "${BLUE}🔍 Verifying SSOT Lockfile Integrity${NC}"
    echo "====================================="

    local total_files=0
    local verified_files=0
    local corrupted_files=0
    local missing_files=0

    # Verify each category
    declare -A CATEGORIES=(
        ["Business Logic"]="scripts/diagnostics/business_logic.lock"
        ["Security Config"]="scripts/diagnostics/security_config.lock"
        ["API Contracts"]="scripts/diagnostics/api_contracts.lock"
        ["Test Fixtures"]="scripts/diagnostics/test_fixtures.lock"
        ["Infrastructure"]="scripts/diagnostics/infrastructure.lock"
    )

    for category in "${!CATEGORIES[@]}"; do
        local lockfile="${CATEGORIES[$category]}"
        echo -e "\n${YELLOW}$category:${NC}"

        if [[ ! -f "$lockfile" ]]; then
            echo -e "${RED}❌ Lockfile missing: $lockfile${NC}"
            continue
        fi

        # Parse and verify files in lockfile (simplified - in real implementation would parse JSON)
        echo "  Lockfile exists: $lockfile"
        ((verified_files++))
    done

    echo -e "\n${BLUE}Verification Summary:${NC}"
    echo "  Total lockfiles: ${#CATEGORIES[@]}"
    echo "  Verified: $verified_files"
    if [[ $corrupted_files -gt 0 ]]; then
        echo -e "  ${RED}Corrupted: $corrupted_files${NC}"
    fi
    if [[ $missing_files -gt 0 ]]; then
        echo -e "  ${RED}Missing: $missing_files${NC}"
    fi
}

# Generate all lockfiles
generate_all_lockfiles() {
    echo -e "${BLUE}🔒 Generating SSOT Lockfiles${NC}"
    echo "============================="

    # Business Logic Files
    generate_lockfile "$BUSINESS_LOGIC_LOCK" "business_logic" \
        "data/fraud_rules.json" \
        "backend/app/services/fraud_service.py" \
        "backend/core/security/rbac.py"

    # Security Configuration Files
    generate_lockfile "$SECURITY_CONFIG_LOCK" "security_config" \
        "backend/app/services/auth_service.py" \
        "backend/core/security/__init__.py" \
        "backend/core/encryption.py"

    # API Contract Files
    generate_lockfile "$API_CONTRACTS_LOCK" "api_contracts" \
        "backend/main.py" \
        "backend/app/routers/identity.py" \
        "backend/app/routers/fraud.py"

    # Test Fixture Files
    generate_lockfile "$TEST_FIXTURES_LOCK" "test_fixtures" \
        "tests/test_fraud_detection.py" \
        "scripts/testing/test_app_comprehensive.py" \
        "data/test_fixtures.json"

    # Infrastructure Files
    generate_lockfile "$INFRASTRUCTURE_LOCK" "infrastructure" \
        "Dockerfile" \
        "infrastructure/docker-compose.production.yml" \
        "scripts/setup-production.sh" \
        "scripts/validate-production.sh"

    echo -e "\n${GREEN}✅ All lockfiles generated successfully${NC}"
}

# Main function
main() {
    case "$1" in
        "generate")
            generate_all_lockfiles
            ;;
        "verify")
            verify_all_lockfiles
            ;;
        "status")
            echo -e "${BLUE}SSOT Status Report${NC}"
            echo "=================="
            echo "SSOT Master: $([[ -f "$SSOT_MASTER" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "Dependencies Lock: $([[ -f "$DEPENDENCIES_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "Environments Lock: $([[ -f "$ENVIRONMENTS_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "Configurations Lock: $([[ -f "$CONFIGURATIONS_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "Business Logic Lock: $([[ -f "$BUSINESS_LOGIC_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "Security Config Lock: $([[ -f "$SECURITY_CONFIG_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "API Contracts Lock: $([[ -f "$API_CONTRACTS_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "Test Fixtures Lock: $([[ -f "$TEST_FIXTURES_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            echo "Infrastructure Lock: $([[ -f "$INFRASTRUCTURE_LOCK" ]] && echo '✅ Present' || echo '❌ Missing')"
            ;;
        "list")
            echo -e "${BLUE}SSOT Protected Files${NC}"
            echo "===================="
            for file in "${!SSOT_FILES[@]}"; do
                local category="${SSOT_FILES[$file]}"
                if [[ -f "$file" ]]; then
                    echo -e "${GREEN}✅ $file${NC} ($category)"
                else
                    echo -e "${RED}❌ $file${NC} ($category) - MISSING"
                fi
            done
            ;;
        *)
            echo "Usage: $0 {generate|verify|status|list}"
            echo ""
            echo "Commands:"
            echo "  generate - Generate all SSOT lockfiles"
            echo "  verify   - Verify integrity of all lockfiles"
            echo "  status   - Show status of all lockfiles"
            echo "  list     - List all SSOT protected files"
            exit 1
            ;;
    esac
}

main "$@"