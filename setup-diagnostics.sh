#!/bin/bash
# Comprehensive Diagnostic Tool Setup Script
# Phase 1: Foundation - Tool Installation and Configuration

set -e

echo "🔧 Starting Comprehensive Diagnostic Tool Setup"
echo "=============================================="

# Create diagnostic directories
mkdir -p diagnostics/{tools,reports,data,baselines,scripts}
mkdir -p diagnostics/perspectives/{ux,business_logic,infrastructure,data_integrity,integration,operations,compliance,security,performance,code_health}

echo "📁 Created diagnostic directory structure"

# Install Python diagnostic packages
echo "🐍 Installing Python diagnostic packages..."
pip install --quiet \
    pytest-cov \
    coverage \
    radon \
    pylint \
    mypy \
    bandit \
    safety \
    pip-audit \
    sqlfluff \
    yamllint \
    pre-commit \
    black \
    isort \
    autoflake \
    pytest-xdist \
    pytest-benchmark \
    locust \
    pytest-html \
    pytest-json-report \
    pytest-mock \
    freezegun \
    faker \
    hypothesis \
    schemathesis \
    requests-mock \
    responses \
    vcrpy

echo "✅ Python diagnostic packages installed"

# Install Node.js diagnostic packages
echo "📦 Installing Node.js diagnostic packages..."
npm install --silent -g \
    lighthouse \
    pa11y \
    axe-core \
    @axe-core/cli \
    eslint \
    eslint-config-airbnb \
    eslint-plugin-react \
    eslint-plugin-jsx-a11y \
    eslint-plugin-import \
    prettier \
    typescript \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    jest \
    @testing-library/react \
    @testing-library/jest-dom \
    @testing-library/user-event \
    cypress \
    start-server-and-test \
    artillery \
    clinics \
    0x \
    v8-profiler \
    autocannon \
    loadtest \
    nyc \
    istanbul \
    codecov \
    semantic-release \
    commitizen \
    husky \
    lint-staged

echo "✅ Node.js diagnostic packages installed"

# Install system diagnostic tools
echo "🛠️ Installing system diagnostic tools..."

# Check if tools are available, install if needed
command -v docker >/dev/null 2>&1 || echo "⚠️ Docker not found - install manually"
command -v docker-compose >/dev/null 2>&1 || echo "⚠️ Docker Compose not found - install manually"

# Install monitoring tools
if command -v brew >/dev/null 2>&1; then
    echo "🍺 Installing macOS diagnostic tools..."
    brew install --quiet htop iotop ncdu tree jq httpie curl wget
    brew install --quiet postgresql mysql-client redis mongodb-community
    brew install --quiet prometheus grafana influxdb telegraf
elif command -v apt-get >/dev/null 2>&1; then
    echo "🐧 Installing Ubuntu/Debian diagnostic tools..."
    sudo apt-get update -qq
    sudo apt-get install -qq -y htop iotop ncdu tree jq httpie curl wget
    sudo apt-get install -qq -y postgresql-client mysql-client redis-tools mongodb-clients
    # Note: Prometheus/Grafana would need separate installation
else
    echo "⚠️ Unsupported OS - install diagnostic tools manually"
fi

echo "✅ System diagnostic tools installed"

# Create diagnostic configuration files
cat > diagnostics/config.json << EOF
{
  "diagnostic_version": "2.0",
  "perspectives": [
    "ux_frontend",
    "business_logic",
    "infrastructure",
    "data_integrity",
    "integration_ecosystem",
    "operational_excellence",
    "compliance_governance",
    "advanced_security",
    "system_performance",
    "code_ecosystem"
  ],
  "scoring_methodology": {
    "max_score": 10,
    "weight_distribution": {
      "critical": 0.4,
      "high": 0.3,
      "medium": 0.2,
      "low": 0.1
    }
  },
  "thresholds": {
    "excellent": 9.0,
    "good": 7.0,
    "needs_improvement": 5.0,
    "critical": 3.0
  },
  "automated_tools": {
    "python": ["pylint", "mypy", "bandit", "safety", "coverage"],
    "javascript": ["eslint", "prettier", "jest", "cypress"],
    "infrastructure": ["docker", "docker-compose", "prometheus"],
    "performance": ["locust", "artillery", "autocannon"]
  }
}
EOF

echo "⚙️ Created diagnostic configuration"

# Create baseline script
cat > diagnostics/scripts/establish-baseline.sh << 'EOF'
#!/bin/bash
# Establish Baseline Measurements Script

echo "📊 Establishing Diagnostic Baselines"
echo "==================================="

# Create baseline directories
mkdir -p ../baselines/{current,previous,trends}

# Python code quality baseline
echo "🐍 Collecting Python code quality baseline..."
find ../backend -name "*.py" -type f | wc -l > ../baselines/python_file_count.txt
radon cc ../backend/app/ > ../baselines/python_complexity.txt 2>/dev/null || echo "Radon not available"
radon mi ../backend/app/ > ../baselines/python_maintainability.txt 2>/dev/null || echo "Radon not available"

