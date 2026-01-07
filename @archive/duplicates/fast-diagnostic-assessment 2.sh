#!/bin/bash
# Fast Diagnostic Assessment Script
# Quick multi-perspective analysis for immediate insights

set -e

echo "🚀 Running Fast Multi-Perspective Diagnostic Assessment"
echo "======================================================"

# Create results directory
RESULTS_DIR="diagnostics/results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📁 Results directory: $RESULTS_DIR"

# Function to run diagnostic and capture output
run_diagnostic() {
    local name="$1"
    local command="$2"
    local file="$RESULTS_DIR/$3"

    echo "🔍 Running $name diagnostic..."
    if eval "$command" > "$file" 2>&1; then
        echo "✅ $name completed"
    else
        echo "⚠️ $name failed (see $file)"
    fi
}

# 1. CODE QUALITY ANALYSIS
echo ""
echo "💻 Code Quality Analysis"
echo "========================"

# Backend Python analysis
run_diagnostic "Python File Count" "find backend/ -name '*.py' -type f | wc -l" "python_files.txt"
run_diagnostic "Python Line Count" "find backend/ -name '*.py' -type f -exec wc -l {} + | tail -1" "python_lines.txt"

# Check for critical Python issues
run_diagnostic "Python Import Errors" "cd backend && python -c 'import sys; sys.path.append(\".\"); from app.services.business.case_service import case_service; print(\"Imports OK\")' 2>&1 || echo 'Import issues detected'" "python_imports.txt"

# 2. TESTING ANALYSIS
echo ""
echo "🧪 Testing Analysis"
echo "==================="

run_diagnostic "Test File Count" "find . -name '*test*.py' -o -name '*spec*.js' -o -name '*.test.*' | wc -l" "test_files.txt"

# Backend test status
run_diagnostic "Backend Test Status" "cd backend && python -c 'import pytest; print(\"pytest available\")' 2>&1 && echo 'Tests can run' || echo 'pytest not available'" "backend_test_status.txt"

# 3. SECURITY ANALYSIS
echo ""
echo "🔒 Security Analysis"
echo "==================="

run_diagnostic "Hardcoded Secrets Check" "grep -r 'password.*=' backend/ --include='*.py' | grep -v 'os.getenv\|getenv' | wc -l" "hardcoded_secrets.txt"

run_diagnostic "Environment Variables" "grep -r 'os.getenv\|process.env' . --include='*.py' --include='*.js' | wc -l" "env_variables.txt"

run_diagnostic "Security Imports" "grep -r 'import.*security\|from.*security' backend/ | wc -l" "security_imports.txt"

# 4. INFRASTRUCTURE ANALYSIS
echo ""
echo "🏗️ Infrastructure Analysis"
echo "=========================="

run_diagnostic "Docker Files" "find . -name 'Dockerfile*' -o -name 'docker-compose*.yml' | wc -l" "docker_files.txt"

run_diagnostic "Config Files" "find . -name '*.json' -o -name '*.yaml' -o -name '*.yml' | grep -E '(config|settings)' | wc -l" "config_files.txt"

run_diagnostic "Build Scripts" "find . -name '*.sh' -o -name '*.py' -o -name 'Makefile' | xargs grep -l 'build\|deploy\|install' | wc -l" "build_scripts.txt"

# 5. PERFORMANCE ANALYSIS
echo ""
echo "🚀 Performance Analysis"
echo "======================="

run_diagnostic "Large Files" "find . -name '*.py' -type f -exec wc -l {} + | sort -nr | head -5" "large_files.txt"

run_diagnostic "Database Queries" "grep -r 'db\.query\|session\.query' backend/ | wc -l" "db_queries.txt"

run_diagnostic "Async Functions" "grep -r 'async def\|await ' backend/ | wc -l" "async_functions.txt"

# 6. BUSINESS LOGIC ANALYSIS
echo ""
echo "💼 Business Logic Analysis"
echo "=========================="

run_diagnostic "Business Services" "find backend/app/services/business -name '*.py' | wc -l" "business_services.txt"

run_diagnostic "Domain Models" "grep -r 'class.*Model\|class.*Entity' backend/ | wc -l" "domain_models.txt"

run_diagnostic "Business Rules" "grep -r 'if.*risk\|if.*amount\|if.*status' backend/app/services/business/ | wc -l" "business_rules.txt"

# 7. INTEGRATION ANALYSIS
echo ""
echo "🔗 Integration Analysis"
echo "======================="

run_diagnostic "API Routes" "grep -r '@router\.\|@app\.' backend/ | wc -l" "api_routes.txt"

run_diagnostic "External Calls" "grep -r 'requests\.|httpx\.|aiohttp\.' backend/ | wc -l" "external_calls.txt"

run_diagnostic "Database Connections" "grep -r 'create_engine\|connect\|session' backend/ | wc -l" "db_connections.txt"

# 8. OPERATIONAL ANALYSIS
echo ""
echo "⚙️ Operational Analysis"
echo "======================="

run_diagnostic "Log Statements" "grep -r 'logger\.|logging\.' backend/ | wc -l" "log_statements.txt"

run_diagnostic "Error Handling" "grep -r 'try:\|except\|raise' backend/ | wc -l" "error_handling.txt"

