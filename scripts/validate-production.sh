#!/bin/bash
# Production Deployment Validation Script
# Validates that the 378x492 Fraud Detection Platform is correctly deployed

set -e

echo "🔍 378x492 Production Deployment Validation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

check_service() {
    local service=$1
    local description=$2

    if sudo systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        ((FAILED++))
    fi
}

check_file() {
    local file=$1
    local description=$2

    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        ((FAILED++))
    fi
}

check_directory() {
    local dir=$1
    local description=$2

    if [[ -d "$dir" ]]; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        ((FAILED++))
    fi
}

check_port() {
    local port=$1
    local description=$2

    if nc -z localhost "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        ((FAILED++))
    fi
}

check_api_endpoint() {
    local url=$1
    local description=$2

    if curl -s --max-time 10 "$url" > /dev/null; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        ((FAILED++))
    fi
}

echo "🔧 System Configuration Checks:"
echo "-------------------------------"

check_directory "/opt/378x492" "Application directory exists"
check_directory "/var/log/378x492" "Log directory exists"
check_directory "/var/backups/378x492" "Backup directory exists"
check_file "/opt/378x492/.env" "Environment configuration file exists"
check_file "/etc/systemd/system/378x492.service" "Systemd service file exists"
check_file "/etc/nginx/sites-enabled/378x492" "Nginx configuration enabled"

echo ""
echo "⚙️ Service Status Checks:"
echo "------------------------"

check_service "378x492" "378x492 application service running"
check_service "nginx" "Nginx web server running"
check_service "redis-server" "Redis cache server running"
check_service "postgresql" "PostgreSQL database running"

echo ""
echo "🌐 Network Configuration Checks:"
echo "-------------------------------"

check_port "8000" "Application port 8000 accessible"
check_port "80" "HTTP port 80 accessible"
check_port "443" "HTTPS port 443 accessible"

echo ""
echo "🔗 API Endpoint Checks:"
echo "----------------------"

check_api_endpoint "http://localhost:8000/docs" "API documentation accessible"
check_api_endpoint "http://localhost:8000/health" "Health check endpoint accessible"

# Test authentication
echo ""
echo "🔐 Authentication Tests:"
echo "-----------------------"

AUTH_TEST=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token' 2>/dev/null || echo "failed")

if [[ "$AUTH_TEST" != "failed" && ${#AUTH_TEST} -gt 100 ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Admin authentication working"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Admin authentication failed"
    ((FAILED++))
fi

echo ""
echo "💾 Database Checks:"
echo "------------------"

if [[ -f "/opt/378x492/fraud_detection_prod.db" ]]; then
    DB_SIZE=$(stat -f%z "/opt/378x492/fraud_detection_prod.db" 2>/dev/null || stat -c%s "/opt/378x492/fraud_detection_prod.db" 2>/dev/null || echo "0")
    if [[ $DB_SIZE -gt 1000 ]]; then
        echo -e "${GREEN}✅ PASS${NC}: Database file exists and has content (${DB_SIZE} bytes)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️ WARN${NC}: Database file exists but may be empty (${DB_SIZE} bytes)"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: Database file not found"
    ((FAILED++))
fi

echo ""
echo "🔒 Security Checks:"
echo "------------------"

# Check file permissions
if [[ $(stat -c %a /opt/378x492/.env 2>/dev/null) == "600" ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Environment file has correct permissions (600)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Environment file has incorrect permissions"
    ((FAILED++))
fi

# Check if SSL certificate exists
if [[ -f "/etc/letsencrypt/live/your-domain.com/fullchain.pem" ]]; then
    echo -e "${GREEN}✅ PASS${NC}: SSL certificate configured"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️ WARN${NC}: SSL certificate not found (may not be configured yet)"
fi

echo ""
echo "📊 VALIDATION SUMMARY"
echo "===================="

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

if [[ $PERCENTAGE -ge 90 ]]; then
    GRADE="A"
    COLOR=$GREEN
elif [[ $PERCENTAGE -ge 80 ]]; then
    GRADE="B"
    COLOR=$GREEN
elif [[ $PERCENTAGE -ge 70 ]]; then
    GRADE="C"
    COLOR=$YELLOW
else
    GRADE="F"
    COLOR=$RED
fi

echo -e "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Success Rate: ${COLOR}$PERCENTAGE% (Grade: $GRADE)${NC}"

echo ""
if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 All checks passed! Production deployment is ready.${NC}"
else
    echo -e "${YELLOW}⚠️ Some checks failed. Please review and fix issues before going live.${NC}"
fi

echo ""
echo "📋 Recommended Next Steps:"
echo "- Configure monitoring (Prometheus/Grafana)"
echo "- Set up log aggregation (ELK stack)"
echo "- Configure backup verification"
echo "- Set up automated security updates"
echo "- Configure firewall rules"
echo "- Set up load balancer if needed"