# Test coverage baseline
echo "🧪 Collecting test coverage baseline..."
cd ../backend
python -m pytest tests/ --cov=app --cov-report=term-missing --quiet > ../diagnostics/baselines/test_coverage.txt 2>&1 || echo "Tests failed"
cd ../diagnostics

# Security baseline
echo "🔒 Collecting security baseline..."
bandit -r ../backend/app/ -f json > ../baselines/security_scan.json 2>/dev/null || echo "Bandit not available"
safety check --json > ../baselines/dependency_vulnerabilities.json 2>/dev/null || echo "Safety not available"

# Performance baseline
echo "🚀 Collecting performance baseline..."
# Add performance baseline collection here

echo "✅ Baseline measurements established"
EOF

chmod +x diagnostics/scripts/establish-baseline.sh

# Create automated diagnostic runner
cat > diagnostics/scripts/run-automated-diagnostics.sh << 'EOF'
#!/bin/bash
# Automated Diagnostic Runner

echo "🤖 Running Automated Diagnostics"
echo "================================"

# Create results directory
RESULTS_DIR="reports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📁 Results will be saved to: $RESULTS_DIR"

# Python Code Quality Analysis
echo "🐍 Analyzing Python code quality..."
cd ../backend

# Linting
pylint app/ > "../diagnostics/$RESULTS_DIR/pylint_report.txt" 2>&1 || echo "Pylint failed"

# Type checking
mypy app/ > "../diagnostics/$RESULTS_DIR/mypy_report.txt" 2>&1 || echo "MyPy failed"

# Security scanning
bandit -r app/ -f json > "../diagnostics/$RESULTS_DIR/security_scan.json" 2>&1 || echo "Bandit failed"

# Dependency vulnerabilities
safety check --json > "../diagnostics/$RESULTS_DIR/dependency_scan.json" 2>&1 || echo "Safety failed"

# Test coverage
python -m pytest tests/ --cov=app --cov-report=json:../diagnostics/$RESULTS_DIR/coverage.json --cov-report=html:../diagnostics/$RESULTS_DIR/coverage_html --quiet || echo "Coverage failed"

cd ../diagnostics

# Infrastructure Analysis
echo "🏗️ Analyzing infrastructure..."
docker ps > "$RESULTS_DIR/docker_containers.txt" 2>&1 || echo "Docker not available"
docker stats --no-stream > "$RESULTS_DIR/docker_stats.txt" 2>&1 || echo "Docker stats failed"

# System resources
echo "🖥️ Analyzing system resources..."
top -l 1 | head -20 > "$RESULTS_DIR/system_load.txt" 2>&1 || echo "Top failed"
df -h > "$RESULTS_DIR/disk_usage.txt" 2>&1 || echo "DF failed"

echo "✅ Automated diagnostics completed"
echo "📊 Results saved to: $RESULTS_DIR"
EOF

chmod +x diagnostics/scripts/run-automated-diagnostics.sh

# Create manual assessment checklist
cat > diagnostics/scripts/manual-assessment-checklist.md << 'EOF'
# Manual Assessment Checklist
## Comprehensive Multi-Perspective Diagnostic

### 🎨 UX/Frontend Experience Assessment
- [ ] User journey mapping for critical paths
- [ ] Accessibility testing with screen readers
- [ ] Error handling and recovery testing
- [ ] Performance perception testing
- [ ] Mobile responsiveness validation
- [ ] Cross-browser compatibility testing

### 💼 Business Logic Integrity Assessment
- [ ] Business rule documentation review
- [ ] Calculation accuracy validation
- [ ] Process flow verification
- [ ] Edge case testing
- [ ] Domain expert validation
- [ ] Business requirement traceability

### 🔒 Advanced Security Assessment
- [ ] Threat modeling workshop
- [ ] Attack surface analysis
- [ ] Security control validation
- [ ] Incident response testing
- [ ] Security monitoring review
- [ ] Third-party security assessment

### 🏗️ Infrastructure Readiness Assessment
- [ ] CI/CD pipeline review
- [ ] Deployment automation testing
- [ ] Configuration management audit
- [ ] Backup and recovery testing
- [ ] Scalability testing
- [ ] High availability validation

### 🗄️ Data Integrity Assessment
- [ ] Database constraint validation
- [ ] Migration testing
- [ ] Backup integrity verification
- [ ] Data consistency checking
- [ ] Referential integrity validation
- [ ] Data quality assessment

### 🔗 Integration Ecosystem Assessment
- [ ] API contract validation
- [ ] External service dependency mapping
- [ ] Error handling and retry logic testing
- [ ] Integration testing
- [ ] Contract testing
- [ ] Service level agreement validation