run_diagnostic "Health Checks" "grep -r 'health\|status\|ping' backend/ | wc -l" "health_checks.txt"

# 9. COMPLIANCE ANALYSIS
echo ""
echo "📋 Compliance Analysis"
echo "======================"

run_diagnostic "Audit Logs" "grep -r 'audit\|log.*action\|track' backend/ | wc -l" "audit_logs.txt"

run_diagnostic "Data Encryption" "grep -r 'encrypt\|decrypt\|cipher' backend/ | wc -l" "encryption_usage.txt"

run_diagnostic "Access Control" "grep -r 'permission\|role\|auth' backend/ | wc -l" "access_control.txt"

# 10. UX/FRONTEND ANALYSIS
echo ""
echo "🎨 UX/Frontend Analysis"
echo "======================="

run_diagnostic "Frontend Files" "find . -name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js' | grep -v node_modules | wc -l" "frontend_files.txt"

run_diagnostic "React Components" "grep -r 'function.*Component\|const.*=.*=>' frontend/ 2>/dev/null | wc -l" "react_components.txt"

run_diagnostic "UI Libraries" "grep -r 'from.*ui\|import.*ui' frontend/ 2>/dev/null | wc -l" "ui_libraries.txt"

# SUMMARY REPORT
echo ""
echo "📊 GENERATING SUMMARY REPORT"
echo "============================"

cat > "$RESULTS_DIR/summary_report.md" << EOF
# Multi-Perspective Diagnostic Summary Report
Generated: $(date)

## 📈 Key Metrics

### Code Quality
- Python files: $(cat $RESULTS_DIR/python_files.txt 2>/dev/null || echo "N/A")
- Python lines: $(cat $RESULTS_DIR/python_lines.txt 2>/dev/null | awk '{print $1}' || echo "N/A")
- Test files: $(cat $RESULTS_DIR/test_files.txt 2>/dev/null || echo "N/A")

### Security
- Hardcoded secrets: $(cat $RESULTS_DIR/hardcoded_secrets.txt 2>/dev/null || echo "N/A")
- Environment variables: $(cat $RESULTS_DIR/env_variables.txt 2>/dev/null || echo "N/A")
- Security imports: $(cat $RESULTS_DIR/security_imports.txt 2>/dev/null || echo "N/A")

### Infrastructure
- Docker files: $(cat $RESULTS_DIR/docker_files.txt 2>/dev/null || echo "N/A")
- Config files: $(cat $RESULTS_DIR/config_files.txt 2>/dev/null || echo "N/A")
- Build scripts: $(cat $RESULTS_DIR/build_scripts.txt 2>/dev/null || echo "N/A")

### Business Logic
- Business services: $(cat $RESULTS_DIR/business_services.txt 2>/dev/null || echo "N/A")
- Domain models: $(cat $RESULTS_DIR/domain_models.txt 2>/dev/null || echo "N/A")
- Business rules: $(cat $RESULTS_DIR/business_rules.txt 2>/dev/null || echo "N/A")

### Integration
- API routes: $(cat $RESULTS_DIR/api_routes.txt 2>/dev/null || echo "N/A")
- External calls: $(cat $RESULTS_DIR/external_calls.txt 2>/dev/null || echo "N/A")
- DB connections: $(cat $RESULTS_DIR/db_connections.txt 2>/dev/null || echo "N/A")

## 🎯 Quick Assessment

### Strengths
$(if [ "$(cat $RESULTS_DIR/python_imports.txt 2>/dev/null)" = "Imports OK" ]; then echo "- ✅ Backend imports working correctly"; fi)
$(if [ $(cat $RESULTS_DIR/business_services.txt 2>/dev/null || echo 0) -gt 0 ]; then echo "- ✅ Business logic architecture present"; fi)
$(if [ $(cat $RESULTS_DIR/api_routes.txt 2>/dev/null || echo 0) -gt 10 ]; then echo "- ✅ Comprehensive API surface"; fi)

### Concerns
$(if [ $(cat $RESULTS_DIR/hardcoded_secrets.txt 2>/dev/null || echo 0) -gt 0 ]; then echo "- ⚠️ Potential hardcoded secrets detected"; fi)
$(if [ ! -f "$RESULTS_DIR/large_files.txt" ] || [ $(wc -l < "$RESULTS_DIR/large_files.txt") -gt 3 ]; then echo "- ⚠️ Large code files may indicate complexity issues"; fi)

### Recommendations
1. Review security scan results for hardcoded credentials
2. Analyze large files for potential refactoring opportunities
3. Validate test coverage and quality
4. Assess API documentation completeness
5. Review error handling patterns

---
*Full detailed reports available in: $RESULTS_DIR*
EOF

echo "📋 Summary report generated: $RESULTS_DIR/summary_report.md"

echo ""
echo "🎉 Fast Diagnostic Assessment Complete!"
echo "======================================="
echo ""
echo "📊 Summary Report: $RESULTS_DIR/summary_report.md"
echo ""
echo "🔍 Next Steps:"
echo "1. Review the summary report for key insights"
echo "2. Examine detailed results in $RESULTS_DIR/"
echo "3. Run manual assessments for critical gaps"
echo "4. Prioritize fixes based on findings"