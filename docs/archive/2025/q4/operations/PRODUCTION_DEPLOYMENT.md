# Production Deployment Guide
## Simple378 Fraud Detection Platform

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
# - release/Simple378-1.0.0.dmg (macOS)
# - release/Simple378-Setup-1.0.0.exe (Windows)
# - release/Simple378-1.0.0.AppImage (Linux)

> **Note:** Packaging relies on `electron-builder` configuration. Ensure `build` configuration in `package.json` or `electron-builder.yml` is correctly set up with your App ID (`com.378x492.fraud-detection`) and directories before running this command.
```

### 3. Code Signing (Production)

```bash
# macOS code signing
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Team ID" \
  release/Simple378-1.0.0.dmg

# Windows code signing
signtool sign /f certificate.p12 /p password \
  /t http://timestamp.digicert.com \
  /fd SHA256 release/Simple378-Setup-1.0.0.exe
```

### 4. Notarization (macOS)

```bash
# Upload for notarization
xcrun altool --notarize-app \
  --primary-bundle-id "com.378x492.fraud-detection" \
  --username "your-apple-id@example.com" \
  --password "@keychain:AC_PASSWORD" \
  --file release/Simple378-1.0.0.dmg
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

*This deployment guide is part of the Simple378 Fraud Detection documentation suite. For the latest version, check the official documentation repository.*