### ⚙️ Operational Excellence Assessment
- [ ] Runbook completeness review
- [ ] Monitoring dashboard evaluation
- [ ] Alert quality assessment
- [ ] Incident response simulation
- [ ] Automation level assessment
- [ ] Operational procedure validation

### 📋 Compliance & Governance Assessment
- [ ] Regulatory requirement mapping
- [ ] Audit trail completeness
- [ ] Access control validation
- [ ] Data governance review
- [ ] Policy compliance checking
- [ ] Documentation adequacy

### 🚀 System Performance Assessment
- [ ] Load testing execution
- [ ] Resource utilization analysis
- [ ] Bottleneck identification
- [ ] Scalability testing
- [ ] Performance regression testing
- [ ] Capacity planning validation

### 💻 Code Ecosystem Health Assessment
- [ ] Technical debt analysis
- [ ] Code ownership distribution
- [ ] Documentation completeness
- [ ] Development process review
- [ ] Knowledge sharing assessment
- [ ] Code review process evaluation

## Assessment Scoring Guide

### UX/Frontend Experience (0-10)
- 9-10: Exceptional user experience with comprehensive accessibility
- 7-8: Good user experience with minor accessibility issues
- 5-6: Adequate user experience with notable usability problems
- 3-4: Poor user experience with significant barriers
- 0-2: Critical usability issues preventing task completion

### Business Logic Integrity (0-10)
- 9-10: All business rules correctly implemented with comprehensive testing
- 7-8: Most business rules implemented with adequate testing
- 5-6: Basic business rules implemented with limited testing
- 3-4: Significant gaps in business rule implementation
- 0-2: Critical business logic errors affecting core functionality

### Advanced Security (0-10)
- 9-10: Defense in depth with comprehensive threat protection
- 7-8: Strong security controls with minor gaps
- 5-6: Adequate security with known vulnerabilities
- 3-4: Weak security controls with significant risks
- 0-2: Critical security vulnerabilities requiring immediate attention

### Infrastructure Readiness (0-10)
- 9-10: Fully automated, highly reliable deployment pipeline
- 7-8: Mostly automated with some manual processes
- 5-6: Basic automation with significant manual intervention
- 3-4: Mostly manual processes with automation gaps
- 0-2: No automation, high risk of deployment failures

### Data Integrity (0-10)
- 9-10: Comprehensive data validation with zero-loss recovery
- 7-8: Strong data integrity with reliable recovery
- 5-6: Adequate data integrity with recovery capabilities
- 3-4: Weak data integrity with recovery concerns
- 0-2: Critical data integrity issues with potential data loss

### Integration Ecosystem (0-10)
- 9-10: Robust integrations with comprehensive error handling
- 7-8: Reliable integrations with good error handling
- 5-6: Functional integrations with basic error handling
- 3-4: Unreliable integrations with error handling gaps
- 0-2: Broken integrations causing system failures

### Operational Excellence (0-10)
- 9-10: Fully automated operations with proactive monitoring
- 7-8: Well-automated operations with good monitoring
- 5-6: Partially automated with adequate monitoring
- 3-4: Manual operations with monitoring gaps
- 0-2: No automation with poor monitoring

### Compliance & Governance (0-10)
- 9-10: 100% compliance with comprehensive governance
- 7-8: Strong compliance with good governance
- 5-6: Adequate compliance with basic governance
- 3-4: Compliance gaps with governance issues
- 0-2: Major compliance violations

### System Performance (0-10)
- 9-10: Excellent performance with strong scalability
- 7-8: Good performance with adequate scalability
- 5-6: Acceptable performance with scaling concerns
- 3-4: Poor performance limiting scalability
- 0-2: Critical performance issues

### Code Ecosystem Health (0-10)
- 9-10: Excellent code quality with strong team practices
- 7-8: Good code quality with effective team practices
- 5-6: Adequate code quality with team practice gaps
- 3-4: Poor code quality with weak team practices
- 0-2: Critical code quality and team issues
EOF

echo "📋 Created manual assessment checklist"

# Create baseline establishment script
echo "📊 Running baseline establishment..."
./diagnostics/scripts/establish-baseline.sh

echo ""
echo "🎉 Diagnostic Foundation Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run automated diagnostics: ./diagnostics/scripts/run-automated-diagnostics.sh"
echo "2. Review manual assessment checklist: diagnostics/scripts/manual-assessment-checklist.md"
echo "3. Begin Phase 2 data collection"
echo ""
echo "Installed tools:"
echo "- Python: pytest, coverage, pylint, mypy, bandit, safety, radon"
echo "- Node.js: eslint, prettier, jest, lighthouse, artillery"
echo "- System: htop, iotop, ncdu, jq, httpie"
echo ""
echo "Configuration files created:"
echo "- diagnostics/config.json"
echo "- diagnostics/scripts/establish-baseline.sh"
echo "- diagnostics/scripts/run-automated-diagnostics.sh"
echo "- diagnostics/scripts/manual-assessment-checklist.md"