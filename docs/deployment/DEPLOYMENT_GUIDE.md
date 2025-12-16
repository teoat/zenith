

<!-- Source: CI_CD_STRATEGY.md -->
# 378x492 Fraud Detection - CI/CD Pipeline

This document describes the automated build and deployment pipeline for the 378x492 Fraud Detection desktop application.

## 🚀 CI/CD Overview

The application uses GitHub Actions for continuous integration and deployment with the following workflow:

### 📋 Pipeline Stages

1. **Quality Assurance** - Linting, type checking, testing, and security scanning
2. **Cross-Platform Builds** - Automated builds for macOS, Windows, and Linux
3. **Smoke Testing** - Basic functionality validation of built applications
4. **Release Deployment** - Automated publishing to GitHub Releases

### 🔄 Workflow Triggers

- **Push to main/develop**: Runs full QA and build pipeline
- **Pull Requests**: Runs QA checks only (no builds)
- **Releases**: Triggers production deployment with asset publishing
- **Scheduled**: Daily security scans and dependency updates

## 🛠️ Local Development Setup

### Prerequisites

```bash
# Node.js 20+
node --version  # Should show v20.x.x

# Python 3.12+
python --version  # Should show 3.12.x

# Install dependencies
npm ci
cd backend && pip install -r requirements.txt
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Run linting
npm run type-check      # Run TypeScript checks

# Quality Assurance
npm run lint:fix        # Fix linting issues
npm run test:ci         # Run tests for CI
npm run docs:api        # Generate API documentation
npm run docs:build      # Build documentation
npm run clean           # Clean build artifacts
```

## 🔧 Build Configuration

### Electron Builder Configuration

The build configuration is defined in `electron-builder.json`:

```json
{
  "appId": "com.378x492.fraud-detection",
  "productName": "378x492 Fraud Detection",
  "directories": {
    "output": "release"
  },
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] }
    ]
  },
  "win": {
    "target": "nsis"
  },
  "linux": {
    "target": "AppImage"
  }
}
```

### Platform-Specific Builds

- **macOS**: DMG files for both Intel (x64) and Apple Silicon (arm64)
- **Windows**: NSIS installer (.exe)
- **Linux**: AppImage format

## 🚀 Deployment Process

### Automatic Deployment

1. **Quality Gates**: All tests must pass, security scans must pass
2. **Build Validation**: Smoke tests verify application launches
3. **Asset Generation**: Checksums and build metadata are created
4. **Release Publishing**: Assets uploaded to GitHub Releases

### Manual Deployment

