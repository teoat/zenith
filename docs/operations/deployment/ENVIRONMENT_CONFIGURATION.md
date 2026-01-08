# Zenith Fraud Detection Platform - Environment Configuration Guide

## Overview
This guide covers the environment variables and configuration settings required to run the Zenith platform securely and efficiently.

## Required Environment Variables

### Security Configuration (MANDATORY)
```bash
# Primary encryption key for sensitive data (32-byte base64 encoded)
FIELD_ENCRYPTION_KEY="your-32-byte-base64-fernet-key-here"

# Alternative encryption key (can be same as FIELD_ENCRYPTION_KEY)
ENCRYPTION_KEY="your-32-byte-base64-fernet-key-here"

# General application secret key
SECRET_KEY="your-application-secret-key-here"
```

### Database Configuration
```bash
# Database connection URL
DATABASE_URL="postgresql://user:password@localhost:5432/zenith_db"

# For development/testing
DATABASE_URL="sqlite:///./zenith.db"
```

### External Services
```bash
# Redis for caching and session storage
REDIS_URL="redis://localhost:6379/0"

# Optional: External services
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### Application Settings
```bash
# Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL="INFO"

# Application environment
ENVIRONMENT="production"  # or "development", "staging"

# CORS origins (comma-separated)
CORS_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# Session settings
SESSION_SECRET="another-secure-random-key"
SESSION_TIMEOUT_MINUTES="1440"  # 24 hours
```

## Generating Secure Keys

### Fernet Encryption Keys
```bash
# Generate a valid Fernet key (32 bytes, base64 encoded)
python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

### Application Secret Keys
```bash
# Generate a secure random key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Environment File Templates

### Production (.env.production)
```bash
# Production Environment Configuration
ENVIRONMENT=production
LOG_LEVEL=WARNING

# Security - Use strong, unique keys
FIELD_ENCRYPTION_KEY="FKzrNO8gbxaVVAHxV5qB7M3UX9N2omjmyyAVeBqBLJ4="
ENCRYPTION_KEY="FKzrNO8gbxaVVAHxV5qB7M3UX9N2omjmyyAVeBqBLJ4="
SECRET_KEY="production-secret-key-change-this-in-production"
SESSION_SECRET="production-session-secret-change-this"

# Database
DATABASE_URL="postgresql://zenith_user:secure_password@db.host.com:5432/zenith_prod"

# Redis
REDIS_URL="redis://prod-redis.host.com:6379/0"

# CORS
CORS_ORIGINS="https://zenith.yourcompany.com"

# External APIs (if used)
OPENAI_API_KEY="sk-prod-..."
```

### Development (.env.development)
```bash
# Development Environment Configuration
ENVIRONMENT=development
LOG_LEVEL=DEBUG

# Security - Test keys (NEVER use in production)
FIELD_ENCRYPTION_KEY="m67Uv-neF2aFHI4hVLve7qIr9N4gHHUFDBkiUnKovcw="
ENCRYPTION_KEY="m67Uv-neF2aFHI4hVLve7qIr9N4gHHUFDBkiUnKovcw="
SECRET_KEY="dev-secret-key-safe-for-development-only"
SESSION_SECRET="dev-session-secret"

# Database
DATABASE_URL="sqlite:///./zenith_dev.db"

# Redis (optional for development)
REDIS_URL="redis://localhost:6379/1"

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### Testing (.env.test)
```bash
# Test Environment Configuration
ENVIRONMENT=testing
LOG_LEVEL=WARNING
TESTING=True

# Security - Test keys
FIELD_ENCRYPTION_KEY="FKzrNO8gbxaVVAHxV5qB7M3UX9N2omjmyyAVeBqBLJ4="
ENCRYPTION_KEY="FKzrNO8gbxaVVAHxV5qB7M3UX9N2omjmyyAVeBqBLJ4="
SECRET_KEY="test-secret-key"
SESSION_SECRET="test-session-secret"

# In-memory database for tests
DATABASE_URL="sqlite:///:memory:"

# Mock Redis for tests
REDIS_URL="redis://localhost:6379/2"
```

## Security Best Practices

### Key Management
1. **Never commit real keys** to version control
2. **Rotate keys regularly** (quarterly minimum)
3. **Use different keys** for each environment
4. **Store keys securely** (AWS KMS, Azure Key Vault, etc.)

### Environment Separation
1. **Development**: Use test keys, local databases
2. **Staging**: Mirror production setup with test data
3. **Production**: Use strong, unique keys and secure databases

### Monitoring
1. **Log access** to sensitive configuration
2. **Monitor key usage** patterns
3. **Alert on suspicious activity**
4. **Regular security audits**

## Validation

### Key Validation Script
```python
#!/usr/bin/env python3
import os
import base64
import sys

def validate_fernet_key(key: str) -> bool:
    """Validate that a key is a proper Fernet key"""
    try:
        # Fernet keys must be 32 bytes when decoded
        decoded = base64.urlsafe_b64decode(key)
        return len(decoded) == 32
    except Exception:
        return False

def main():
    required_vars = ['FIELD_ENCRYPTION_KEY', 'SECRET_KEY']
    optional_vars = ['ENCRYPTION_KEY', 'SESSION_SECRET']

    missing = []
    invalid = []

    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
        elif var.endswith('_ENCRYPTION_KEY') and not validate_fernet_key(os.getenv(var)):
            invalid.append(f"{var} (invalid Fernet key)")

    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)

    if invalid:
        print(f"❌ Invalid environment variables: {', '.join(invalid)}")
        sys.exit(1)

    print("✅ Environment configuration is valid")

if __name__ == "__main__":
    main()
```

## Deployment Checklist

- [ ] Environment variables set correctly
- [ ] Keys are valid Fernet keys (32 bytes, base64)
- [ ] Database connection tested
- [ ] Redis connection available (if used)
- [ ] CORS origins configured for frontend
- [ ] Log levels appropriate for environment
- [ ] Security headers enabled
- [ ] Monitoring and alerting configured

## Troubleshooting

### Common Issues
1. **"Fernet key must be 32 url-safe base64-encoded bytes"**
   - Generate proper keys using the script above

2. **Database connection failures**
   - Check DATABASE_URL format and credentials
   - Ensure database server is running and accessible

3. **Redis connection errors**
   - Verify REDIS_URL format
   - Check Redis server status and network connectivity

4. **CORS errors in frontend**
   - Add frontend domain to CORS_ORIGINS
   - Check protocol (http vs https) matches

### Health Checks
Run these commands to verify configuration:
```bash
# Validate environment
python scripts/validate_environment.py

# Test database connection
python -c "from core.database import engine; print('DB connected' if engine else 'DB failed')"

# Test Redis connection (if used)
python -c "import redis; r = redis.from_url(os.getenv('REDIS_URL')); r.ping(); print('Redis connected')"
```