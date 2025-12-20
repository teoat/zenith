const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Secure Configuration Manager
 * Handles loading and validation of security-sensitive configuration
 */
class SecureConfig {
  constructor() {
    this.config = {};
    this.isProduction = process.env.NODE_ENV === 'production';
    this.configLoaded = false;
  }

  /**
   * Load configuration from environment variables and .env file
   */
  async loadConfig() {
    try {
      // Load .env file if it exists
      await this.loadEnvFile();
      
      // Validate required security settings
      this.validateSecurityConfig();
      
      // Load configuration
      this.config = {
        // Database Security
        sqlcipherKey: this.getRequiredEnv('SQLCIPHER_KEY'),
        masterPassword: this.getRequiredEnv('MASTER_PASSWORD'),
        
        // IPC Security
        ipcSecret: this.getRequiredEnv('IPC_SECRET'),
        
        // Authentication Security
        authEncryptionKey: this.getRequiredEnv('AUTH_ENCRYPTION_KEY'),
        
        // Application Settings
        environment: process.env.NODE_ENV || 'development',
        appVersion: process.env.APP_VERSION || '1.0.0',
        
        // Database Settings
        databasePath: process.env.DATABASE_PATH || './data/fraud_detection.db',
        databaseBackupPath: process.env.DATABASE_BACKUP_PATH || './data/backups/',
        
        // Server Settings
        host: process.env.HOST || 'localhost',
        port: parseInt(process.env.PORT) || 8000,
        
        // Security Settings
        sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 60,
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 15,
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        
        // File Upload Settings
        maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB) || 50,
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,csv,xlsx,jpg,png').split(','),
        
        // Monitoring & Logging
        logLevel: process.env.LOG_LEVEL || 'info',
        sentryDsn: process.env.SENTRY_DSN || '',
        metricsEnabled: process.env.METRICS_ENABLED === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
        
        // Backup & Recovery
        backupEnabled: process.env.BACKUP_ENABLED === 'true',
        backupIntervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24,
        backupRetentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
      };
      
      this.configLoaded = true;
      console.log('✅ Secure configuration loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load secure configuration:', error.message);
      throw error;
    }
  }

  /**
   * Load .env file if it exists
   */
  async loadEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    try {
      const envContent = await fs.readFile(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            process.env[key] = value;
          }
        }
      }
    } catch (error) {
      // .env file doesn't exist, that's okay
      console.log('ℹ️  No .env file found, using environment variables');
    }
  }

  /**
   * Validate security configuration
   */
  validateSecurityConfig() {
    const errors = [];
    
    // Check for default/weak values in production
    if (this.isProduction) {
      const defaults = [
        process.env.SQLCIPHER_KEY || 'development-key-replace-in-production',
        process.env.MASTER_PASSWORD || 'development-password-replace-in-production',
        process.env.IPC_SECRET || 'development-ipc-replace-in-production',
        process.env.AUTH_ENCRYPTION_KEY || 'development-auth-replace-in-production',
        process.env.JWT_SECRET_KEY || 'development-jwt-replace-in-production',
        process.env.ENCRYPTION_KEY || 'development-encryption-replace-in-production',
        process.env.SENTRY_DSN || 'development-sentry-replace-in-production',
        process.env.REDIS_PASSWORD || 'development-redis-replace-in-production'
      ];
      
      for (const defaultValue of defaults) {
        if (Object.values(process.env).includes(defaultValue)) {
          errors.push(`Default value detected in production: ${defaultValue}`);
        }
      }
    }
    
    // Validate key lengths
    const sqlcipherKey = process.env.SQLCIPHER_KEY;
    if (sqlcipherKey && sqlcipherKey.length < 32) {
      errors.push('SQLCIPHER_KEY must be at least 32 characters long');
    }
    
    const ipcSecret = process.env.IPC_SECRET;
    if (ipcSecret && ipcSecret.length < 32) {
      errors.push('IPC_SECRET must be at least 32 characters long');
    }
    
    const authKey = process.env.AUTH_ENCRYPTION_KEY;
    if (authKey && authKey.length < 32) {
      errors.push('AUTH_ENCRYPTION_KEY must be at least 32 characters long');
    }
    
    if (errors.length > 0) {
      throw new Error(`Security validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Get required environment variable
   */
  getRequiredEnv(key) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get configuration value
   */
  get(key) {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config[key];
  }

  /**
   * Get all configuration (for debugging only)
   */
  getAll() {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    
    // Return sanitized config for logging (hide secrets)
    const sanitized = { ...this.config };
    delete sanitized.sqlcipherKey;
    delete sanitized.masterPassword;
    delete sanitized.ipcSecret;
    delete sanitized.authEncryptionKey;
    
    return sanitized;
  }

  /**
   * Generate secure random key
   */
  static generateSecureKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure password
   */
  static generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(crypto.randomInt(0, charset.length));
    }
    
    return password;
  }

  /**
   * Create secure .env file template
   */
  static async createSecureEnvTemplate() {
    const template = `# Security Configuration for Simple378 Fraud Detection
# Generated on ${new Date().toISOString()}

# =============================================================================
# CRITICAL SECURITY SETTINGS
# =============================================================================

# Database encryption key (32+ characters)
SQLCIPHER_KEY=${this.generateSecureKey(32)}

# Master password for application (16+ characters)
MASTER_PASSWORD=${this.generateSecurePassword(16)}

# IPC communication secret (32+ characters)
IPC_SECRET=${this.generateSecureKey(32)}

# Authentication encryption key (32+ characters)
AUTH_ENCRYPTION_KEY=${this.generateSecureKey(32)}

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================

# Environment (development, staging, production)
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
`;

    const envPath = path.join(process.cwd(), '.env.production');
    await fs.writeFile(envPath, template, 'utf8');
    console.log(`🔐 Secure .env template created at: ${envPath}`);
    console.log('⚠️  Review and update the values before using in production!');
  }
}

module.exports = SecureConfig;