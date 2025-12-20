#!/usr/bin/env node

/**
 * Production Configuration Setup Script
 * Generates secure configuration for production deployment
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ProductionSetup {
  constructor() {
    this.configPath = path.join(process.cwd(), '.env.production');
    this.backupPath = path.join(process.cwd(), '.env.backup');
  }

  /**
   * Generate secure random key
   */
  generateSecureKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure password with complexity requirements
   */
  generateSecurePassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase.charAt(crypto.randomInt(0, uppercase.length));
    password += lowercase.charAt(crypto.randomInt(0, lowercase.length));
    password += numbers.charAt(crypto.randomInt(0, numbers.length));
    password += symbols.charAt(crypto.randomInt(0, symbols.length));
    
    // Fill remaining length with random characters
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(crypto.randomInt(0, allChars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
  }

  /**
   * Validate existing .env file
   */
  async validateExistingConfig() {
    try {
      const envContent = await fs.readFile('.env', 'utf8');
      const lines = envContent.split('\n');
      
      const issues = [];
      const defaults = [
        process.env.SQLCIPHER_KEY || 'REPLACE_WITH_SECURE_RANDOM_KEY',
        process.env.MASTER_PASSWORD || 'REPLACE_WITH_STRONG_MASTER_PASSWORD',
        process.env.IPC_SECRET || 'REPLACE_WITH_SECURE_IPC_SECRET',
        process.env.AUTH_ENCRYPTION_KEY || 'REPLACE_WITH_SECURE_AUTH_KEY',
        process.env.JWT_SECRET_KEY || 'REPLACE_WITH_SECURE_JWT_KEY',
        process.env.ENCRYPTION_KEY || 'REPLACE_WITH_SECURE_ENCRYPTION_KEY',
        process.env.SENTRY_DSN || 'REPLACE_WITH_SENTRY_DSN',
        process.env.REDIS_PASSWORD || 'REPLACE_WITH_REDIS_PASSWORD'
      ];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (defaults.includes(value)) {
              issues.push(`Default value detected: ${key}=${value}`);
            }
          }
        }
      }
      
      return issues;
    } catch (error) {
      return []; // No existing file
    }
  }

  /**
   * Backup existing configuration
   */
  async backupExistingConfig() {
    try {
      await fs.copyFile('.env', this.backupPath);
      console.log(`📋 Existing .env backed up to: ${this.backupPath}`);
    } catch (error) {
      // No existing file to backup
    }
  }

  /**
   * Create production configuration
   */
  async createProductionConfig() {
    const config = `# Production Configuration for Simple378 Fraud Detection
# Generated on ${new Date().toISOString()}
# ⚠️  REVIEW ALL VALUES BEFORE DEPLOYMENT ⚠️

# =============================================================================
# CRITICAL SECURITY SETTINGS
# =============================================================================

# Database encryption key (32+ characters, CHANGE THIS)
SQLCIPHER_KEY=${this.generateSecureKey(32)}

# Master password for application (16+ characters, CHANGE THIS)
MASTER_PASSWORD=${this.generateSecurePassword(16)}

# IPC communication secret (32+ characters, CHANGE THIS)
IPC_SECRET=${this.generateSecureKey(32)}

# Authentication encryption key (32+ characters, CHANGE THIS)
AUTH_ENCRYPTION_KEY=${this.generateSecureKey(32)}

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================

# Environment (MUST be 'production' for production deployment)
NODE_ENV=production

# Application version
APP_VERSION=1.0.0

# Database settings
DATABASE_PATH=./data/fraud_detection.db
DATABASE_BACKUP_PATH=./data/backups/

# Server settings
HOST=localhost
PORT=8000

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# Session settings
SESSION_TIMEOUT_MINUTES=60
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File upload settings
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,csv,xlsx,jpg,png

# =============================================================================
# MONITORING & LOGGING
# =============================================================================

# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Sentry DSN for error tracking (optional)
SENTRY_DSN=

# Prometheus metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# =============================================================================
# BACKUP & RECOVERY
# =============================================================================

# Backup settings
BACKUP_ENABLED=true
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=30

# =============================================================================
# DEVELOPMENT SETTINGS (REMOVE IN PRODUCTION)
# =============================================================================

# Development database password (REMOVE IN PRODUCTION)
DEV_DB_PASSWORD=

# Development secrets (REMOVE IN PRODUCTION)
DEV_IPC_SECRET=
DEV_AUTH_KEY=
`;

    await fs.writeFile(this.configPath, config, 'utf8');
    console.log(`🔐 Production configuration created: ${this.configPath}`);
  }

  /**
   * Create deployment checklist
   */
  async createDeploymentChecklist() {
    const checklist = `# Production Deployment Checklist
# Generated on ${new Date().toISOString()}

## 🔐 Security Configuration
- [ ] Review and update SQLCIPHER_KEY (32+ chars)
- [ ] Review and update MASTER_PASSWORD (16+ chars, complex)
- [ ] Review and update IPC_SECRET (32+ chars)
- [ ] Review and update AUTH_ENCRYPTION_KEY (32+ chars)
- [ ] Remove all default/placeholder values
- [ ] Ensure NODE_ENV=production

## 📁 File System
- [ ] Set appropriate file permissions on .env.production
- [ ] Verify database directory permissions
- [ ] Verify backup directory permissions
- [ ] Ensure log directory exists and is writable

## 🚀 Application Setup
- [ ] Copy .env.production to .env
- [ ] Test application startup with new configuration
- [ ] Verify database encryption works
- [ ] Test authentication system
- [ ] Verify IPC communication works

## 🔍 Security Verification
- [ ] Run security diagnostic: npm run diagnostics:security
- [ ] Verify no hardcoded secrets in codebase
- [ ] Test file encryption/decryption
- [ ] Verify rate limiting works
- [ ] Test session timeout functionality

## 📊 Monitoring Setup
- [ ] Configure Sentry DSN if using error tracking
- [ ] Verify Prometheus metrics endpoint
- [ ] Test log rotation
- [ ] Verify backup system works

## 🚨 Final Checks
- [ ] Run full diagnostic suite: npm run diagnostics
- [ ] Test all critical functionality
- [ ] Verify performance benchmarks
- [ ] Complete security audit
- [ ] Document deployment process

## 📞 Emergency Contacts
- Security Team: [CONTACT]
- DevOps Team: [CONTACT]
- Incident Response: [CONTACT]

---
⚠️  Do NOT deploy until ALL items are completed and verified!
`;

    await fs.writeFile('DEPLOYMENT_CHECKLIST.md', checklist, 'utf8');
    console.log('📋 Deployment checklist created: DEPLOYMENT_CHECKLIST.md');
  }

  /**
   * Run the complete production setup
   */
  async run() {
    console.log('🚀 Starting production configuration setup...\n');

    // Validate existing configuration
    console.log('🔍 Checking existing configuration...');
    const issues = await this.validateExistingConfig();
    if (issues.length > 0) {
      console.log('⚠️  Security issues found in existing configuration:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log();
    }

    // Backup existing configuration
    console.log('📋 Backing up existing configuration...');
    await this.backupExistingConfig();

    // Create production configuration
    console.log('🔐 Creating production configuration...');
    await this.createProductionConfig();

    // Create deployment checklist
    console.log('📋 Creating deployment checklist...');
    await this.createDeploymentChecklist();

    console.log('\n✅ Production setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Review and update values in .env.production');
    console.log('2. Follow DEPLOYMENT_CHECKLIST.md for deployment');
    console.log('3. Copy .env.production to .env when ready to deploy');
    console.log('4. Run security diagnostics: npm run diagnostics:security');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Production Configuration Setup for Simple378 Fraud Detection

Usage: node setup-production.js [options]

Options:
  --help, -h     Show this help message
  --validate-only  Only validate existing configuration
  --backup-only    Only backup existing configuration

Examples:
  node setup-production.js              # Full setup process
  node setup-production.js --validate-only  # Validate existing config
    `);
    return;
  }

  const setup = new ProductionSetup();
  
  try {
    if (args.includes('--validate-only')) {
      const issues = await setup.validateExistingConfig();
      if (issues.length > 0) {
        console.log('❌ Security issues found:');
        issues.forEach(issue => console.log(`  - ${issue}`));
        process.exit(1);
      } else {
        console.log('✅ No security issues found');
      }
    } else if (args.includes('--backup-only')) {
      await setup.backupExistingConfig();
    } else {
      await setup.run();
    }
  } catch (error) {
    console.error('❌ Production setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionSetup;