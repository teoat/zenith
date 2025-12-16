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
# Simple378 Health Check Script

echo "=== Simple378 Health Check ==="
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
   - Simple378 version
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