For manual builds:

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:electron -- --mac
npm run build:electron -- --win
npm run build:electron -- --linux
```

## 🔐 Security & Code Signing

### macOS Code Signing

The pipeline includes automated code signing for macOS:

- **Development**: Uses development certificates
- **Production**: Uses Apple Developer Program certificates
- **Notarization**: Automatic notarization with Apple

Required secrets:
- `APPLE_ID`: Apple ID email
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Developer team ID

### Security Scanning

Automated security scans include:

- **NPM Audit**: Dependency vulnerability scanning
- **Snyk**: Advanced vulnerability detection
- **Trivy**: Container and filesystem scanning
- **CodeQL**: Static application security testing

## 📊 Monitoring & Analytics

### Build Metrics

The pipeline collects and reports:

- **Build Times**: Duration of each build stage
- **Test Coverage**: Code coverage percentages
- **Security Issues**: Vulnerability counts and severity
- **Platform Success**: Build success rates by platform

### Error Tracking

- **Build Failures**: Detailed error logs and diagnostics
- **Test Failures**: Failed test identification and reporting
- **Security Alerts**: Automated notifications for vulnerabilities

## 🔄 Release Management

### Semantic Release

The project uses semantic-release for automated versioning:

```json
{
  "branches": ["main", "develop"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

### Release Types

- **Patch** (`0.0.x`): Bug fixes
- **Minor** (`0.x.0`): New features
- **Major** (`x.0.0`): Breaking changes

### Commit Convention

```bash
feat: add new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: testing
chore: maintenance
```

## 🐛 Troubleshooting

### Common Build Issues

#### macOS Code Signing
```bash
# Check certificates
security find-identity -v -p codesigning

# Manual notarization
xcrun notarytool submit "path/to/app.dmg" --keychain-profile "notarytool-password"
```

#### Windows Build Issues
```bash
# Clear electron cache
npx electron-builder install-app-deps --platform=win32
```

#### Linux Dependencies
```bash
# Install required libraries
sudo apt-get install libnss3-dev libatk-bridge2.0-dev libdrm2 libxkbcommon-dev
```

### CI/CD Debugging

#### Local Pipeline Testing
```bash
# Test GitHub Actions locally
npm install -g @zeit/ncc
npx act -j build

# Debug specific jobs
npx act -j quality-check
```

#### Build Artifacts
- Located in `release/` directory
- Checksums in `checksums.txt`
- Build metadata in `build-metadata.json`

## 📈 Performance Optimization

### Build Performance

- **Parallel Jobs**: Separate jobs for each platform
- **Caching**: Dependencies and build artifacts cached
- **Incremental Builds**: Only rebuild changed components

### Runtime Performance

- **Bundle Analysis**: Webpack bundle analyzer integration
- **Code Splitting**: Optimized chunk splitting
- **Compression**: Gzip compression for assets

## 🔗 Integration Points

### External Services

- **GitHub Releases**: Automated release publishing
- **Codecov**: Test coverage reporting
- **Snyk**: Security vulnerability monitoring
- **Trivy**: Container security scanning

### API Endpoints

- **Health Check**: `/health` for connectivity testing
- **Build Status**: Integration with CI status APIs
- **Release Hooks**: Webhooks for deployment notifications

## 📚 Documentation

### Generated Documentation

- **API Docs**: Auto-generated from code comments
- **User Guides**: Markdown-based documentation
- **Changelogs**: Automatically generated release notes

### Documentation Deployment

```bash
# Build and deploy docs
npm run docs:build
npm run docs:deploy
```

## 🎯 Success Metrics

### Quality Metrics
- ✅ **Test Coverage**: > 80% overall coverage
- ✅ **Security Score**: Zero critical vulnerabilities
- ✅ **Build Success Rate**: > 95% success rate
- ✅ **Performance Budget**: Meet all performance targets

### Delivery Metrics
- ✅ **Release Frequency**: Weekly releases
- ✅ **Time to Deploy**: < 30 minutes from commit to release
- ✅ **Platform Coverage**: All target platforms supported
- ✅ **Rollback Capability**: < 5 minutes rollback time

---

## 📞 Support

For CI/CD pipeline issues:

1. Check the [GitHub Actions logs](https://github.com/your-org/fraud-detection-desktop/actions)
2. Review the [troubleshooting guide](#-troubleshooting)
3. Create an issue with build logs and error messages
4. Contact the DevOps team for urgent production issues

**Last Updated**: December 2025

---


<!-- Source: PRODUCTION_DEPLOYMENT.md -->
# Production Deployment Guide
## 378x492 Fraud Detection Platform

> **Last Updated:** 2025-12-09  
> **Version:** 1.0.0  
> **Classification:** Confidential - Deployment Guide

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Application Deployment](#application-deployment)
5. [Database Setup](#database-setup)
6. [Security Validation](#security-validation)
7. [Monitoring Setup](#monitoring-setup)
8. [Backup Configuration](#backup-configuration)
9. [Performance Tuning](#performance-tuning)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### System Requirements

**Minimum Requirements:**
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **CPU**: 4 cores, 2.4GHz+
- **Memory**: 8GB RAM (16GB recommended)
- **Storage**: 50GB free space (SSD recommended)
- **Network**: Stable internet connection

**Recommended Requirements:**
- **OS**: Windows 11, macOS 12+, Ubuntu 20.04+
- **CPU**: 8 cores, 3.0GHz+
- **Memory**: 16GB RAM (32GB for enterprise)
- **Storage**: 100GB free space (NVMe SSD)
- **Network**: Business-grade internet with redundancy

### Software Dependencies

**Required Software:**
- Node.js 18.x or later
- Python 3.11 or later
- Git for version control
- OpenSSL for key generation

**Optional Software:**
- Docker for containerized deployment
- Nginx for reverse proxy
- Redis for external caching
- PostgreSQL for enterprise database

---

## 🌍 Environment Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/378x492/fraud-detection.git
cd fraud-detection

# Verify integrity
git checkout v1.0.0
git tag -v v1.0.0
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Generate Secure Configuration

```bash
# Generate production configuration
npm run setup:production

# This creates:
# - .env.production (secure configuration)
# - DEPLOYMENT_CHECKLIST.md (deployment checklist)
```

### 4. Configure Environment

```bash
# Copy production configuration
cp .env.production .env

# Review and update security values
nano .env  # Or use your preferred editor
```

**Critical Security Values to Update:**
```bash
# MUST be changed from generated defaults
SQLCIPHER_KEY=your-unique-32-character-key-here
MASTER_PASSWORD=your-unique-strong-password-here
IPC_SECRET=your-unique-32-character-secret-here
AUTH_ENCRYPTION_KEY=your-unique-32-character-auth-key-here
```

---

## 🔐 Security Configuration

### 1. Generate Secure Keys

```bash
# Generate SQLCipher key (32+ characters)
openssl rand -hex 32 > sqlcipher.key

# Generate IPC secret (32+ characters)
openssl rand -hex 32 > ipc.secret

# Generate auth key (32+ characters)
openssl rand -hex 32 > auth.key
```

### 2. Set File Permissions

```bash
# Restrict .env file permissions
chmod 600 .env
chmod 600 .env.production

# Restrict key files
chmod 600 sqlcipher.key ipc.secret auth.key

# Set ownership (replace with your user)
chown appuser:appuser .env *.key *.secret
```

### 3. Configure Security Headers

```bash
# Verify CSP configuration
grep -n "Content-Security-Policy" electron/main.js

# Verify security settings
grep -n "nodeIntegration.*false" electron/main.js
grep -n "contextIsolation.*true" electron/main.js
grep -n "sandbox.*true" electron/main.js
```

---

## 🚀 Application Deployment

### 1. Build Application

```bash
# Clean previous builds
npm run clean

# Build frontend
npm run build:frontend

# Build backend (if using PyInstaller)
npm run build:backend

# Build Electron application
npm run build:electron
```

### 2. Package Application

```bash
# Package for all platforms
npm run package

# This creates:
# - release/378x492 Fraud Detection-1.0.0.dmg (macOS)
# - release/378x492 Fraud Detection Setup 1.0.0.exe (Windows)
# - release/378x492 Fraud Detection-1.0.0.AppImage (Linux)

> **Note:** Packaging relies on `electron-builder` configuration. Ensure `build` configuration in `package.json` or `electron-builder.yml` is correctly set up with your App ID (`com.378x492.fraud-detection`) and directories before running this command.
```

### 3. Code Signing (Production)

```bash
# macOS code signing
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Team ID" \
  "release/378x492 Fraud Detection-1.0.0.dmg"

# Windows code signing
signtool sign /f certificate.p12 /p password \
  /t http://timestamp.digicert.com \
  /fd SHA256 "release/378x492 Fraud Detection Setup 1.0.0.exe"
```

### 4. Notarization (macOS)

```bash
# Upload for notarization
xcrun altool --notarize-app \
  --primary-bundle-id "com.378x492.fraud-detection" \
  --username "your-apple-id@example.com" \
  --password "@keychain:AC_PASSWORD" \
  --file "release/378x492 Fraud Detection-1.0.0.dmg"
```

---

## 🗄️ Database Setup

### 1. Initialize Database

```bash
# Create data directory
mkdir -p data/backups
chmod 700 data
chmod 700 data/backups

# Initialize database with encryption
npm run start  # First run creates encrypted database
```

### 2. Run Migrations

```bash
# Database migrations run automatically on startup
# To run manually:
cd backend
python -m alembic upgrade head
```

### 3. Verify Database Security

```bash
# Test database encryption
sqlite3 data/fraud_detection.db \
  "PRAGMA cipher_version;"

# Verify encryption key is required
# Should fail without proper SQLCIPHER_KEY
```

### 4. Configure Backups

```bash
# Test backup system
npm run backup:test

# Configure automated backups
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/app && npm run backup:daily
```

---

## 🔍 Security Validation

### 1. Run Security Tests

```bash
# Quick security check
npm run security:check

# Full security validation
npm run validate:security

# Security integration tests
npm run test:security
```

### 2. Validate Configuration

```bash
# Check for hardcoded secrets
npm run diagnostics:security

# Validate environment configuration
node scripts/validate-security.js --config-only

# Check file permissions
ls -la .env .env.production
```

### 3. Penetration Testing

```bash
# Run security test suite
node tests/test-security-integration.js

# Test specific categories
node tests/test-security-integration.js --category Authentication
node tests/test-security-integration.js --category IPC
node tests/test-security-integration.js --category Database
```

---

## 📊 Monitoring Setup

### 1. Application Monitoring

```bash
# Enable Prometheus metrics
# Set METRICS_ENABLED=true in .env

# Configure metrics port
# Set METRICS_PORT=9090 in .env

# Start application with monitoring
npm start
```

### 2. Log Configuration

```bash
# Configure log level
# Set LOG_LEVEL=info in .env

# Configure structured logging
# Set LOG_FORMAT=json in .env

# Test logging
npm run test:logging
```

### 3. Error Tracking

```bash
# Configure Sentry (optional)
# Set SENTRY_DSN=https://your-sentry-dsn in .env

# Test error reporting
npm run test:sentry
```

### 4. Health Checks

```bash
# Application health endpoint
curl http://localhost:8000/health

# Database health check
curl http://localhost:8000/health/database

# Security health check
curl http://localhost:8000/health/security
```

---

## 💾 Backup Configuration

### 1. Automated Backups

```bash
# Enable backup system
# Set BACKUP_ENABLED=true in .env

# Configure backup interval
# Set BACKUP_INTERVAL_HOURS=24 in .env

# Configure retention
# Set BACKUP_RETENTION_DAYS=30 in .env
```

### 2. Manual Backup

```bash
# Create full backup
npm run backup:full

# Create incremental backup
npm run backup:incremental

# List backups
npm run backup:list
```

### 3. Backup Verification

```bash
# Verify backup integrity
npm run backup:verify

# Test backup restoration
npm run backup:test-restore
```

---

## ⚡ Performance Tuning

### 1. Database Optimization

```bash
# Configure connection pool
# Set DB_POOL_SIZE=10 in .env
# Set DB_MAX_OVERFLOW=20 in .env

# Enable WAL mode
# Set DB_WAL_MODE=true in .env

# Configure cache size
# Set DB_CACHE_SIZE=2000 in .env
```

### 2. Application Performance

```bash
# Configure IPC batch size
# Set IPC_BATCH_SIZE=100 in .env

# Configure rate limiting
# Set RATE_LIMIT_MAX_REQUESTS=1000 in .env

# Enable memory management
# Set MEMORY_CLEANUP_INTERVAL=300000 in .env
```

### 3. System Optimization

```bash
# Configure file descriptors
ulimit -n 65536

# Optimize TCP settings
echo 'net.core.somaxconn = 65536' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65536' >> /etc/sysctl.conf

# Apply system settings
sysctl -p
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptoms:**
- Application crashes on startup
- Database connection errors
- Security configuration errors

**Solutions:**
```bash
# Check configuration
npm run validate:security

# Check database permissions
ls -la data/

# Check environment variables
env | grep -E "(SQLCIPHER|MASTER_PASSWORD|IPC_SECRET)"
```

#### 2. Authentication Failures

**Symptoms:**
- Cannot login with valid credentials
- Session management errors
- IPC communication failures

**Solutions:**
```bash
# Test authentication system
npm run test:security --category Authentication

# Check IPC configuration
npm run test:security --category IPC

# Verify session manager
node tests/test-security-integration.js --category Session
```

#### 3. Performance Issues

**Symptoms:**
- Slow application response
- High memory usage
- Database timeouts

**Solutions:**
```bash
# Check system resources
npm run diagnostics:system

# Monitor performance
npm run diagnostics:performance

# Optimize database
npm run optimize:database
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export NODE_ENV=development

# Start with debugging
npm run start:debug
```

### Log Analysis

```bash
# View application logs
tail -f logs/fraud_detection_app.log

# View security events
grep "SECURITY" logs/fraud_detection_app.log

# View performance metrics
grep "METRIC" logs/fraud_detection_app.log
```

### Getting Help

**Documentation:**
- [Security Guide](security/SECURITY_GUIDE.md)
- [API Documentation](API.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

**Support:**
- Email: support@378x492.com
- Documentation: https://docs.378x492.com
- Issues: https://github.com/378x492/fraud-detection/issues

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Security configuration generated and reviewed
- [ ] All default values replaced with unique values
- [ ] File permissions set correctly (600 for sensitive files)
- [ ] Code signing certificates obtained
- [ ] Backup system configured
- [ ] Monitoring system configured
- [ ] Security tests passed
- [ ] Performance benchmarks met

### Post-Deployment

- [ ] Application starts successfully
- [ ] Database encryption working
- [ ] Authentication system functional
- [ ] IPC communication secure
- [ ] File encryption/decryption working
- [ ] Session management operational
- [ ] Rate limiting active
- [ ] Monitoring data flowing
- [ ] Backup system working
- [ ] Health checks passing

### Validation

- [ ] Full security test suite passes
- [ ] Performance benchmarks met
- [ ] Load testing successful
- [ ] Penetration testing clean
- [ ] Compliance audit passed

---

## 📞 Emergency Contacts

### Security Incidents

**24/7 Security Hotline:**
- Phone: [Security Team Phone]
- Email: security@378x492.com
- Slack: #security-incidents

**Escalation:**
- Level 1: Security Team
- Level 2: Security Lead
- Level 3: CISO
- Level 4: Executive Team

### Technical Support

**Production Support:**
- Email: support@378x492.com
- Documentation: https://docs.378x492.com
- Status Page: https://status.378x492.com

---

## 📚 Additional Resources

### Documentation

- [Security Architecture](security/SECURITY_GUIDE.md)
- [API Reference](API.md)
- [User Guide](user-guides/basic-usage.md)
- [Troubleshooting](TROUBLESHOOTING.md)

### Tools

- [Security Validation](scripts/validate-security.js)
- [Production Setup](scripts/setup-production.js)
- [Diagnostics](diagnostic-orchestrator.js)
- [Security Tests](tests/test-security-integration.js)

### Training

- [Security Awareness](training/user-security.md)
- [Developer Security](training/developer-security.md)
- [Incident Response](training/incident-response.md)

---

**Document Classification:** CONFIDENTIAL  
**Distribution:** Need-to-know basis  
**Next Review:** 2026-12-09  

---

*This deployment guide is part of the 378x492 Fraud Detection documentation suite. For the latest version, check the official documentation repository.*

---


<!-- Source: README.md -->
# Deployment Guide - Electron Desktop Application

**Last Updated**: December 8, 2025  
**Platform**: Electron desktop app for macOS, Windows, and Linux

> **Note**: This guide covers packaging and distributing the Electron desktop application. For development setup, see [Onboarding Guide](ONBOARDING.md).

---

## 📋 Prerequisites

### Development Environment
- **Node.js** 20+ (for Electron and React frontend)
- **Python** 3.12+ (for FastAPI backend, bundled in production)
- **macOS** (for macOS builds), **Windows** (for Windows builds), or **Linux** (for Linux builds)
- **Code Signing Certificates** (for production releases)

### Build Tools
- `electron-builder` (installed via npm)
- `PyInstaller` or `cx_Freeze` (for bundling Python backend)
- Platform-specific tools:
  - macOS: Xcode command line tools
  - Windows: Visual Studio Build Tools
  - Linux: Standard build tools (`build-essential`)

---

## 🏗️ Build Configuration

### Electron Builder Configuration

**File**: `electron-builder.json` or `package.json`

```json
{
  "appId": "com.378x492.frauddetection",
  "productName": "378x492 Fraud Detection",
  "directories": {
    "output": "release",
    "buildResources": "build"
  },
  "files": [
    "frontend/dist/**/*",
    "electron/**/*",
    "backend-dist/**/*"
  ],
  "mac": {
    "category": "public.app-category.finance",
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entit lementsInherit": "build/entitlements.mac.plist"
  },
  "dmg": {
    "title": "378x492 Fraud Detection",
    "icon": "build/icon.icns",
    "background": "build/dmg-background.png",
    "window": {
      "width": 540,
      "height": 380
    }
  },
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico",
    "certificateFile": "certs/windows-code-signing.pfx",
    "certificatePassword": "${WINDOWS_CERT_PASSWORD}"
  },
  "linux": {
    "target": ["AppImage", "deb", "rpm"],
    "icon": "build/icon.png",
    "category": "Office",
    "synopsis": "Financial fraud detection desktop application"
  }
}
```

---

## 📦 Building the Application

### Step 1: Build Frontend

```bash
cd frontend
npm install
npm run build  # Creates frontend/dist/
```

### Step 2: Bundle Python Backend

```bash
cd backend
pip install pyinstaller
pyinstaller --onedir --name 378x492-backend main.py

# Or use spec file
pyinstaller pyinstaller.spec

# Output: backend/dist/378x492-backend/
```

### Step 3: Copy Backend to Electron Project

```bash
mkdir -p backend-dist
cp -r backend/dist/378x492-backend backend-dist/
```

### Step 4: Build Electron App

```bash
# Build for current platform
npm run electron:build

# Build for specific platform
npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows
npm run electron:build:linux  # Linux

# Build for all platforms (requires macOS, Windows, Linux)
npm run electron:build:all
```

**Output**: Installers in `release/` directory

---

## 🔐 Code Signing

### macOS Code Signing

**Requirements**:
- Apple Developer Account ($99/year)
- Developer ID Application certificate

**Steps**:
1. **Generate Certificate Signing Request (CSR)**
   ```bash
   # In Keychain Access: Certificate Assistant → Request Certificate from CA
   ```

2. **Download Developer ID Certificate**
   - Sign in to Apple Developer portal
   - Certificates → Create → Developer ID Application
   - Download and install in Keychain

3. **Configure electron-builder**
   ```json
   {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAMID)"
     }
   }
   ```

4. **Sign the App**
   ```bash
   # Automatic via electron-builder
   CSC_LINK=certs/mac-developer-id.p12 \
   CSC_KEY_PASSWORD=your-password \
   npm run electron:build:mac
   ```

5. **Notarize with Apple**
   ```bash
   # Automatic via electron-builder
   APPLE_ID=your@email.com \
   APPLE_ID_PASSWORD=app-specific-password \
   APPLE_TEAM_ID=TEAMID \
   npm run electron:build:mac
   ```

### Windows Code Signing

**Requirements**:
- Code Signing Certificate from trusted CA (DigiCert, Comodo, etc.)

**Steps**:
1. **Obtain Certificate** (.pfx file)

2. **Configure electron-builder**
   ```json
   {
     "win": {
       "certificateFile": "certs/windows-code-signing.pfx",
       "certificatePassword": "${WINDOWS_CERT_PASSWORD}"
     }
   }
   ```

3. **Sign the App**
   ```bash
   WINDOWS_CERT_PASSWORD=your-password npm run electron:build:win
   ```

### Linux Packaging (No Code Signing Required)

```bash
npm run electron:build:linux
```

---

## 🚀 Distribution

### Release Channels

**Stable**: Production releases (v1.0.0, v1.1.0, etc.)  
**Beta**: Pre-release testing (v1.1.0-beta.1)  
**Dev**: Development builds (v1.1.0-dev.20241208)

### Auto-Update Server

**Option 1: GitHub Releases** (Free, recommended)

1. **Create GitHub Release**
   ```bash
   gh release create v1.0.0 \
     "release/378x492 Fraud Detection-1.0.0.dmg" \
     "release/378x492 Fraud Detection Setup 1.0.0.exe" \
     "release/378x492 Fraud Detection-1.0.0.AppImage"
   ```

2. **Configure electron-updater**
   ```javascript
   // electron/main.js
   const { autoUpdater } = require('electron-updater');
   
   autoUpdater.setFeedURL({
     provider: 'github',
     owner: 'your-org',
     repo: '378x492'
   });
   
   autoUpdater.checkForUpdatesAndNotify();
   ```

**Option 2: Custom Update Server**

1. **Set up update server** (AWS S3, Azure Blob, or custom)

2. **Configure electron-updater**
   ```javascript
   autoUpdater.setFeedURL({
     provider: 'generic',
     url: 'https://updates.378x492.com'
   });
   ```

---

## ✅ Production Checklist

### Pre-Release
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite
- [ ] Build for all platforms (macOS, Windows, Linux)
- [ ] Code sign all builds
- [ ] Notarize macOS build
- [ ] Test installers on clean VMs

### Security
- [ ] Verify SQLCipher encryption works
- [ ] Test master password flow
- [ ] Verify file encryption
- [ ] Check IPC security (no XSS/injection)
- [ ] Audit dependencies (`npm audit`, `pip-audit`)

### Performance
- [ ] Measure app startup time (< 3 seconds)
- [ ] Check memory usage (< 500MB idle)
- [ ] Test with large databases (10,000+ cases)
- [ ] Verify offline functionality

### Distribution
- [ ] Upload to update server (GitHub Releases or custom)
- [ ] Update website download links
- [ ] Prepare release notes
- [ ] Notify users (email, in-app notification)

---

## 🔧 Troubleshooting

### Build Fails

**Issue**: `electron-builder` fails with permission error

**Solution**:
```bash
# macOS/Linux
chmod +x electron/main.js
chmod +x backend-dist/378x492-backend

# Check build logs
DEBUG=electron-builder npm run electron:build
```

### Code Signing Fails

**macOS**:
```bash
# Verify certificate
security find-identity -v -p codesigning

# Check entitlements
codesign -d --entitlements :- /path/to/378x492.app
```

**Windows**:
```bash
# Verify certificate
certutil -dump your-cert.pfx
```

### App Won't Launch

**Check logs**:
- macOS: `~/Library/Logs/378x492/`
- Windows: `%APPDATA%\378x492\logs\`
- Linux: `~/.config/378x492/logs/`

**Common issues**:
- Missing Python backend bundle
- SQLCipher library not found
- Permissions error (macOS Gatekeeper)

---

## 📊 Monitoring Deployment

### Update Adoption Tracking

```javascript
// electron/main.js
const { analytics } = require('./analytics');

autoUpdater.on('update-downloaded', () => {
  analytics.track('update_downloaded', {
    version: app.getVersion(),
    platform: process.platform
  });
});
```

### Error Tracking

```javascript
// electron/main.js
const Sentry = require('@sentry/electron');

Sentry.init({
  dsn: 'https://your-sentry-dsn',
  environment: process.env.NODE_ENV
});
```

---

## 📚 Additional Resources

- [electron-builder Documentation](https://www.electron.build/)
- [Electron Auto-Update Guide](https://www.electronjs.org/docs/latest/api/auto-updater)
- [macOS Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool)

---

**For development setup, see**: [Onboarding Guide](ONBOARDING.md)  
**For user installation help, see**: [user-guides/installation.md](user-guides/installation.md)


---


<!-- Source: TROUBLESHOOTING_DEPLOYMENT.md -->
# Troubleshooting Guide (Deployment)

**Change impact (keep in sync):**
- Update related user-facing guidance in `docs/guides/TROUBLESHOOTING_USER.md` when flows change.
- Keep health/ops scripts aligned with deployment docs (`docs/deployment/README.md`) and monitoring guidance (`docs/monitoring/IMPLEMENTATION.md` once created).
- After edits, rerun docs link check; preserve archival copy if moved.

This comprehensive guide covers common issues, diagnostic procedures, and resolution steps for 378x492 Fraud Detection system issues.

## 📋 Table of Contents

- [System Health Checks](#-system-health-checks)
- [Common Issues & Solutions](#-common-issues--solutions)
- [Performance Issues](#-performance-issues)
- [Database Issues](#-database-issues)
- [Security Issues](#-security-issues)
- [Integration Issues](#-integration-issues)
- [Diagnostic Tools](#-diagnostic-tools)
- [Support Procedures](#-support-procedures)

## 🏥 System Health Checks

### Quick Health Assessment

#### System Status Check
```bash
# Check overall system health
curl -s http://localhost:8000/health | jq .

# Check application logs
tail -f /opt/378x492/logs/application.log

# Check system resources
top -b -n 1 | head -20

# Check disk space
df -h /opt/378x492

# Check database connectivity
sqlite3 /opt/378x492/data/378x492.db "SELECT COUNT(*) FROM cases;"
```

#### Component Health Verification
- **Database**: Connection, integrity, performance
- **File System**: Permissions, space, corruption
- **Network**: Connectivity, latency, firewall rules
- **Memory**: Usage, leaks, swap activity
- **CPU**: Utilization, bottlenecks, threading

### Automated Diagnostics

#### Health Check Script
```bash
#!/bin/bash
# 378x492 Health Check Script

echo "=== 378x492 Health Check ==="
echo "Timestamp: $(date)"

# Application health
echo -e "\n1. Application Health:"
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✓ Application responding"
else
    echo "✗ Application not responding"
fi

# Database health
echo -e "\n2. Database Health:"
if sqlite3 /opt/378x492/data/378x492.db "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database accessible"
else
    echo "✗ Database not accessible"
fi

# File system health
echo -e "\n3. File System Health:"
if [ -w /opt/378x492/evidence ] && [ -r /opt/378x492/evidence ]; then
    echo "✓ Evidence directory accessible"
else
    echo "✗ Evidence directory not accessible"
fi

# Resource usage
echo -e "\n4. Resource Usage:"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h /opt/378x492 | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"

echo -e "\n=== Health Check Complete ==="
```

## 🚨 Common Issues & Solutions

### Application Won't Start

#### Symptoms
- Application fails to launch
- Error messages during startup
- System tray icon not visible
- Web interface inaccessible

#### Diagnostic Steps
1. **Check System Requirements**:
   ```bash
   # Check available memory
   free -h

   # Check disk space
   df -h /opt/378x492

   # Check running processes
   ps aux | grep 378x492
   ```

2. **Review Startup Logs**:
   ```bash
   # Check application logs
   tail -100 /opt/378x492/logs/application.log

   # Check system logs
   journalctl -u 378x492 -n 50
   ```

3. **Verify Configuration**:
   ```bash
   # Check configuration files
   ls -la /opt/378x492/config/

   # Validate configuration syntax
   cat /opt/378x492/config/app.json | jq .
   ```

#### Resolution Steps
1. **Restart Application**:
   ```bash
   sudo systemctl restart 378x492
   ```

2. **Clear Cache**:
   ```bash
   rm -rf /opt/378x492/cache/*
   sudo systemctl restart 378x492
   ```

3. **Reinstall Application**:
   ```bash
   sudo apt-get remove 378x492
   sudo apt-get install 378x492
   ```

### Login Failures

#### Symptoms
- Users cannot authenticate
- Password reset not working
- Account lockouts
- MFA issues

#### Diagnostic Steps
1. **Check Authentication Logs**:
   ```bash
   grep "authentication" /opt/378x492/logs/security.log | tail -20
   ```

2. **Verify User Account**:
   ```bash
   # Check user status in database
   sqlite3 /opt/378x492/data/378x492.db "SELECT username, status, locked FROM users WHERE username = 'problem_user';"
   ```

3. **Test Authentication Service**:
   ```bash
   # Test local authentication
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

#### Resolution Steps
1. **Unlock Account**:
   ```sql
   UPDATE users SET locked = 0, failed_attempts = 0 WHERE username = 'problem_user';
   ```

2. **Reset Password**:
   ```bash
   # Generate password reset token
   curl -X POST http://localhost:8000/api/v1/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"email":"user@company.com"}'
   ```

3. **Check MFA Settings**:
   ```bash
   # Disable MFA temporarily for troubleshooting
   sqlite3 /opt/378x492/data/378x492.db "UPDATE users SET mfa_enabled = 0 WHERE username = 'problem_user';"
   ```

### File Upload Issues

#### Symptoms
- Evidence files won't upload
- Upload progress stalls
- File corruption errors
- Size limit errors

#### Diagnostic Steps
1. **Check File Permissions**:
   ```bash
   ls -la /opt/378x492/evidence/
   ```

2. **Verify Upload Limits**:
   ```bash
   # Check configuration
   grep "max_file_size" /opt/378x492/config/app.json
   ```

3. **Test File System**:
   ```bash
   # Test write permissions
   touch /opt/378x492/evidence/test.txt && rm /opt/378x492/evidence/test.txt && echo "Write OK"
   ```

4. **Check Network**:
   ```bash
   # Test upload endpoint
   curl -X POST http://localhost:8000/api/v1/evidence/upload \
     -F "file=@test.pdf"
   ```

#### Resolution Steps
1. **Fix Permissions**:
   ```bash
   chown -R 378x492:378x492 /opt/378x492/evidence/
   chmod 755 /opt/378x492/evidence/
   ```

2. **Increase Limits**:
   ```json
   {
     "upload": {
       "max_file_size": "100MB",
       "max_files_per_upload": 10
     }
   }
   ```

3. **Clear Upload Cache**:
   ```bash
   rm -rf /opt/378x492/uploads/temp/*
   ```

## ⚡ Performance Issues

### Slow Application Response

#### Symptoms
- Slow page loads
- Delayed API responses
- High CPU usage
- Memory exhaustion

#### Diagnostic Steps
1. **Monitor System Resources**:
   ```bash
   # CPU usage
   top -b -n 1 | grep "Cpu(s)"

   # Memory usage
   free -h

   # Disk I/O
   iostat -x 1 5
   ```

2. **Check Application Performance**:
   ```bash
   # Response time monitoring
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/health

   # Database query performance
   sqlite3 /opt/378x492/data/378x492.db ".timer on" "SELECT COUNT(*) FROM cases;"
   ```

3. **Analyze Logs**:
   ```bash
   # Find slow requests
   grep "response_time" /opt/378x492/logs/performance.log | sort -k3 -n | tail -10
   ```

#### Resolution Steps
1. **Optimize Database**:
   ```sql
   VACUUM;
   REINDEX;
   ANALYZE;
   ```

2. **Increase Resources**:
   ```bash
   # Add more memory
   sudo sed -i 's/NodeOptions=.*/NodeOptions=--max-old-space-size=4096/' /opt/378x492/config/app.conf
   ```

3. **Enable Caching**:
   ```json
   {
     "cache": {
       "enabled": true,
       "ttl": 3600,
       "max_size": "2GB"
     }
   }
   ```

### High Memory Usage

#### Symptoms
- Memory leaks
- Out of memory errors
- System slowdown
- Application crashes

#### Diagnostic Steps
1. **Monitor Memory Usage**:
   ```bash
   # Process memory
   ps aux --sort=-%mem | head -10

   # Memory over time
   free -h -s 5 -c 12
   ```

2. **Check for Leaks**:
   ```bash
   # Heap dump (if available)
   jmap -dump:live,format=b,file=heap.bin $(pgrep 378x492)

   # Memory profiling
   curl http://localhost:8000/debug/memory
   ```

#### Resolution Steps
1. **Restart Application**:
   ```bash
   sudo systemctl restart 378x492
   ```

2. **Configure Memory Limits**:
   ```bash
   # Set memory limits
   echo "378x492 soft memlock 2G" >> /etc/security/limits.conf
   echo "378x492 hard memlock 2G" >> /etc/security/limits.conf
   ```

3. **Optimize Garbage Collection**:
   ```json
   {
     "node": {
       "gc_interval": 30000,
       "max_old_space_size": 2048
     }
   }
   ```

## 🗄️ Database Issues

### Database Connection Failures

#### Symptoms
- "Database connection failed" errors
- Application startup failures
- Query timeouts
- Corrupted data errors

#### Diagnostic Steps
1. **Test Database Connection**:
   ```bash
   # Test basic connectivity
   sqlite3 /opt/378x492/data/378x492.db "SELECT 1;"

   # Check database file
   ls -la /opt/378x492/data/378x492.db
   ```

2. **Check Database Integrity**:
   ```sql
   PRAGMA integrity_check;
   PRAGMA foreign_key_check;
   ```

3. **Review Database Logs**:
   ```bash
   tail -50 /opt/378x492/logs/database.log
   ```

#### Resolution Steps
1. **Repair Database**:
   ```bash
   # Create backup first
   cp /opt/378x492/data/378x492.db /opt/378x492/data/378x492.db.backup

   # Repair database
   sqlite3 /opt/378x492/data/378x492.db ".recover" | sqlite3 /opt/378x492/data/378x492.db.repaired
   ```

2. **Restore from Backup**:
   ```bash
   # Stop application
   sudo systemctl stop 378x492

   # Restore backup
   cp /opt/378x492/backup/378x492.db /opt/378x492/data/378x492.db

   # Start application
   sudo systemctl start 378x492
   ```

### Query Performance Issues

#### Symptoms
- Slow database queries
- Application timeouts
- High CPU usage on database

#### Diagnostic Steps
1. **Analyze Query Performance**:
   ```sql
   .timer on
   EXPLAIN QUERY PLAN SELECT * FROM cases WHERE status = 'open';
   ```

2. **Check Indexes**:
   ```sql
   .indexes
   .schema cases
   ```

3. **Monitor Query Logs**:
   ```bash
   grep "slow query" /opt/378x492/logs/database.log
   ```

#### Resolution Steps
1. **Add Missing Indexes**:
   ```sql
   CREATE INDEX idx_cases_status ON cases(status);
   CREATE INDEX idx_cases_assignee ON cases(assignee_id);
   CREATE INDEX idx_evidence_case_id ON evidence(case_id);
   ```

2. **Optimize Queries**:
   ```sql
   -- Use prepared statements
   -- Add LIMIT clauses
   -- Use appropriate JOIN types
   ```

3. **Update Statistics**:
   ```sql
   ANALYZE;
   ```

## 🔒 Security Issues

### Authentication Problems

#### Symptoms
- Unauthorized access attempts
- Brute force attacks
- Session hijacking
- Privilege escalation

#### Diagnostic Steps
1. **Check Security Logs**:
   ```bash
   grep "security" /opt/378x492/logs/security.log | tail -20
   ```

2. **Review Access Patterns**:
   ```bash
   # Failed login attempts
   grep "failed login" /opt/378x492/logs/security.log | wc -l

   # Suspicious IP addresses
   grep "login" /opt/378x492/logs/security.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10
   ```

#### Resolution Steps
1. **Enable Account Lockout**:
   ```json
   {
     "security": {
       "max_failed_attempts": 5,
       "lockout_duration": 900
     }
   }
   ```

2. **Implement IP Whitelisting**:
   ```json
   {
     "security": {
       "allowed_ips": ["192.168.1.0/24", "10.0.0.0/8"]
     }
   }
   ```

3. **Enable Audit Logging**:
   ```json
   {
     "logging": {
       "audit_enabled": true,
       "audit_retention": "1year"
     }
   }
   ```

### Data Encryption Issues

#### Symptoms
- Decryption failures
- Corrupted encrypted data
- Key management problems
- Certificate expiration

#### Diagnostic Steps
1. **Test Encryption**:
   ```bash
   # Test database encryption
   sqlite3 /opt/378x492/data/378x492.db "PRAGMA cipher_integrity_check;"

   # Test file encryption
   openssl enc -d -aes-256-cbc -in test.enc -out test.dec
   ```

2. **Check Key Status**:
   ```bash
   # Check key file permissions
   ls -la /opt/378x492/keys/

   # Verify key integrity
   sha256sum /opt/378x492/keys/master.key
   ```

#### Resolution Steps
1. **Rotate Encryption Keys**:
   ```bash
   # Generate new key
   openssl rand -hex 32 > new_master.key

   # Update configuration
   sed -i 's|master_key:.*|master_key: new_master.key|' /opt/378x492/config/security.json
   ```

2. **Re-encrypt Data**:
   ```bash
   # Re-encrypt database
   378x492-cli reencrypt-database

   # Re-encrypt files
   find /opt/378x492/evidence -name "*.enc" -exec 378x492-cli reencrypt-file {} \;
   ```

## 🔗 Integration Issues

### API Connectivity Problems

#### Symptoms
- API call failures
- Timeout errors
- Authentication failures
- Data synchronization issues

#### Diagnostic Steps
1. **Test API Endpoints**:
   ```bash
   # Test basic connectivity
   curl -v http://localhost:8000/api/v1/health

   # Test authentication
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

2. **Check API Logs**:
   ```bash
   tail -50 /opt/378x492/logs/api.log
   ```

3. **Verify Configuration**:
   ```bash
   cat /opt/378x492/config/api.json | jq .
   ```

#### Resolution Steps
1. **Fix API Configuration**:
   ```json
   {
     "api": {
       "host": "localhost",
       "port": 8000,
       "ssl": true,
       "timeout": 30
     }
   }
   ```

2. **Update API Keys**:
   ```bash
   # Generate new API key
   openssl rand -hex 32

   # Update configuration
   sed -i 's|api_key:.*|api_key: new_key|' /opt/378x492/config/api.json
   ```

3. **Restart API Service**:
   ```bash
   sudo systemctl restart 378x492-api
   ```

### External Service Integration

#### Symptoms
- Third-party service failures
- Synchronization errors
- Data import/export issues
- Webhook delivery failures

#### Diagnostic Steps
1. **Test External Connections**:
   ```bash
   # Test email service
   curl -X POST https://api.sendgrid.com/v3/mail/send \
     -H "Authorization: Bearer $SENDGRID_API_KEY" \
     -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@company.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'

   # Test cloud storage
   aws s3 ls s3://378x492-backup/
   ```

2. **Check Integration Logs**:
   ```bash
   grep "integration" /opt/378x492/logs/application.log | tail -20
   ```

#### Resolution Steps
1. **Update API Credentials**:
   ```bash
   # Update environment variables
   export SENDGRID_API_KEY="new_key"
   export AWS_ACCESS_KEY_ID="new_key"
   ```

2. **Fix Webhook Configuration**:
   ```json
   {
     "webhooks": {
       "url": "https://webhook.site/test",
       "secret": "webhook_secret",
       "retry_attempts": 3
     }
   }
   ```

3. **Test Integration**:
   ```bash
   # Test email integration
   378x492-cli test-email

   # Test cloud storage
   378x492-cli test-s3
   ```

## 🔧 Diagnostic Tools

### Built-in Diagnostics

#### System Diagnostics
```bash
# Run full system diagnostic
378x492-cli diagnostics

# Check configuration
378x492-cli config validate

# Test database
378x492-cli db check

# Test network
378x492-cli network test
```

#### Performance Diagnostics
```bash
# Performance profiling
378x492-cli profile start
# Run application tests
378x492-cli profile stop

# Memory analysis
378x492-cli memory analyze

# CPU profiling
378x492-cli cpu profile
```

### External Tools

#### Network Diagnostics
```bash
# Test connectivity
ping -c 4 localhost

# Check ports
netstat -tlnp | grep 8000

# DNS resolution
nslookup api.378x492.com

# SSL certificate
openssl s_client -connect api.378x492.com:443
```

#### System Monitoring
```bash
# System resource monitoring
htop

# Network monitoring
iftop

# Disk I/O monitoring
iotop

# Process monitoring
ps aux --forest
```

## 📞 Support Procedures

### Support Ticket Creation

#### Information to Include
1. **System Information**:
   - 378x492 version
   - Operating system and version
   - Hardware specifications
   - Network configuration

2. **Issue Description**:
   - Detailed problem description
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and codes

3. **Diagnostic Data**:
   - Application logs
   - System logs
   - Configuration files
   - Diagnostic output

#### Support Channels
- **Email Support**: support@378x492.com
- **Phone Support**: 1-800-SIMPLE378 (business hours)
- **Emergency Support**: 1-800-SIMPLE911 (24/7)
- **Community Forum**: forum.378x492.com

### Escalation Procedures

#### Severity Levels
- **Critical**: System down, data loss, security breach
- **High**: Major functionality broken, performance issues
- **Medium**: Minor functionality issues, usability problems
- **Low**: Questions, feature requests, documentation issues

#### Response Times
- **Critical**: 1 hour initial response, 4 hours resolution
- **High**: 4 hours initial response, 24 hours resolution
- **Medium**: 24 hours initial response, 72 hours resolution
- **Low**: 48 hours initial response, 1 week resolution

### Self-Service Resources

#### Knowledge Base
- **Documentation**: Comprehensive online documentation
- **Video Tutorials**: Step-by-step video guides
- **FAQ**: Frequently asked questions
- **Troubleshooting Guides**: Issue-specific resolution guides

#### Community Resources
- **User Forum**: Peer-to-peer support and discussions
- **GitHub Issues**: Bug reports and feature requests
- **Release Notes**: Latest updates and known issues
- **Roadmap**: Future development plans

---

**Troubleshooting complete!** For Electron packaging guidance, continue with the [Deployment Guide](../DEPLOYMENT.md).

---


<!-- Source: backup-recovery.md -->
# Backup & Recovery Guide

This comprehensive guide covers data backup strategies, disaster recovery procedures, and business continuity planning for 378x492 Fraud Detection.

## 📋 Table of Contents

- [Backup Strategy](#-backup-strategy)
- [Automated Backup Configuration](#-automated-backup-configuration)
- [Manual Backup Procedures](#-manual-backup-procedures)
- [Recovery Procedures](#-recovery-procedures)
- [Disaster Recovery Planning](#-disaster-recovery-planning)
- [Data Validation & Testing](#-data-validation--testing)
- [Compliance & Auditing](#-compliance--auditing)
- [Best Practices](#-best-practices)

## 📦 Backup Strategy

### Backup Types

#### Full Backups
**Complete System Backup**
- **Database**: Complete SQLCipher encrypted database
- **File Storage**: All evidence files and documents
- **Configuration**: System settings and user preferences
- **Application**: Application binaries and dependencies

**Schedule**: Weekly (Sunday 2:00 AM)
**Retention**: 4 weeks rolling retention
**Storage**: Primary backup location

#### Incremental Backups
**Changes Since Last Backup**
- **Database Changes**: Transaction logs and modifications
- **New Files**: Recently uploaded evidence
- **Configuration Changes**: Setting modifications
- **Log Files**: Application and system logs

**Schedule**: Daily (2:00 AM, Monday-Saturday)
**Retention**: 30 days rolling retention
**Storage**: Primary backup location

#### Differential Backups
**Changes Since Last Full Backup**
- **Database**: All changes since last full backup
- **Files**: All new/modified files since last full backup
- **Settings**: All configuration changes since last full backup

**Schedule**: Daily (2:00 AM)
**Retention**: 7 days rolling retention
**Storage**: Secondary backup location

### Backup Storage Strategy

#### Primary Storage
- **Local Storage**: Encrypted local/network storage
- **Retention**: 90 days active retention
- **Access**: Immediate access for recovery
- **Encryption**: AES-256 encryption at rest

#### Secondary Storage
- **Offsite Storage**: Cloud storage (AWS S3, Azure Blob)
- **Retention**: 1 year long-term retention
- **Access**: Within 4 hours for recovery
- **Encryption**: Client-side encryption

#### Archive Storage
- **Long-term Archive**: Tape or cold storage
- **Retention**: 7 years regulatory retention
- **Access**: Within 24 hours for recovery
- **Encryption**: AES-256 with key management

## ⚙️ Automated Backup Configuration

### Backup Scheduling

#### Cron-based Scheduling
```bash
# Full backup - Weekly Sunday 2:00 AM
0 2 * * 0 /opt/378x492/bin/backup.sh full

# Incremental backup - Daily 2:00 AM (Mon-Sat)
0 2 * * 1-6 /opt/378x492/bin/backup.sh incremental

# Configuration backup - After changes
*/5 * * * * /opt/378x492/bin/backup.sh config
```

#### Backup Script Configuration
```bash
#!/bin/bash
# 378x492 Backup Script

BACKUP_TYPE=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/378x492"
RETENTION_DAYS=30

case $BACKUP_TYPE in
    "full")
        # Full system backup
        /opt/378x492/bin/backup-full.sh $TIMESTAMP
        ;;
    "incremental")
        # Incremental backup
        /opt/378x492/bin/backup-incremental.sh $TIMESTAMP
        ;;
    "config")
        # Configuration backup
        /opt/378x492/bin/backup-config.sh $TIMESTAMP
        ;;
esac

# Cleanup old backups
find $BACKUP_DIR -name "*.bak" -mtime +$RETENTION_DAYS -delete
```

### Backup Verification

#### Automated Verification
- **Integrity Checks**: SHA-256 checksum validation
- **Completeness Checks**: File count and size verification
- **Encryption Validation**: Decryption testing
- **Database Consistency**: SQLCipher integrity checks

#### Verification Reports
```json
{
  "backup_id": "backup_20251208_020000",
  "type": "full",
  "status": "completed",
  "verification": {
    "integrity_check": "passed",
    "file_count": 15420,
    "total_size": "2.3GB",
    "encryption_test": "passed",
    "database_check": "passed"
  },
  "duration": "45 minutes",
  "timestamp": "2025-12-08T02:00:00Z"
}
```

### Backup Monitoring

#### Success Monitoring
- **Backup Completion**: Automated success confirmation
- **Size Validation**: Expected vs actual backup size
- **Duration Tracking**: Backup time monitoring
- **Error Detection**: Failure notification and alerting

#### Failure Handling
- **Retry Logic**: Automatic retry on transient failures
- **Escalation**: Alert escalation for persistent failures
- **Manual Intervention**: Notification to backup administrators
- **Recovery Procedures**: Alternative backup methods

## 🔧 Manual Backup Procedures

### Emergency Backup

#### Immediate Full Backup
1. **Stop Application** (if possible):
   ```bash
   sudo systemctl stop 378x492
   ```

2. **Create Backup Directory**:
   ```bash
   mkdir -p /emergency_backup/$(date +%Y%m%d_%H%M%S)
   cd /emergency_backup/$(date +%Y%m%d_%H%M%S)
   ```

3. **Database Backup**:
   ```bash
   sqlite3 /opt/378x492/data/378x492.db ".backup 378x492.db.bak"
   ```

4. **File System Backup**:
   ```bash
   cp -r /opt/378x492/evidence ./evidence/
   cp -r /opt/378x492/config ./config/
   ```

5. **Compress and Encrypt**:
   ```bash
   tar -czf emergency_backup.tar.gz .
   openssl enc -aes-256-cbc -salt -in emergency_backup.tar.gz -out emergency_backup.enc
   ```

#### Configuration Backup
```bash
# Backup all configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz /opt/378x492/config/

# Backup environment variables
env | grep SIMPLE378 > 378x492_env_$(date +%Y%m%d).txt
```

### Partial Backups

#### Case-Specific Backup
```bash
# Backup specific case data
CASE_ID="case-123"
mkdir -p case_backup_$CASE_ID

# Export case from database
sqlite3 /opt/378x492/data/378x492.db << EOF
.output case_backup_$CASE_ID/case_data.sql
.dump cases WHERE id = '$CASE_ID';
.dump evidence WHERE case_id = '$CASE_ID';
.quit
EOF

# Copy evidence files
cp -r /opt/378x492/evidence/$CASE_ID case_backup_$CASE_ID/
```

#### Evidence-Only Backup
```bash
# Backup only evidence files
rsync -avz --delete /opt/378x492/evidence/ /backup/evidence_only/
```

## 🔄 Recovery Procedures

### Full System Recovery

#### Recovery Prerequisites
- **Backup Media**: Access to valid backup files
- **System Access**: Administrative access to recovery environment
- **Encryption Keys**: Database and file encryption keys
- **System Documentation**: Recovery procedures and configurations

#### Step-by-Step Recovery
1. **Prepare Recovery Environment**:
   ```bash
   # Install 378x492 on recovery system
   sudo apt-get install 378x492-server

   # Create recovery directory
   mkdir -p /recovery/378x492
   cd /recovery/378x492
   ```

2. **Decrypt and Extract Backup**:
   ```bash
   # Decrypt backup archive
   openssl enc -d -aes-256-cbc -in full_backup.enc -out full_backup.tar.gz

   # Extract backup files
   tar -xzf full_backup.tar.gz
   ```

3. **Database Recovery**:
   ```bash
   # Restore database
   cp 378x492.db.bak /opt/378x492/data/378x492.db

   # Verify database integrity
   sqlite3 /opt/378x492/data/378x492.db "PRAGMA integrity_check;"
   ```

4. **File System Recovery**:
   ```bash
   # Restore evidence files
   cp -r evidence/* /opt/378x492/evidence/

   # Restore configuration
   cp -r config/* /opt/378x492/config/
   ```

5. **System Validation**:
   ```bash
   # Start application
   sudo systemctl start 378x492

   # Verify system health
   curl http://localhost:8000/health

   # Test basic functionality
   curl http://localhost:8000/api/v1/cases
   ```

### Point-in-Time Recovery

#### Transaction Log Recovery
1. **Identify Recovery Point**:
   ```bash
   # List available transaction logs
   ls -la /opt/378x492/logs/transactions/
   ```

2. **Restore Base Backup**:
   ```bash
   # Restore most recent full backup before target time
   sqlite3 /opt/378x492/data/378x492.db ".restore full_backup_20251207.db"
   ```

3. **Apply Transaction Logs**:
   ```bash
   # Apply logs up to target time
   for log in $(ls /opt/378x492/logs/transactions/*.log | sort); do
       if [ $(stat -c %Y $log) -le $TARGET_TIMESTAMP ]; then
           sqlite3 /opt/378x492/data/378x492.db ".read $log"
       fi
   done
   ```

### Partial Recovery

#### Single Case Recovery
```bash
# Restore specific case data
CASE_ID="case-123"

# Restore case record
sqlite3 /opt/378x492/data/378x492.db ".read case_backup_$CASE_ID/case_data.sql"

# Restore evidence files
cp -r case_backup_$CASE_ID/evidence/* /opt/378x492/evidence/
```

#### Configuration Recovery
```bash
# Restore configuration files
tar -xzf config_backup_20251208.tar.gz -C /opt/378x492/config/

# Restore environment variables
source 378x492_env_20251208.txt

# Restart application
sudo systemctl restart 378x492
```

## 🚨 Disaster Recovery Planning

### Business Impact Analysis

#### Recovery Time Objectives (RTO)
- **Critical Systems**: 4 hours maximum downtime
- **Core Functionality**: 8 hours maximum downtime
- **Full Service**: 24 hours maximum downtime
- **Data Recovery**: 4 hours for critical data

#### Recovery Point Objectives (RPO)
- **Critical Data**: 15 minutes maximum data loss
- **Important Data**: 1 hour maximum data loss
- **Archival Data**: 24 hours maximum data loss

### Disaster Scenarios

#### Data Center Failure
- **Primary Site**: Complete data center outage
- **Secondary Site**: Automatic failover to backup site
- **Cloud Recovery**: AWS/Azure disaster recovery
- **Mobile Recovery**: Portable recovery systems

#### Cyber Attack
- **Ransomware**: Encrypted data recovery
- **Data Breach**: Forensic investigation and recovery
- **System Compromise**: Clean system rebuild
- **Data Corruption**: Backup restoration and validation

#### Natural Disaster
- **Flood/Fire**: Offsite backup activation
- **Earthquake**: Geographic redundancy activation
- **Power Failure**: Generator and UPS systems
- **Network Failure**: Satellite and cellular backup

### Recovery Team Structure

#### Incident Response Team
- **Team Leader**: Overall recovery coordination
- **Technical Lead**: System recovery execution
- **Business Lead**: Business continuity management
- **Communications Lead**: Stakeholder communication

#### Recovery Roles
- **Database Administrator**: Database recovery specialist
- **System Administrator**: Infrastructure recovery
- **Application Specialist**: Application-specific recovery
- **Security Officer**: Security validation and compliance

## ✅ Data Validation & Testing

### Backup Integrity Testing

#### Automated Testing
- **Checksum Verification**: SHA-256 hash validation
- **File Count Verification**: Expected vs actual file counts
- **Size Validation**: Expected vs actual backup sizes
- **Compression Testing**: Archive integrity verification

#### Manual Testing
- **Sample Restoration**: Test restore of sample data
- **Application Testing**: Verify restored application functionality
- **Data Consistency**: Validate referential integrity
- **Performance Testing**: Verify restored system performance

### Recovery Testing

#### Test Scenarios
- **Full System Recovery**: Complete system restoration
- **Partial Recovery**: Component-level restoration
- **Point-in-Time Recovery**: Specific time restoration
- **Disaster Recovery**: Failover scenario testing

#### Testing Schedule
- **Monthly Testing**: Basic backup restoration
- **Quarterly Testing**: Full disaster recovery simulation
- **Annual Testing**: Complete business continuity exercise
- **After Changes**: Testing after system modifications

### Validation Procedures

#### Database Validation
```sql
-- Database integrity check
PRAGMA integrity_check;

-- Row count validation
SELECT COUNT(*) FROM cases;
SELECT COUNT(*) FROM evidence;

-- Referential integrity check
SELECT * FROM evidence WHERE case_id NOT IN (SELECT id FROM cases);
```

#### File System Validation
```bash
# File count verification
find /opt/378x492/evidence -type f | wc -l

# File size validation
du -sh /opt/378x492/evidence

# Permission validation
ls -la /opt/378x492/evidence
```

## 📋 Compliance & Auditing

### Regulatory Compliance

#### SOX Compliance
- **Audit Trails**: Complete backup and recovery logging
- **Access Controls**: Restricted backup access
- **Change Management**: Backup procedure change tracking
- **Testing Documentation**: Recovery test records

#### GDPR Compliance
- **Data Minimization**: Minimal personal data in backups
- **Encryption**: Strong encryption for personal data
- **Retention Policies**: Defined data retention periods
- **Breach Notification**: Incident reporting procedures

### Audit Requirements

#### Backup Auditing
- **Backup Success**: Daily backup completion verification
- **Integrity Checks**: Regular backup validation
- **Access Logging**: Who accessed backup systems
- **Change Tracking**: Backup procedure modifications

#### Recovery Auditing
- **Recovery Testing**: Scheduled test documentation
- **Incident Response**: Recovery procedure execution logs
- **Success Metrics**: Recovery time and success rates
- **Lesson Learned**: Post-recovery improvement documentation

## 🌟 Best Practices

### Backup Best Practices

#### Storage Management
- **3-2-1 Rule**: 3 copies, 2 media types, 1 offsite
- **Encryption**: Always encrypt backups at rest and in transit
- **Access Control**: Limit backup access to authorized personnel
- **Monitoring**: Continuous backup health monitoring

#### Performance Optimization
- **Compression**: Use efficient compression algorithms
- **Deduplication**: Eliminate redundant data storage
- **Incremental Forever**: Use synthetic full backups
- **Parallel Processing**: Concurrent backup streams

### Recovery Best Practices

#### Preparation
- **Documentation**: Maintain current recovery procedures
- **Regular Testing**: Frequent recovery testing and validation
- **Team Training**: Regular recovery team training
- **Communication Plan**: Clear stakeholder communication procedures

#### Execution
- **Prioritization**: Restore critical systems first
- **Validation**: Verify each recovery step
- **Testing**: Test restored systems before production use
- **Monitoring**: Monitor restored systems for issues

### Continuous Improvement

#### Metrics Tracking
- **Recovery Time**: Track actual vs planned recovery times
- **Success Rates**: Monitor backup and recovery success
- **Cost Analysis**: Track backup and recovery costs
- **Performance Trends**: Monitor backup performance over time

#### Process Improvement
- **Lessons Learned**: Document and implement improvements
- **Technology Updates**: Adopt new backup technologies
- **Automation**: Increase automation to reduce errors
- **Scalability**: Plan for future growth and complexity

---

**Backup & recovery configured!** Continue with [Troubleshooting Guide](troubleshooting.md) for issue resolution and maintenance.

---


<!-- Source: ci-cd.md -->
# CI/CD Pipeline Guide

This comprehensive guide covers continuous integration and deployment pipelines for 378x492 Fraud Detection, including automated testing, building, and deployment processes.

## 📋 Table of Contents

- [CI/CD Overview](#-cicd-overview)
- [Pipeline Architecture](#-pipeline-architecture)
- [Automated Testing](#-automated-testing)
- [Build Process](#-build-process)
- [Deployment Strategies](#-deployment-strategies)
- [Infrastructure as Code](#-infrastructure-as-code)
- [Security Integration](#-security-integration)
- [Monitoring & Rollback](#-monitoring--rollback)

## 🔄 CI/CD Overview

### Pipeline Benefits

#### Development Efficiency
- **Automated Testing**: Catch bugs before production
- **Consistent Builds**: Reproducible build process
- **Fast Feedback**: Quick validation of changes
- **Parallel Development**: Multiple feature branches

#### Quality Assurance
- **Code Quality**: Automated linting and formatting
- **Security Scanning**: Vulnerability detection
- **Performance Testing**: Load and performance validation
- **Compliance Checks**: Regulatory requirement validation

#### Deployment Reliability
- **Automated Deployment**: Consistent release process
- **Environment Parity**: Identical staging and production
- **Rollback Capability**: Quick recovery from issues
- **Audit Trail**: Complete deployment history

### Pipeline Stages

#### Continuous Integration (CI)
1. **Code Commit**: Developer pushes code changes
2. **Automated Tests**: Unit, integration, and end-to-end tests
3. **Code Quality**: Linting, formatting, and security scans
4. **Build Artifacts**: Create deployable packages
5. **Artifact Storage**: Store build artifacts for deployment

#### Continuous Deployment (CD)
1. **Environment Promotion**: Move through dev → staging → production
2. **Automated Deployment**: Deploy to target environment
3. **Health Checks**: Verify deployment success
4. **Monitoring Integration**: Enable production monitoring
5. **Notification**: Alert team of successful deployment

## 🏗️ Pipeline Architecture

### GitHub Actions Workflow

#### Main Pipeline Configuration
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.12'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          npm ci
          pip install -r backend/requirements.txt

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build application
        run: npm run build

      - name: Build Electron app
        run: npm run build:electron

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: 378x492-build
          path: dist/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run security scan
        uses: securecodewarrior/github-actions-gosec@master
        with:
          args: './...'

      - name: Dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: '378x492'
          path: '.'
          format: 'ALL'

  deploy-staging:
    needs: [build, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Deployment commands here

  deploy-production:
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Deployment commands here
```

### Multi-Environment Pipeline

#### Environment Strategy
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Development │───▶│   Staging   │───▶│ Production │
│             │    │             │    │             │
│ • Feature   │    │ • Integration│    │ • Live      │
│ • Branches  │    │ • Testing    │    │ • Users     │
│ • Fast      │    │ • UAT        │    │ • Monitored │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### Environment Configuration
```yaml
# Environment-specific variables
environments:
  development:
    database_url: "postgresql://dev:dev@localhost/378x492_dev"
    redis_url: "redis://localhost:6379/0"
    log_level: "debug"

  staging:
    database_url: "postgresql://staging:staging@staging-db/378x492_staging"
    redis_url: "redis://staging-redis:6379/0"
    log_level: "info"

  production:
    database_url: "${{ secrets.PROD_DATABASE_URL }}"
    redis_url: "${{ secrets.PROD_REDIS_URL }}"
    log_level: "warn"
```

## 🧪 Automated Testing

### Test Strategy

#### Test Pyramid
```
End-to-End Tests (10%)
    ▲
Integration Tests (20%)
    ▲
Unit Tests (70%)
```

#### Test Categories

##### Unit Tests
```javascript
// Example unit test
const { fraudDetection } = require('../lib/AIFraudDetection');

describe('Fraud Detection', () => {
  test('should detect high-risk transaction', () => {
    const transaction = {
      amount: 5000,
      merchant: 'Unknown Vendor',
      location: 'High-Risk Country'
    };

    const result = fraudDetection.analyze(transaction);
    expect(result.riskScore).toBeGreaterThan(80);
    expect(result.level).toBe('high');
  });

  test('should pass low-risk transaction', () => {
    const transaction = {
      amount: 25,
      merchant: 'Regular Grocery Store',
      location: 'Home Country'
    };

    const result = fraudDetection.analyze(transaction);
    expect(result.riskScore).toBeLessThan(20);
    expect(result.level).toBe('low');
  });
});
```

##### Integration Tests
```javascript
// API integration test
const request = require('supertest');
const app = require('../app');

describe('Case API', () => {
  test('should create new case', async () => {
    const response = await request(app)
      .post('/api/v1/cases')
      .send({
        title: 'Test Case',
        description: 'Integration test case',
        case_type: 'financial_fraud'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Case');
  });

  test('should retrieve case details', async () => {
    const caseId = 'case-123';
    const response = await request(app)
      .get(`/api/v1/cases/${caseId}`)
      .expect(200);

    expect(response.body.id).toBe(caseId);
  });
});
```

##### End-to-End Tests
```javascript
// E2E test with Playwright
const { test, expect } = require('@playwright/test');

test('complete case workflow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000');
  await page.fill('[data-testid="username"]', 'investigator');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // Create case
  await page.click('[data-testid="new-case-button"]');
  await page.fill('[data-testid="case-title"]', 'E2E Test Case');
  await page.fill('[data-testid="case-description"]', 'Automated test case');
  await page.click('[data-testid="create-case-button"]');

  // Verify case creation
  await expect(page.locator('[data-testid="case-title"]')).toContainText('E2E Test Case');

  // Upload evidence
  await page.setInputFiles('[data-testid="file-upload"]', 'test-files/document.pdf');
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

  // Check AI analysis
  await expect(page.locator('[data-testid="risk-score"]')).toBeVisible();
});
```

### Test Automation

#### Test Execution
```yaml
# Test job in GitHub Actions
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:14
      env:
        POSTGRES_PASSWORD: postgres
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

    redis:
      image: redis:7
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  steps:
    - uses: actions/checkout@v4

    - name: Setup test database
      run: |
        createdb 378x492_test
        psql -d 378x492_test -f schema.sql

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests
      run: npm run test:e2e
```

#### Test Reporting
```javascript
// Test results reporting
const { junit, html } = require('playwright/lib/utils');

test.afterAll(async () => {
  // Generate JUnit XML for CI
  await junit.generate();

  // Generate HTML report
  await html.generate();

  // Upload to test management tool
  if (process.env.CI) {
    // Upload results to test management platform
    await uploadTestResults();
  }
});
```

## 🏗️ Build Process

### Multi-Platform Build

#### Electron Build Configuration
```javascript
// electron-builder.json
{
  "appId": "com.378x492.fraud-detection",
  "productName": "378x492 Fraud Detection",
  "directories": {
    "output": "dist/electron"
  },
  "files": [
    "dist/**/*",
    "node_modules/**/*",
    "backend/**/*"
  ],
  "mac": {
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      }
    ],
    "hardenedRuntime": true,
    "gatekeeperAssess": false
  },
  "win": {
    "target": "nsis",
    "verifyUpdateCodeSignature": false
  },
  "linux": {
    "target": "AppImage",
    "category": "Office"
  },
  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "378x492"
  }
}
```

#### Build Scripts
```json
// package.json build scripts
{
  "scripts": {
    "build": "webpack --mode production",
    "build:electron": "electron-builder --publish=never",
    "build:electron:win": "electron-builder --win --publish=never",
    "build:electron:mac": "electron-builder --mac --publish=never",
    "build:electron:linux": "electron-builder --linux --publish=never",
    "build:docker": "docker build -t 378x492 ."
  }
}
```

### Artifact Management

#### Build Artifacts
```yaml
# Upload build artifacts
- name: Upload build artifacts
  uses: actions/upload-artifact@v3
  with:
    name: 378x492-${{ github.sha }}
    path: |
      dist/
      build/
    retention-days: 30

# Upload to artifact repository
- name: Upload to Artifactory
  run: |
    curl -u${{ secrets.ARTIFACTORY_USER }}:${{ secrets.ARTIFACTORY_TOKEN }} \
      -T dist/378x492-1.0.0.dmg \
      "https://artifactory.company.com/378x492/1.0.0/378x492-1.0.0.dmg"
```

#### Version Management
```javascript
// Version management
const { execSync } = require('child_process');

function getVersion() {
  try {
    // Get version from git tags
    const tag = execSync('git describe --tags --abbrev=0').toString().trim();
    return tag;
  } catch (error) {
    // Fallback to package.json
    const pkg = require('./package.json');
    return pkg.version;
  }
}

function getBuildNumber() {
  // GitHub Actions build number
  return process.env.GITHUB_RUN_NUMBER || '0';
}

function getCommitHash() {
  return execSync('git rev-parse HEAD').toString().trim().substring(0, 7);
}

// Generate version string
const version = `${getVersion()}.${getBuildNumber()}-${getCommitHash()}`;
console.log(`Building version: ${version}`);
```

## 🚀 Deployment Strategies

### Blue-Green Deployment

#### Blue-Green Architecture
```
┌─────────────┐    ┌─────────────┐
│   Load      │────▶  Blue       │
│ Balancer    │    │ Environment │
└─────────────┘    └─────────────┘
       │                   │
       └───────────────────┘
               │
               ▼
       ┌─────────────┐
       │   Green     │
       │ Environment │
       └─────────────┘
```

#### Blue-Green Deployment Script
```bash
#!/bin/bash
# Blue-green deployment script

BLUE_PORT=8000
GREEN_PORT=8001
HEALTH_CHECK_URL="http://localhost"

# Deploy to green environment
echo "Deploying to green environment (port $GREEN_PORT)"
docker run -d -p $GREEN_PORT:8000 --name 378x492-green 378x492:new-version

# Wait for green environment to be healthy
echo "Waiting for green environment to be healthy..."
for i in {1..30}; do
  if curl -f $HEALTH_CHECK_URL:$GREEN_PORT/health > /dev/null; then
    echo "Green environment is healthy"
    break
  fi
  sleep 10
done

# Switch load balancer to green
echo "Switching load balancer to green environment"
# Update nginx configuration
sudo sed -i "s/$BLUE_PORT/$GREEN_PORT/" /etc/nginx/sites-available/378x492
sudo systemctl reload nginx

# Verify deployment
echo "Verifying deployment..."
if curl -f $HEALTH_CHECK_URL/health > /dev/null; then
  echo "Deployment successful!"

  # Stop blue environment
  docker stop 378x492-blue
  docker rm 378x492-blue

  # Rename green to blue for next deployment
  docker rename 378x492-green 378x492-blue
else
  echo "Deployment failed! Rolling back..."
  # Rollback logic here
fi
```

### Rolling Deployment

#### Rolling Update Strategy
```yaml
# Kubernetes rolling deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: 378x492
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: 378x492
        image: 378x492:{{ .Values.image.tag }}
        ports:
        - containerPort: 8000
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
```

### Feature Flags

#### Feature Flag Implementation
```javascript
// Feature flag system
const features = {
  ai_fraud_detection: process.env.FF_AI_FRAUD_DETECTION === 'true',
  advanced_analytics: process.env.FF_ADVANCED_ANALYTICS === 'true',
  collaboration_tools: process.env.FF_COLLABORATION_TOOLS === 'true'
};

// Usage in code
if (features.ai_fraud_detection) {
  // Enable AI fraud detection
  const result = await aiFraudDetection.analyze(transaction);
}

// Feature flag API
app.get('/api/features', (req, res) => {
  res.json(features);
});
```

## 🏗️ Infrastructure as Code

### Docker Configuration

#### Dockerfile
```dockerfile
# Multi-stage Docker build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install Python for backend
RUN apk add --no-cache python3 py3-pip

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S 378x492 -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=378x492:nodejs /app/dist ./dist
COPY --from=builder --chown=378x492:nodejs /app/backend ./backend
COPY --from=builder --chown=378x492:nodejs /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Install Python dependencies
RUN pip install -r backend/requirements.txt

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/uploads
RUN chown -R 378x492:nodejs /app

USER 378x492

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  378x492:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://378x492:password@postgres/378x492
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=378x492
      - POSTGRES_USER=378x492
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Manifests

#### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: 378x492
  labels:
    app: 378x492
spec:
  replicas: 3
  selector:
    matchLabels:
      app: 378x492
  template:
    metadata:
      labels:
        app: 378x492
    spec:
      containers:
      - name: 378x492
        image: 378x492:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: 378x492-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: 378x492-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service Manifest
```yaml
apiVersion: v1
kind: Service
metadata:
  name: 378x492
spec:
  selector:
    app: 378x492
  ports:
    - port: 80
      targetPort: 8000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: 378x492-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - 378x492.company.com
    secretName: 378x492-tls
  rules:
  - host: 378x492.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: 378x492
            port:
              number: 80
```

## 🔒 Security Integration

### Security Scanning

#### SAST (Static Application Security Testing)
```yaml
# CodeQL security scanning
- name: Initialize CodeQL
  uses: github/codeql-action/init@v2
  with:
    languages: javascript, python

- name: Autobuild
  uses: github/codeql-action/autobuild@v2

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
```

#### Container Security
```yaml
# Trivy container scanning
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'image'
    scan-ref: '378x492:latest'
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy scan results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

#### Dependency Scanning
```yaml
# Dependency vulnerability scanning
- name: Run npm audit
  run: npm audit --audit-level high

- name: Run safety (Python dependencies)
  run: safety check --full-report

- name: Dependency check
  uses: dependency-check/Dependency-Check_Action@main
  with:
    project: '378x492'
    path: '.'
    format: 'ALL'
```

### Secrets Management

#### GitHub Secrets
```yaml
# Store secrets in GitHub
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  REDIS_URL: ${{ secrets.REDIS_URL }}
  ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
  API_KEYS: ${{ secrets.API_KEYS }}
```

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: 378x492-secrets
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  redis-url: <base64-encoded-redis-url>
  encryption-key: <base64-encoded-encryption-key>
```

## 📊 Monitoring & Rollback

### Deployment Monitoring

#### Health Checks
```yaml
# Post-deployment health verification
- name: Health check
  run: |
    for i in {1..30}; do
      if curl -f https://378x492.company.com/health > /dev/null; then
        echo "Application is healthy"
        exit 0
      fi
      echo "Waiting for application to be healthy..."
      sleep 10
    done
    echo "Application failed to become healthy"
    exit 1
```

#### Performance Monitoring
```yaml
# Performance baseline check
- name: Performance test
  run: |
    # Run performance tests
    npm run test:performance

    # Check response times
    if [ $(curl -w "%{time_total}" -o /dev/null -s https://378x492.company.com/api/health) > 2.0 ]; then
      echo "Response time too slow"
      exit 1
    fi
```

### Rollback Procedures

#### Automated Rollback
```yaml
# Rollback job
rollback:
  runs-on: ubuntu-latest
  if: failure()
  steps:
    - name: Rollback deployment
      run: |
        # Get previous successful deployment
        PREVIOUS_VERSION=$(curl -s https://api.github.com/repos/your-org/378x492/releases/latest | jq -r .tag_name)

        # Deploy previous version
        kubectl set image deployment/378x492 378x492=378x492:$PREVIOUS_VERSION

        # Wait for rollout
        kubectl rollout status deployment/378x492

        # Verify rollback
        curl -f https://378x492.company.com/health
```

#### Manual Rollback
```bash
#!/bin/bash
# Manual rollback script

echo "Starting manual rollback..."

# Get current version
CURRENT_VERSION=$(kubectl get deployment 378x492 -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d: -f2)

echo "Current version: $CURRENT_VERSION"

# Find previous version
PREVIOUS_VERSION=$(curl -s https://api.github.com/repos/your-org/378x492/releases | jq -r '.[1].tag_name')

echo "Rolling back to: $PREVIOUS_VERSION"

# Perform rollback
kubectl set image deployment/378x492 378x492=378x492:$PREVIOUS_VERSION

# Wait for completion
kubectl rollout status deployment/378x492

# Verify
if curl -f https://378x492.company.com/health > /dev/null; then
  echo "Rollback successful"
else
  echo "Rollback failed"
  exit 1
fi
```

### Deployment Notifications

#### Success Notifications
```yaml
# Slack notification on success
- name: Notify success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: '378x492 deployment to ${{ github.event.inputs.environment }} successful'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### Failure Notifications
```yaml
# Slack notification on failure
- name: Notify failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: '378x492 deployment to ${{ github.event.inputs.environment }} failed'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

**CI/CD pipeline configured!** Continue with [Performance Baseline](../performance_baseline.md) for optimization guidance.

---


<!-- Source: configuration.md -->
# System Configuration Guide

This guide covers the configuration and administration of 378x492 Fraud Detection, including system settings, user management, and operational parameters.

## 📋 Table of Contents

- [Initial Setup](#-initial-setup)
- [System Configuration](#-system-configuration)
- [Security Settings](#-security-settings)
- [Performance Tuning](#-performance-tuning)
- [Integration Settings](#-integration-settings)
- [Backup & Recovery](#-backup--recovery)
- [Monitoring Configuration](#-monitoring-configuration)
- [Troubleshooting](#-troubleshooting)

## 🚀 Initial Setup

### First-Time Configuration

#### Administrator Account Creation
1. **Launch 378x492** after installation
2. **Create Admin Account**:
   - Enter administrator username and email
   - Set strong password (minimum 12 characters)
   - Configure password recovery options
   - Set up two-factor authentication (recommended)

#### Database Initialization
1. **Database Setup**:
   - Choose SQLite with SQLCipher encryption (recommended)
   - Set master encryption key (store securely)
   - Configure automatic key rotation
   - Set database file location

#### System Preferences
1. **Basic Settings**:
   - Set system timezone and locale
   - Configure date/time formats
   - Set default language and regional settings
   - Configure notification preferences

### Environment Configuration

#### Development vs Production
```javascript
// Environment configuration
const config = {
  environment: 'production', // 'development' | 'staging' | 'production'
  debug: false,
  logLevel: 'info',
  database: {
    encryption: true,
    backup: true,
    path: '/secure/location/378x492.db'
  }
};
```

#### Multi-Environment Support
- **Development**: Full debugging, relaxed security
- **Staging**: Production-like testing environment
- **Production**: Full security, optimized performance

## ⚙️ System Configuration

### Core System Settings

#### Application Settings
- **Session Management**:
  - Session timeout: 30 minutes (default)
  - Maximum concurrent sessions: 5 per user
  - Remember me duration: 7 days
  - Force logout on password change: enabled

- **File Management**:
  - Maximum file size: 100MB per file
  - Total storage quota: 10GB per user
  - Allowed file types: Configurable list
  - Automatic cleanup: 90 days retention

#### Case Management Settings
- **Case Numbering**:
  - Format: `CASE-{YYYY}-{NNNNN}`
  - Auto-increment: Enabled
  - Custom prefixes: By case type

- **Workflow Settings**:
  - Default case priorities: Low, Medium, High, Critical
  - Automatic escalation: After 48 hours
  - SLA tracking: Enabled
  - Approval workflows: Configurable

### Database Configuration

#### SQLCipher Settings
```sql
-- Database encryption configuration
PRAGMA key = 'your-secure-encryption-key';
PRAGMA cipher_page_size = 4096;
PRAGMA kdf_iter = 64000;
PRAGMA cipher_hmac_algorithm = HMAC_SHA512;
```

#### Performance Optimization
- **Connection Pooling**: 10 connections maximum
- **Query Timeout**: 30 seconds
- **Cache Size**: 2GB memory cache
- **WAL Mode**: Enabled for concurrent access

#### Backup Configuration
- **Automatic Backups**: Daily at 2:00 AM
- **Backup Retention**: 30 days
- **Compression**: Enabled
- **Encryption**: AES-256
- **Offsite Storage**: Configurable

## 🔒 Security Settings

### Authentication Configuration

#### Password Policies
- **Complexity Requirements**:
  - Minimum length: 12 characters
  - Uppercase letters: Required
  - Lowercase letters: Required
  - Numbers: Required
  - Special characters: Required

- **Password History**:
  - Remember last 10 passwords
  - Prevent reuse: 90 days
  - Change frequency: 90 days

#### Multi-Factor Authentication (MFA)
- **Required for**: Administrators, investigators
- **Methods**: TOTP (Google Authenticator), SMS, Email
- **Grace Period**: 7 days for setup
- **Backup Codes**: 10 emergency codes

### Access Control

#### Role-Based Permissions
```json
{
  "administrator": {
    "cases": "full",
    "users": "full",
    "system": "full",
    "reports": "full"
  },
  "investigator": {
    "cases": "assigned",
    "evidence": "upload",
    "analysis": "read",
    "reports": "create"
  }
}
```

#### IP Restrictions
- **Allowed Networks**: Configurable IP ranges
- **Blocked Countries**: Geographic restrictions
- **VPN Requirements**: Force corporate VPN
- **Device Registration**: Known device requirements

### Data Protection

#### Encryption Settings
- **Database Encryption**: SQLCipher with AES-256
- **File Encryption**: AES-256-GCM per file
- **Network Encryption**: TLS 1.3 required
- **Key Rotation**: Automatic every 90 days

#### Data Classification
- **Public**: Basic case information
- **Internal**: Investigation details
- **Confidential**: Sensitive evidence
- **Restricted**: Highly sensitive data

## ⚡ Performance Tuning

### System Resources

#### Memory Configuration
- **Heap Size**: 4GB minimum, 8GB recommended
- **Cache Allocation**: 2GB for application cache
- **Buffer Pool**: 1GB for database operations
- **Thread Pool**: 8 worker threads

#### CPU Optimization
- **Core Allocation**: Use all available cores
- **Process Priority**: Normal (not real-time)
- **I/O Scheduling**: Deadline scheduler
- **Hyper-Threading**: Enabled

### Evidence Processing Optimization

#### Parallel Processing
- **Worker Threads**: 4 concurrent processing threads
- **Queue Size**: 100 files maximum
- **Batch Size**: 10 files per batch
- **Timeout**: 300 seconds per file

#### AI Model Configuration
- **Model Loading**: On-demand loading
- **GPU Acceleration**: Automatic detection
- **Memory Limits**: 2GB per model
- **Cache TTL**: 1 hour

### Database Performance

#### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_assignee ON cases(assignee_id);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_evidence_case_id ON evidence(case_id);
```

#### Query Optimization
- **Prepared Statements**: Enabled
- **Query Caching**: 1 hour TTL
- **Result Limiting**: 1000 rows maximum
- **Timeout Protection**: 30 second limit

## 🔗 Integration Settings

### External System Integration

#### API Configuration
```json
{
  "api": {
    "baseUrl": "https://api.378x492.com",
    "timeout": 30,
    "retryAttempts": 3,
    "rateLimit": 1000
  }
}
```

#### Webhook Settings
- **Event Types**: Case created, status changed, evidence added
- **Payload Format**: JSON with HMAC signatures
- **Retry Policy**: Exponential backoff
- **Failure Handling**: Dead letter queue

### Third-Party Integrations

#### Email Configuration
```json
{
  "smtp": {
    "host": "smtp.company.com",
    "port": 587,
    "security": "tls",
    "auth": {
      "user": "noreply@company.com",
      "pass": "secure-password"
    }
  }
}
```

#### Storage Integration
- **Cloud Storage**: AWS S3, Google Cloud Storage
- **Network Shares**: SMB/CIFS, NFS
- **Encryption**: Client-side encryption
- **Access Control**: IAM integration

## 💾 Backup & Recovery

### Automated Backup Configuration

#### Backup Schedule
- **Full Backup**: Weekly (Sunday 2:00 AM)
- **Incremental Backup**: Daily (2:00 AM)
- **Transaction Log**: Every 15 minutes
- **Configuration Backup**: After changes

#### Backup Storage
- **Local Storage**: Encrypted local directory
- **Network Storage**: NAS/SAN devices
- **Cloud Storage**: AWS S3, Azure Blob Storage
- **Tape Backup**: Long-term archival

### Recovery Procedures

#### Point-in-Time Recovery
1. **Stop Application**: Prevent new transactions
2. **Restore Full Backup**: Load most recent full backup
3. **Apply Logs**: Restore incremental changes
4. **Verify Integrity**: Check database consistency
5. **Restart Application**: Resume normal operations

#### Disaster Recovery
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 15 minutes
- **Failover Systems**: Hot standby servers
- **Geographic Redundancy**: Multi-region deployment

### Backup Verification

#### Integrity Checks
- **Checksum Verification**: SHA-256 validation
- **Compression Testing**: Decompression verification
- **Encryption Testing**: Decryption validation
- **Data Consistency**: Referential integrity checks

## 📊 Monitoring Configuration

### System Monitoring

#### Health Checks
- **Application Health**: HTTP endpoint monitoring
- **Database Health**: Connection and query monitoring
- **File System Health**: Storage space and I/O monitoring
- **Network Health**: Connectivity and latency monitoring

#### Performance Metrics
- **Response Times**: API endpoint performance
- **Resource Usage**: CPU, memory, disk utilization
- **Error Rates**: Application and system errors
- **Throughput**: Transactions per second

### Alert Configuration

#### Alert Thresholds
```json
{
  "alerts": {
    "cpu_usage": { "warning": 80, "critical": 95 },
    "memory_usage": { "warning": 85, "critical": 95 },
    "disk_usage": { "warning": 85, "critical": 95 },
    "response_time": { "warning": 2000, "critical": 5000 }
  }
}
```

#### Notification Channels
- **Email Alerts**: System administrator notifications
- **SMS Alerts**: Critical system alerts
- **Slack/Webex**: Team collaboration platforms
- **PagerDuty**: Incident management integration

## 🔧 Troubleshooting

### Common Configuration Issues

#### Database Connection Problems
- **Check Connection String**: Verify host, port, credentials
- **Network Connectivity**: Test database server reachability
- **Firewall Settings**: Ensure required ports are open
- **SSL Configuration**: Verify certificate validity

#### Performance Issues
- **Resource Monitoring**: Check CPU, memory, disk usage
- **Query Analysis**: Identify slow-running queries
- **Index Optimization**: Verify database indexes
- **Cache Configuration**: Check cache hit rates

#### Security Configuration
- **Certificate Validation**: Check SSL certificate expiry
- **Permission Issues**: Verify file and directory permissions
- **Authentication Problems**: Test user login and MFA
- **Encryption Keys**: Validate key rotation and backup

### Diagnostic Tools

#### System Diagnostics
```bash
# Check system health
curl http://localhost:8000/health

# View application logs
tail -f /var/log/378x492/application.log

# Database diagnostics
sqlite3 /data/378x492.db ".dbinfo"

# Performance monitoring
top -p $(pgrep 378x492)
```

#### Configuration Validation
- **Syntax Checking**: Validate configuration file format
- **Dependency Verification**: Check required services availability
- **Permission Testing**: Verify file and directory access
- **Integration Testing**: Test external system connectivity

---

**Configuration complete!** Continue with [Basic Usage](../user-guides/basic-usage.md) to learn about user management and permissions.

---


<!-- Source: monitoring.md -->
# Monitoring Guide

**Change impact (keep in sync):**
- Operator/developer splits now live in `docs/monitoring/IMPLEMENTATION.md`; keep this page aligned.
- Update troubleshooting links in `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md` when playbooks change.
- Run docs link check after edits and ensure any metric/alert names match code configs.

This comprehensive guide covers system monitoring, alerting, performance tracking, and health management for 378x492 Fraud Detection.

## 📋 Table of Contents

- [System Health Monitoring](#-system-health-monitoring)
- [Performance Metrics](#-performance-metrics)
- [Alert Configuration](#-alert-configuration)
- [Log Management](#-log-management)
- [Dashboard Analytics](#-dashboard-analytics)
- [Incident Response](#-incident-response)
- [Capacity Planning](#-capacity-planning)
- [Compliance Monitoring](#-compliance-monitoring)

## 🏥 System Health Monitoring

### Health Check Endpoints

#### Application Health
378x492 provides comprehensive health monitoring through dedicated endpoints:

```bash
# Overall system health
GET /health

# Detailed component health
GET /health/detailed

# Database connectivity
GET /health/database

# External service dependencies
GET /health/dependencies
```

**Health Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T10:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time": 45,
      "last_check": "2025-12-08T10:00:00Z"
    },
    "cache": {
      "status": "healthy",
      "hit_rate": 0.95,
      "memory_usage": "256MB"
    },
    "evidence_processing": {
      "status": "healthy",
      "queue_length": 5,
      "active_workers": 3
    }
  }
}
```

#### Component Health Checks
- **Database Health**: Connection status, query performance, disk space
- **Cache Health**: Hit rates, memory usage, eviction rates
- **Processing Health**: Queue status, worker availability, error rates
- **External Services**: API connectivity, third-party service status

### Automated Health Monitoring

#### Continuous Monitoring
- **Real-time Checks**: Health status updated every 30 seconds
- **Threshold Monitoring**: Automatic alerts when health degrades
- **Dependency Tracking**: Monitor external service availability
- **Performance Baselines**: Track normal operating parameters

#### Health Dashboard
- **Status Overview**: Visual health status for all components
- **Trend Analysis**: Health status changes over time
- **Incident History**: Past health incidents and resolutions
- **Predictive Alerts**: Early warning for potential issues

## 📊 Performance Metrics

### Application Performance

#### Response Time Metrics
- **API Response Times**: Average, 95th percentile, 99th percentile
- **Page Load Times**: Frontend rendering performance
- **Database Query Times**: SQL execution performance
- **File Processing Times**: Evidence analysis duration

#### Throughput Metrics
- **Requests per Second**: API call volume
- **Cases Processed**: Investigation completion rate
- **Evidence Analyzed**: File processing volume
- **Reports Generated**: Document creation rate

### System Resource Metrics

#### CPU Monitoring
- **Usage Percentage**: Overall CPU utilization
- **Core Distribution**: Per-core usage breakdown
- **Process CPU**: Application-specific CPU consumption
- **System Load**: 1-minute, 5-minute, 15-minute averages

#### Memory Monitoring
- **RAM Usage**: Physical memory consumption
- **Virtual Memory**: Swap file utilization
- **Memory Leaks**: Long-term memory growth tracking
- **Garbage Collection**: Memory cleanup performance

#### Disk I/O Monitoring
- **Read/Write Operations**: IOPS (I/O operations per second)
- **Throughput**: Data transfer rates
- **Latency**: Storage access times
- **Space Utilization**: Disk usage percentages

#### Network Monitoring
- **Bandwidth Usage**: Data transfer volumes
- **Connection Count**: Active network connections
- **Error Rates**: Network transmission errors
- **Latency**: Network response times

## 🚨 Alert Configuration

### Alert Types & Severity

#### Critical Alerts
**Immediate Action Required**
- System unavailable or unresponsive
- Database connection failures
- Security breaches or unauthorized access
- Data corruption or loss
- Complete service outages

#### Warning Alerts
**Attention Needed**
- High resource utilization (>90%)
- Performance degradation (>50% slowdown)
- Queue backlogs (>100 items)
- Failed login attempts (>5 per hour)
- Certificate expiration (<30 days)

#### Info Alerts
**Monitoring & Awareness**
- System updates available
- Performance trends
- Usage pattern changes
- Maintenance reminders
- Configuration changes

### Alert Channels

#### Email Notifications
- **Immediate Alerts**: Critical issues sent immediately
- **Daily Digests**: Warning and info alerts summarized daily
- **Escalation**: Unacknowledged alerts escalate to management
- **Custom Recipients**: Role-based alert distribution

#### SMS/Text Alerts
- **Critical Only**: High-priority alerts to on-call personnel
- **Emergency Contacts**: Backup notification for email failures
- **Geographic Routing**: Local time zone appropriate delivery

#### Integration Alerts
- **Slack/Webex Teams**: Team collaboration platform notifications
- **PagerDuty**: Incident management and escalation
- **ServiceNow**: IT service management integration
- **Custom Webhooks**: API-based alert delivery

### Alert Management

#### Alert Acknowledgment
- **Manual Acknowledgment**: Team members can acknowledge alerts
- **Auto-Resolution**: Some alerts resolve automatically
- **Escalation Policies**: Unacknowledged alerts escalate automatically
- **Snooze Options**: Temporarily suppress recurring alerts

#### Alert History
- **Complete Audit Trail**: All alerts with timestamps and actions
- **Resolution Tracking**: How and when alerts were resolved
- **False Positive Tracking**: Identify and reduce unnecessary alerts
- **Trend Analysis**: Alert frequency and patterns over time

## 📝 Log Management

### Log Collection

#### Application Logs
- **Error Logs**: Application errors and exceptions
- **Access Logs**: User access and API calls
- **Audit Logs**: Security and compliance events
- **Performance Logs**: System performance metrics

#### System Logs
- **Operating System**: OS-level events and errors
- **Database Logs**: SQL execution and errors
- **Network Logs**: Connection and security events
- **Security Logs**: Authentication and authorization events

### Log Processing

#### Centralized Logging
- **Log Aggregation**: Collect logs from all system components
- **Structured Logging**: Consistent log format with metadata
- **Log Enrichment**: Add context and correlation data
- **Real-time Processing**: Immediate log analysis and alerting

#### Log Retention
- **Application Logs**: 90 days rolling retention
- **Security Logs**: 1 year retention (compliance requirement)
- **Audit Logs**: 7 years retention (financial systems)
- **Archive Storage**: Long-term storage with compression

### Log Analysis

#### Automated Analysis
- **Error Pattern Detection**: Identify recurring error patterns
- **Anomaly Detection**: Unusual log patterns or frequencies
- **Correlation Analysis**: Connect related log events
- **Trend Analysis**: Log volume and pattern changes

#### Search & Filtering
- **Full-text Search**: Search across all log content
- **Field-based Filtering**: Filter by log level, component, user
- **Time-based Queries**: Search within specific time ranges
- **Saved Searches**: Frequently used log queries

## 📈 Dashboard Analytics

### Real-Time Dashboards

#### Executive Dashboard
- **System Health**: Overall system status and availability
- **Key Metrics**: Cases processed, fraud detected, response times
- **Alert Summary**: Active alerts and recent resolutions
- **Performance Trends**: 24-hour performance overview

#### Operations Dashboard
- **Resource Utilization**: CPU, memory, disk, network usage
- **Queue Status**: Processing queues and backlog levels
- **Error Rates**: Application and system error tracking
- **User Activity**: Active users and session information

#### Security Dashboard
- **Access Attempts**: Login success/failure rates
- **Security Events**: Suspicious activity and breaches
- **Compliance Status**: Regulatory compliance metrics
- **Audit Summary**: Recent audit activities

### Custom Dashboards

#### Dashboard Builder
- **Widget Library**: Pre-built visualization components
- **Data Sources**: Connect to various system metrics
- **Layout Customization**: Arrange widgets and panels
- **Time Range Selection**: Historical data analysis

#### Advanced Visualizations
- **Time Series Charts**: Performance trends over time
- **Heat Maps**: Multi-dimensional data visualization
- **Gauge Charts**: KPI status indicators
- **Table Views**: Detailed metric breakdowns

## 🚨 Incident Response

### Incident Detection

#### Automated Detection
- **Threshold-based Alerts**: Metric threshold violations
- **Pattern Recognition**: Unusual behavior detection
- **Correlation Analysis**: Related event identification
- **Predictive Alerts**: Early warning systems

#### Manual Reporting
- **User Reports**: Issues reported by system users
- **Monitoring Team**: Dedicated monitoring personnel
- **External Monitoring**: Third-party monitoring services
- **Scheduled Checks**: Regular system health reviews

### Incident Response Process

#### Incident Classification
- **Severity Levels**: Critical, High, Medium, Low
- **Impact Assessment**: Affected users and systems
- **Business Impact**: Operational and financial consequences
- **Resolution Time**: Expected incident resolution

#### Response Workflow
1. **Detection**: Incident identified through monitoring
2. **Assessment**: Impact and severity evaluation
3. **Notification**: Alert relevant teams and stakeholders
4. **Investigation**: Root cause analysis
5. **Resolution**: Implement fixes and workarounds
6. **Communication**: Update stakeholders on progress
7. **Post-mortem**: Incident analysis and prevention

### Incident Management

#### Communication Plan
- **Internal Communication**: Keep team informed of status
- **External Communication**: Notify affected users and customers
- **Escalation Procedures**: When to involve management
- **Status Updates**: Regular progress reports

#### Recovery Procedures
- **Backup Restoration**: Data recovery from backups
- **Service Restoration**: Bring systems back online
- **Data Validation**: Ensure data integrity after recovery
- **Testing**: Validate system functionality

## 📈 Capacity Planning

### Resource Forecasting

#### Usage Trends
- **Historical Analysis**: Past resource utilization patterns
- **Growth Projections**: Expected future usage increases
- **Seasonal Variations**: Peak usage period planning
- **Event-based Planning**: Special event capacity requirements

#### Performance Modeling
- **Load Testing**: Simulate high-usage scenarios
- **Stress Testing**: Maximum capacity determination
- **Scalability Testing**: Performance under increased load
- **Bottleneck Identification**: System limitation discovery

### Capacity Management

#### Resource Allocation
- **CPU Scaling**: Additional processing capacity
- **Memory Expansion**: Increased RAM allocation
- **Storage Growth**: Additional disk space provisioning
- **Network Bandwidth**: Increased network capacity

#### Auto-scaling
- **Dynamic Scaling**: Automatic resource adjustment
- **Load Balancing**: Distribute load across resources
- **Resource Pools**: Shared resource management
- **Cost Optimization**: Efficient resource utilization

## 📋 Compliance Monitoring

### Regulatory Compliance

#### Audit Requirements
- **SOX Compliance**: Financial system monitoring
- **GDPR Compliance**: Data protection and privacy
- **PCI DSS**: Payment card data security
- **Industry Standards**: Sector-specific requirements

#### Compliance Monitoring
- **Access Logging**: Who accessed what and when
- **Change Tracking**: System configuration changes
- **Data Handling**: Sensitive data access and usage
- **Security Events**: Security incident tracking

### Audit Preparation

#### Audit Logging
- **Complete Audit Trail**: All system activities logged
- **Log Integrity**: Tamper-proof log storage
- **Retention Policies**: Required log retention periods
- **Access Controls**: Restricted audit log access

#### Compliance Reporting
- **Automated Reports**: Scheduled compliance reports
- **Manual Audits**: On-demand audit report generation
- **Evidence Collection**: Supporting documentation
- **Gap Analysis**: Compliance requirement assessment

---

**Monitoring configured!** Continue with [Backup & Recovery](backup-recovery.md) to ensure data protection and business continuity.

---
