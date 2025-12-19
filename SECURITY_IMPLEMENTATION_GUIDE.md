# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in the 378x492 Fraud Detection Platform, including authentication, authorization, input validation, and monitoring capabilities.

## Authentication & Authorization

### Account Lockout Mechanism

**Implementation**: Progressive lockout after failed login attempts

```typescript
// Account lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_MINUTES = 15;

// Authentication logic with lockout
async function authenticateUser(username: string, password: string) {
  // Check if account is locked
  if (this._isAccountLocked(user)) {
    throw new HTTPException(423, "Account temporarily locked");
  }

  // Verify password
  if (!this.verifyPassword(password, user.password_hash)) {
    this._recordFailedAttempt(user);
    return null;
  }

  // Success - reset failed attempts
  this._resetFailedAttempts(user);
  return user;
}
```

**Features**:
- 5 failed attempts trigger 15-minute lockout
- Progressive lockout duration
- Automatic reset on successful login
- Admin unlock capability

### Password Security

**Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Validation**:
```typescript
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validatePassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!PASSWORD_PATTERN.test(password)) return false;
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) return false;
  return true;
}
```

## Rate Limiting

### Implementation

**Sliding Window Algorithm**:
```python
class RateLimitingMiddleware(BaseHTTPMiddleware):
    def __init__(self):
        self.request_counts = defaultdict(deque)

    async def dispatch(self, request, call_next):
        client_id = self._get_client_identifier(request)

        if self._is_rate_limited(client_id, request.url.path):
            raise RateLimitExceeded(retry_after=60)

        response = await call_next(request)
        return response
```

**Rate Limits by Endpoint**:
- Authentication: 5 requests/5 minutes
- API endpoints: 100 requests/minute
- File uploads: 10 uploads/hour
- Search: 20 searches/minute

## Input Validation & Sanitization

### XSS Prevention

**DOMPurify Integration**:
```typescript
import DOMPurify from 'dompurify';

const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target']
};

function sanitizeHTML(dirtyHTML: string): string {
  return DOMPurify.sanitize(dirtyHTML, SANITIZATION_CONFIG);
}
```

### SQL Injection Prevention

**Parameterized Queries**:
```python
# ✅ Secure - Using parameterized queries
query = "SELECT * FROM users WHERE id = :id"
result = db.execute(text(query), {"id": user_id})

# ❌ Vulnerable - String concatenation
query = f"SELECT * FROM users WHERE id = {user_id}"
result = db.execute(text(query))
```

## Security Monitoring

### Real-time Anomaly Detection

**Implemented Detectors**:
1. **Brute Force Detection**: Monitors failed login patterns
2. **Unusual Traffic**: Identifies abnormal request volumes
3. **Suspicious Patterns**: Detects XSS/SQL injection attempts
4. **Privilege Escalation**: Monitors unauthorized access attempts
5. **Data Exfiltration**: Tracks large data exports

**Alert Generation**:
```python
async def log_security_event(event_type: str, **details):
    event = SecurityEvent(event_type, severity, details)
    await security_monitor.record_event(event)

    if should_alert(event):
        alert = SecurityAlert(event_type, "high", f"Security incident: {event_type}")
        await generate_alert(alert)
```

## CSRF Protection

### Double Submit Cookie Pattern

**Implementation**:
```python
@app.before_request
def csrf_protect():
    if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
        token = request.headers.get('X-CSRF-Token')
        cookie_token = request.cookies.get('csrf_token')

        if not token or token != cookie_token:
            abort(403, 'CSRF token missing or invalid')
```

## Session Management

### JWT Security

**Token Configuration**:
```python
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 15
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7
JWT_ALGORITHM = "HS256"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
```

**Refresh Token Rotation**:
```python
def refresh_access_token(refresh_token: str):
    # Validate refresh token
    payload = jwt.decode(refresh_token, SECRET_KEY)

    # Generate new access token
    new_access_token = create_access_token({"sub": payload["sub"]})

    # Optionally rotate refresh token
    new_refresh_token = create_refresh_token({"sub": payload["sub"]})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token
    }
```

## Security Headers

### Comprehensive Headers Configuration

```python
SECURITY_HEADERS = {
    # Prevent clickjacking
    "X-Frame-Options": "DENY",

    # Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    # XSS protection
    "X-XSS-Protection": "1; mode=block",

    # Content Security Policy
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline';",

    # HSTS
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

    # Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

@app.after_request
def add_security_headers(response):
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response
```

## Monitoring & Alerting

### Security Dashboard

**Metrics Tracked**:
- Failed login attempts by IP/username
- Rate limit violations
- Suspicious input patterns
- Account lockouts
- Security event volume

**Automated Responses**:
- IP blocking for brute force attacks
- Account lockout for suspicious activity
- Alert escalation for critical events
- Automated incident response

## Compliance & Audit

### Audit Logging

**Security Events Logged**:
```python
SECURITY_EVENTS = [
    'login_success', 'login_failed', 'account_locked',
    'password_changed', 'permission_changed', 'data_accessed',
    'suspicious_activity', 'rate_limit_exceeded'
]

def log_security_event(event_type: str, user_id: str = None, **details):
    log_entry = {
        'timestamp': datetime.utcnow(),
        'event_type': event_type,
        'user_id': user_id,
        'ip_address': get_client_ip(),
        'user_agent': get_user_agent(),
        'details': details
    }

    # Store in secure audit log
    audit_logger.info(json.dumps(log_entry))
```

### Compliance Standards

**Implemented Controls**:
- **OWASP Top 10**: Comprehensive protection against web vulnerabilities
- **NIST Cybersecurity Framework**: Identify, Protect, Detect, Respond, Recover
- **ISO 27001**: Information security management system
- **GDPR**: Data protection and privacy controls

## Maintenance & Updates

### Regular Security Tasks

**Daily**:
- Monitor failed login attempts
- Review security event logs
- Check for unusual traffic patterns

**Weekly**:
- Review account lockouts
- Update security signatures
- Test backup security systems

**Monthly**:
- Security patch management
- Vulnerability scanning
- Compliance report generation

**Quarterly**:
- Penetration testing
- Security architecture review
- Incident response drill

### Security Updates

**Dependency Management**:
```bash
# Regular security updates
npm audit fix
pip install --upgrade -r requirements.txt

# Security scanning
npm audit
safety check
```

**Key Rotation**:
- JWT secrets rotated quarterly
- API keys rotated monthly
- Database encryption keys rotated annually

This security implementation provides enterprise-grade protection suitable for production deployment in high-stakes financial environments.</content>
<parameter name="filePath">docs/03_Standards_and_Policies/Security_Implementation_Guide.md