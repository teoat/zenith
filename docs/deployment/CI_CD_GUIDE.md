# CI/CD Pipeline Documentation

## 🚀 Overview

The 378x492 Fraud Detection project uses GitHub Actions for comprehensive CI/CD with automated testing, security scanning, and deployment workflows.

## 📋 Workflow Summary

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| **CI/CD Pipeline** | Push/PR to main | Full testing, building, release | ✅ Active |
| **Security Scan** | Daily + Push/PR | Security vulnerability scanning | ✅ Active |
| **Code Quality** | Push/PR | Code formatting, linting, type checking | ✅ Active |
| **Dependency Updates** | Weekly + Manual | Automated dependency updates | ✅ Active |

## 🔄 CI/CD Pipeline (`build-test.yml`)

### Jobs Overview

#### 1. Security & Quality Scan
- **Purpose**: Early security and quality checks
- **Tools**: npm audit, Safety, Trivy, ESLint, TypeScript
- **Duration**: ~3-5 minutes

#### 2. Unit & Integration Tests
- **Purpose**: Comprehensive testing across frontend and backend
- **Coverage**: Jest (frontend), pytest (backend), API integration tests
- **Artifacts**: Test reports, coverage reports

#### 3. Build Application
- **Matrix**: macOS, Windows, Linux builds
- **Outputs**: Platform-specific installers and bundles
- **Verification**: Automated build artifact validation

#### 4. End-to-End Testing
- **Purpose**: Test built applications
- **Tools**: Playwright for UI testing
- **Scope**: Installation, launch, basic functionality

#### 5. Release Preparation
- **Purpose**: Generate version info and changelog
- **Outputs**: Version number, release notes

#### 6. Production Release
- **Purpose**: Create GitHub releases with artifacts
- **Features**: Automated changelog, Slack notifications
- **Security**: Code signing, notarization

## 🔒 Security Scanning (`security-scan.yml`)

### Daily Security Audits
- **Schedule**: 2 AM UTC daily
- **Scope**: Dependencies, code vulnerabilities
- **Tools**:
  - **npm audit**: Node.js dependency vulnerabilities
  - **Safety**: Python dependency vulnerabilities
  - **Trivy**: Container and filesystem scanning
  - **Bandit**: Python security linting

### Security Reports
- **Format**: SARIF for GitHub Security tab
- **Retention**: 30 days
- **Notifications**: Security alerts for critical issues

## 📏 Code Quality (`code-quality.yml`)

### Quality Gates
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting checks
- **Black**: Python code formatting
- **isort**: Python import sorting
- **flake8**: Python style guide enforcement
- **mypy**: Python type checking

### Quality Metrics
- **Coverage**: Code coverage reporting
- **Complexity**: Cyclomatic complexity analysis
- **Duplication**: Code duplication detection

## 🔄 Dependency Management (`dependency-updates.yml`)

### Automated Updates
- **Schedule**: Weekly (Mondays 8 AM UTC)
- **Scope**: npm and pip dependencies
- **Process**:
  1. Update all dependencies
  2. Run security fixes
  3. Execute test suite
  4. Create pull request if successful

### Update Process
```bash
# Node.js updates
npm update
npm audit fix

# Python updates
pip install --upgrade -r requirements.txt
```

## 🛠️ Local Development Scripts

### Available NPM Scripts

```bash
# Security & Quality
npm run ci:security    # Run security scans
npm run ci:lint        # Run linting and type checking
npm run ci:quality     # Run code quality checks

# Testing
npm run ci:test        # Run all tests
npm run test:ci        # Frontend tests with coverage

# Building
npm run ci:build       # Full build pipeline
npm run build:electron # Electron app build
npm run build:frontend # Frontend build
npm run build:backend  # Backend PyInstaller build

# Verification
npm run verify:build   # Build artifact verification
npm run package        # Complete packaging

# Full CI simulation
npm run ci:full        # Run complete CI pipeline locally
```

## 🔐 Required Secrets

### GitHub Repository Secrets

```yaml
# For releases and notifications
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Auto-provided

# Security scanning
SNYK_TOKEN: your-snyk-api-token           # For Snyk vulnerability scanning

# Code signing (future)
APPLE_ID: your-apple-id                    # For macOS notarization
APPLE_ID_PASSWORD: app-specific-password   # For macOS notarization
APPLE_TEAM_ID: your-team-id                # For macOS code signing
WIN_CSC_LINK: certificate.p12             # Windows code signing cert
WIN_CSC_KEY_PASSWORD: cert-password       # Windows cert password

# Notifications
SLACK_WEBHOOK_URL: slack-webhook-url      # For Slack notifications
```

## 📊 Monitoring & Reporting

### Test Results
- **Coverage Reports**: Codecov integration
- **Test Artifacts**: JUnit XML, coverage JSON
- **Retention**: 30 days for all artifacts

### Security Findings
- **SARIF Reports**: GitHub Security tab integration
- **Vulnerability Tracking**: Automated issue creation
- **Compliance**: SOC2, GDPR compliance checks

### Performance Metrics
- **Build Times**: Tracked across runs
- **Test Performance**: Execution time analysis
- **Bundle Sizes**: Artifact size monitoring

## 🚀 Deployment Workflows

### Staging Deployment
```yaml
# Manual trigger for staging
workflow_dispatch:
  inputs:
    environment:
      default: 'staging'
```

### Production Deployment
- **Automatic**: On main branch push after successful tests
- **Manual**: Via workflow dispatch for hotfixes
- **Rollback**: Previous release artifacts retained

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean and rebuild
npm run clean
npm install
npm run ci:build
```

#### Test Failures
```bash
# Run tests individually
npm run test:ci
cd backend && python -m pytest tests/ -v
```

#### Security Scan Issues
```bash
# Update dependencies
npm audit fix
cd backend && pip install --upgrade -r requirements.txt
```

### Debug Mode
```bash
# Run with verbose output
DEBUG=* npm run ci:test
cd backend && python -m pytest tests/ -v -s
```

## 📈 Metrics & KPIs

### CI/CD Performance
- **Build Time**: < 15 minutes for full pipeline
- **Test Coverage**: > 80% for critical paths
- **Security Score**: A+ on all scans
- **Uptime**: 99.9% pipeline availability

### Quality Gates
- **Zero Security Vulnerabilities**: Critical/High severity
- **Zero Linting Errors**: ESLint, flake8 clean
- **All Tests Passing**: 100% success rate
- **Code Coverage**: > 85% maintained

## 🎯 Next Steps

### Planned Enhancements
1. **Container Scanning**: Docker image vulnerability scanning
2. **Performance Testing**: Automated load testing
3. **Accessibility Testing**: WCAG compliance automation
4. **Integration Testing**: External API testing
5. **Chaos Engineering**: Fault injection testing

### Advanced Features
1. **Multi-environment**: Dev/Staging/Prod pipelines
2. **Blue-Green Deployment**: Zero-downtime releases
3. **Feature Flags**: Progressive rollout control
4. **Canary Releases**: Gradual traffic shifting

---

## 📞 Support

For CI/CD pipeline issues:
- Check [GitHub Actions logs](https://github.com/your-org/378x492/actions)
- Review [troubleshooting guide](#troubleshooting)
- Create issue with `ci-cd` label

**Last Updated**: December 12, 2025
**Version**: 1.0.0