# System Configuration Guide

This guide covers the configuration and administration of Simple378 Fraud Detection, including system settings, user management, and operational parameters.

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
1. **Launch Simple378** after installation
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