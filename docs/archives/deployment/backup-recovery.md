# Backup & Recovery Guide

This comprehensive guide covers data backup strategies, disaster recovery procedures, and business continuity planning for Simple378 Fraud Detection.

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
# Simple378 Backup Script

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
   # Install Simple378 on recovery system
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