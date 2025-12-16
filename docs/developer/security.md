# Security Implementation Guide

This comprehensive guide covers the security implementation details, best practices, and compliance requirements for the Simple378 Fraud Detection system.

## 📋 Table of Contents

- [Security Architecture Overview](#-security-architecture-overview)
- [Authentication & Authorization](#-authentication--authorization)
- [Data Protection](#-data-protection)
- [Secure Development Practices](#-secure-development-practices)
- [Security Monitoring](#-security-monitoring)
- [Compliance Requirements](#-compliance-requirements)
- [Incident Response](#-incident-response)
- [Security Testing](#-security-testing)

## 🏗️ Security Architecture Overview

### Defense in Depth Strategy

Simple378 implements a comprehensive defense-in-depth security strategy with multiple layers of protection:

```
┌─────────────────────────────────────────────────────────────┐
│                    Network Security Layer                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Firewalls     │  │   VPN/Zero      │  │   DDoS       │  │
│  │   & WAF         │  │   Trust         │  │   Protection │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Security Layer                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Authentication  │  │ Authorization    │  │ Input        │  │
│  │ & Session Mgmt  │  │ & Access Control │  │ Validation   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Encryption    │  │   Audit Logging  │  │   Error      │  │
│  │   (TLS 1.3)     │  │   & Monitoring   │  │   Handling   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Security Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Encryption    │  │   Database       │  │   File       │  │
│  │   at Rest       │  │   Security       │  │   Security   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Backup        │  │   Data           │  │   Key        │  │
│  │   Security      │  │   Classification  │  │   Management │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

#### Core Security Principles
- **Least Privilege**: Users and systems have minimum required permissions
- **Fail-Safe Defaults**: Secure defaults with explicit permission grants
- **Defense in Depth**: Multiple security layers protect against breaches
- **Zero Trust**: Never trust, always verify all access requests
- **Secure by Design**: Security built into architecture from the start

#### Security Controls
- **Preventive Controls**: Stop attacks before they occur
- **Detective Controls**: Identify security incidents in progress
- **Corrective Controls**: Restore systems after security incidents
- **Deterrent Controls**: Discourage potential attackers
- **Recovery Controls**: Enable system restoration after incidents

## 🔐 Authentication & Authorization

### Multi-Factor Authentication (MFA)

#### MFA Implementation
```python
# MFA configuration and validation
from fido2.server import Fido2Server
from fido2.webauthn import PublicKeyCredentialRpEntity
import pyotp

class MFAService:
    def __init__(self):
        self.rp = PublicKeyCredentialRpEntity(
            name="Simple378",
            id="api.378x492.com"
        )
        self.server = Fido2Server(self.rp)

    async def setup_totp(self, user_id: str) -> str:
        """Set up TOTP for user"""
        secret = pyotp.random_base32()
        # Store secret securely for user
        await self._store_user_secret(user_id, secret)

        # Generate provisioning URI
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(
            name=f"Simple378:{user_id}",
            issuer_name="Simple378 Fraud Detection"
        )
        return uri

    async def verify_totp(self, user_id: str, code: str) -> bool:
        """Verify TOTP code"""
        secret = await self._get_user_secret(user_id)
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

    async def setup_webauthn(self, user_id: str, credential_data: dict):
        """Set up WebAuthn/FIDO2 authentication"""
        # Store credential data for user
        await self._store_credential(user_id, credential_data)

    async def verify_webauthn(self, user_id: str, credential: dict) -> bool:
        """Verify WebAuthn authentication"""
        stored_credential = await self._get_credential(user_id)
        # Verify credential against stored data
        return await self.server.authenticate_complete(
            stored_credential,
            credential
        )
```

#### MFA Policies
```json
{
  "mfa": {
    "required_roles": ["administrator", "investigator"],
    "grace_period_days": 7,
    "backup_codes_count": 10,
    "max_failed_attempts": 3,
    "lockout_duration_minutes": 15,
    "allowed_methods": ["totp", "webauthn", "sms"],
    "remember_device_days": 30
  }
}
```

### JWT Token Security

#### Secure JWT Implementation
```python
# JWT token creation and validation
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwt, JWTError
import secrets

class JWTService:
    def __init__(self):
        # Load RSA private key for signing
        with open("keys/jwt_private.pem", "rb") as f:
            self.private_key = serialization.load_pem_private_key(
                f.read(),
                password=None
            )

        # Load RSA public key for verification
        with open("keys/jwt_public.pem", "rb") as f:
            self.public_key = serialization.load_pem_public_key(f.read())

    def create_access_token(self, data: dict, expires_delta: timedelta = None):
        """Create signed JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)

        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "iss": "378x492",
            "aud": "378x492-api",
            "jti": secrets.token_urlsafe(32),  # Unique token ID
            "type": "access"
        })

        # Sign token with RSA private key
        encoded_jwt = jwt.encode(
            to_encode,
            self.private_key,
            algorithm="RS256"
        )
        return encoded_jwt

    def create_refresh_token(self, user_id: str):
        """Create long-lived refresh token"""
        expire = datetime.utcnow() + timedelta(days=30)
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "iss": "378x492",
            "aud": "378x492-api",
            "jti": secrets.token_urlsafe(32),
            "type": "refresh"
        }

        return jwt.encode(to_encode, self.private_key, algorithm="RS256")

    async def verify_token(self, token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            # Verify signature and claims
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=["RS256"],
                audience="378x492-api",
                issuer="378x492"
            )

            # Check token revocation
            if await self._is_token_revoked(payload["jti"]):
                raise JWTError("Token has been revoked")

            return payload

        except JWTError as e:
            logger.warning(f"JWT verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
```

#### Session Management
```python
# Secure session management
class SessionManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.session_ttl = 3600  # 1 hour

    async def create_session(self, user_id: str, user_agent: str, ip_address: str) -> str:
        """Create new user session"""
        session_id = secrets.token_urlsafe(32)

        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "user_agent": user_agent,
            "ip_address": ip_address,
            "last_activity": datetime.utcnow().isoformat()
        }

        # Store session in Redis with TTL
        await self.redis.setex(
            f"session:{session_id}",
            self.session_ttl,
            json.dumps(session_data)
        )

        # Track user sessions
        await self.redis.sadd(f"user_sessions:{user_id}", session_id)

        return session_id

    async def validate_session(self, session_id: str) -> dict:
        """Validate session and return user data"""
        session_key = f"session:{session_id}"
        session_data = await self.redis.get(session_key)

        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid"
            )

        session = json.loads(session_data)

        # Update last activity
        session["last_activity"] = datetime.utcnow().isoformat()
        await self.redis.setex(
            session_key,
            self.session_ttl,
            json.dumps(session)
        )

        return session

    async def destroy_session(self, session_id: str, user_id: str):
        """Destroy user session"""
        await self.redis.delete(f"session:{session_id}")
        await self.redis.srem(f"user_sessions:{user_id}", session_id)

    async def destroy_all_user_sessions(self, user_id: str):
        """Destroy all sessions for a user (logout everywhere)"""
        session_ids = await self.redis.smembers(f"user_sessions:{user_id}")

        if session_ids:
            # Delete all user sessions
            await self.redis.delete(*[f"session:{sid}" for sid in session_ids])
            await self.redis.delete(f"user_sessions:{user_id}")
```

### Role-Based Access Control (RBAC)

#### Permission System
```python
# Role and permission definitions
PERMISSIONS = {
    "case.create": "Create new cases",
    "case.read": "View cases",
    "case.update": "Modify cases",
    "case.delete": "Delete cases",
    "evidence.upload": "Upload evidence files",
    "evidence.download": "Download evidence files",
    "report.generate": "Generate reports",
    "user.manage": "Manage users",
    "system.admin": "System administration"
}

ROLES = {
    "viewer": [
        "case.read",
        "evidence.download",
        "report.generate"
    ],
    "investigator": [
        "case.create",
        "case.read",
        "case.update",
        "evidence.upload",
        "evidence.download",
        "report.generate"
    ],
    "administrator": [
        "case.create",
        "case.read",
        "case.update",
        "case.delete",
        "evidence.upload",
        "evidence.download",
        "report.generate",
        "user.manage",
        "system.admin"
    ]
}

class RBACService:
    def __init__(self):
        self.permissions = PERMISSIONS
        self.roles = ROLES

    def has_permission(self, user_roles: list, permission: str) -> bool:
        """Check if user has specific permission"""
        for role in user_roles:
            if role in self.roles and permission in self.roles[role]:
                return True
        return False

    def get_user_permissions(self, user_roles: list) -> list:
        """Get all permissions for user's roles"""
        user_permissions = set()
        for role in user_roles:
            if role in self.roles:
                user_permissions.update(self.roles[role])
        return list(user_permissions)

    def add_role_permission(self, role: str, permission: str):
        """Add permission to role"""
        if role not in self.roles:
            self.roles[role] = []
        if permission not in self.roles[role]:
            self.roles[role].append(permission)

    def remove_role_permission(self, role: str, permission: str):
        """Remove permission from role"""
        if role in self.roles and permission in self.roles[role]:
            self.roles[role].remove(permission)
```

## 🛡️ Data Protection

### Database Encryption

#### Transparent Data Encryption (TDE)
```sql
-- Enable TDE for PostgreSQL
CREATE EXTENSION pgcrypto;

-- Create encrypted tables
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    title bytea,  -- Encrypted
    description bytea,  -- Encrypted
    case_type VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Encryption functions
CREATE OR REPLACE FUNCTION encrypt_data(data text, key text)
RETURNS bytea AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_data(data bytea, key text)
RETURNS text AS $$
BEGIN
    RETURN pgp_sym_decrypt(data, key);
END;
$$ LANGUAGE plpgsql;

-- Usage in application code
INSERT INTO cases (title, description, case_type, status)
VALUES (
    encrypt_data('Credit Card Fraud Case', 'ENCRYPTION_KEY'),
    encrypt_data('Investigation of suspicious transactions', 'ENCRYPTION_KEY'),
    'financial_fraud',
    'open'
);

-- Decryption in queries
SELECT
    id,
    decrypt_data(title, 'ENCRYPTION_KEY') as title,
    decrypt_data(description, 'ENCRYPTION_KEY') as description,
    case_type,
    status
FROM cases
WHERE id = 1;
```

#### Field-Level Encryption
```python
# Application-level field encryption
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

class FieldEncryption:
    def __init__(self, master_key: str):
        # Derive encryption key from master key
        salt = b'378x492_salt'  # In production, use unique salt per deployment
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        self.cipher = Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypt sensitive field data"""
        if not plaintext:
            return plaintext
        encrypted = self.cipher.encrypt(plaintext.encode())
        return base64.b64encode(encrypted).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt sensitive field data"""
        if not ciphertext:
            return ciphertext
        try:
            decrypted = self.cipher.decrypt(base64.b64decode(ciphertext))
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Invalid encrypted data")

# Usage in SQLAlchemy model
class Case(Base):
    __tablename__ = 'cases'

    id = Column(Integer, primary_key=True)
    _title = Column('title', String, nullable=False)
    _description = Column('description', Text)
    case_type = Column(String(50))
    status = Column(String(50))

    def __init__(self, **kwargs):
        super().__init__()
        self.encryption = FieldEncryption(current_app.config['ENCRYPTION_KEY'])

    @property
    def title(self):
        return self.encryption.decrypt(self._title)

    @title.setter
    def title(self, value):
        self._title = self.encryption.encrypt(value)

    @property
    def description(self):
        return self.encryption.decrypt(self._description) if self._description else None

    @description.setter
    def description(self, value):
        self._description = self.encryption.encrypt(value) if value else None
```

### File Encryption

#### Evidence File Encryption
```python
# Secure file storage with encryption
import boto3
from cryptography.fernet import Fernet
from botocore.client import Config

class SecureFileStorage:
    def __init__(self, encryption_key: str, s3_bucket: str):
        self.cipher = Fernet(encryption_key.encode())
        self.s3 = boto3.client(
            's3',
            config=Config(signature_version='s3v4')
        )
        self.bucket = s3_bucket

    async def store_file(self, file_path: str, file_data: bytes, metadata: dict = None):
        """Store encrypted file in S3"""
        # Generate unique file ID
        file_id = str(uuid.uuid4())

        # Encrypt file data
        encrypted_data = self.cipher.encrypt(file_data)

        # Calculate integrity hash
        integrity_hash = hashlib.sha256(encrypted_data).hexdigest()

        # Prepare metadata
        s3_metadata = {
            'original-filename': os.path.basename(file_path),
            'upload-timestamp': str(int(time.time())),
            'integrity-hash': integrity_hash,
            'encryption-version': '1.0'
        }

        if metadata:
            s3_metadata.update(metadata)

        # Upload to S3
        await self.s3.put_object(
            Bucket=self.bucket,
            Key=f"evidence/{file_id}",
            Body=encrypted_data,
            Metadata=s3_metadata,
            ServerSideEncryption='AES256',
            ContentType='application/octet-stream'
        )

        return file_id

    async def retrieve_file(self, file_id: str) -> bytes:
        """Retrieve and decrypt file from S3"""
        try:
            # Download from S3
            response = await self.s3.get_object(
                Bucket=self.bucket,
                Key=f"evidence/{file_id}"
            )

            encrypted_data = await response['Body'].read()
            metadata = response.get('Metadata', {})

            # Verify integrity
            expected_hash = metadata.get('integrity-hash')
            actual_hash = hashlib.sha256(encrypted_data).hexdigest()

            if expected_hash and actual_hash != expected_hash:
                raise ValueError("File integrity check failed")

            # Decrypt file data
            decrypted_data = self.cipher.decrypt(encrypted_data)

            return decrypted_data

        except Exception as e:
            logger.error(f"File retrieval failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File retrieval failed"
            )
```

## 🔒 Secure Development Practices

### Input Validation & Sanitization

#### API Input Validation
```python
# Pydantic models with validation
from pydantic import BaseModel, validator, Field
from typing import Optional, List
import re

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Case title")
    description: Optional[str] = Field(None, max_length=5000, description="Case description")
    case_type: str = Field(..., regex=r'^(financial_fraud|identity_theft|money_laundering|insurance_fraud)$')
    priority: str = Field('medium', regex=r'^(low|medium|high|critical)$')
    tags: Optional[List[str]] = Field(None, max_items=10)

    @validator('title')
    def validate_title(cls, v):
        # Prevent XSS attacks
        if '<' in v or '>' in v:
            raise ValueError('HTML tags not allowed in title')
        return v.strip()

    @validator('description')
    def validate_description(cls, v):
        if v:
            # Remove potentially dangerous HTML
            v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.IGNORECASE)
            v = re.sub(r'<[^>]+>', '', v)  # Remove all HTML tags
        return v

class EvidenceUpload(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., regex=r'^(image|document|audio|video)/.+')
    size: int = Field(..., gt=0, le=100*1024*1024)  # Max 100MB

    @validator('filename')
    def validate_filename(cls, v):
        # Prevent directory traversal
        if '..' in v or '/' in v or '\\' in v:
            raise ValueError('Invalid filename')
        # Allow only safe characters
        if not re.match(r'^[a-zA-Z0-9._-]+$', v):
            raise ValueError('Filename contains invalid characters')
        return v
```

#### SQL Injection Prevention
```python
# Safe SQL query building
from sqlalchemy import text
from sqlalchemy.orm import Session

class CaseRepository:
    def search_cases(self, db: Session, query: str, user_id: int, limit: int = 50):
        # Use parameterized queries to prevent SQL injection
        sql = text("""
            SELECT c.* FROM cases c
            WHERE c.created_by = :user_id
            AND (c.title ILIKE :search_query OR c.description ILIKE :search_query)
            ORDER BY c.created_at DESC
            LIMIT :limit
        """)

        # Parameters are automatically escaped
        result = db.execute(sql, {
            'user_id': user_id,
            'search_query': f'%{query}%',
            'limit': min(limit, 100)  # Prevent excessive results
        })

        return result.fetchall()

    def get_case_by_id(self, db: Session, case_id: int, user_id: int):
        # Use SQLAlchemy ORM for automatic protection
        return db.query(Case).filter(
            Case.id == case_id,
            Case.created_by == user_id
        ).first()
```

### Secure Coding Guidelines

#### Password Security
```python
# Secure password handling
import bcrypt
import secrets
from cryptography.hazmat.primitives import constant_time

class PasswordService:
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        # Generate salt automatically
        salt = bcrypt.gensalt(rounds=12)  # 12 rounds = ~0.5 seconds
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash using constant-time comparison"""
        try:
            # Use constant-time comparison to prevent timing attacks
            return constant_time.bytes_eq(
                bcrypt.hashpw(password.encode('utf-8'), hashed.encode('utf-8')),
                hashed.encode('utf-8')
            )
        except Exception:
            return False

    def generate_reset_token(self) -> str:
        """Generate secure password reset token"""
        return secrets.token_urlsafe(32)

    def validate_password_strength(self, password: str) -> List[str]:
        """Validate password meets security requirements"""
        errors = []

        if len(password) < 12:
            errors.append("Password must be at least 12 characters long")

        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")

        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")

        if not re.search(r'[0-9]', password):
            errors.append("Password must contain at least one number")

        if not re.search(r'[^A-Za-z0-9]', password):
            errors.append("Password must contain at least one special character")

        # Check against common passwords
        with open('common_passwords.txt', 'r') as f:
            common_passwords = set(line.strip() for line in f)

        if password.lower() in common_passwords:
            errors.append("Password is too common")

        return errors
```

#### Secure Headers & CSP
```python
# Security headers middleware
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https://api.378x492.com; "
            "frame-ancestors 'none';"
        )
        response.headers['Content-Security-Policy'] = csp

        # Remove server information
        response.headers.pop('Server', None)
        response.headers.pop('X-Powered-By', None)

        return response
```

## 📊 Security Monitoring

### Audit Logging

#### Comprehensive Audit Trail
```python
# Audit logging system
import structlog
from datetime import datetime
from enum import Enum

class AuditEvent(Enum):
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    CASE_CREATED = "case.created"
    CASE_UPDATED = "case.updated"
    CASE_DELETED = "case.deleted"
    EVIDENCE_UPLOADED = "evidence.uploaded"
    EVIDENCE_DOWNLOADED = "evidence.downloaded"
    REPORT_GENERATED = "report.generated"
    PERMISSION_CHANGED = "permission.changed"
    SECURITY_VIOLATION = "security.violation"

class AuditLogger:
    def __init__(self, log_file: str, encryption_key: str):
        self.encryption = FieldEncryption(encryption_key)
        self.logger = structlog.get_logger()

        # Configure structured logging
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

    async def log_event(
        self,
        event: AuditEvent,
        user_id: str,
        resource_id: str = None,
        details: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ):
        """Log security event"""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event.value,
            "user_id": user_id,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "session_id": self._get_current_session_id()
        }

        # Encrypt sensitive data
        if details:
            for key, value in details.items():
                if key in ['password', 'token', 'secret']:
                    details[key] = self.encryption.encrypt(str(value))

        # Log to structured logger
        self.logger.info(
            "Security event",
            **audit_entry
        )

        # Store in audit database
        await self._store_audit_entry(audit_entry)

    async def _store_audit_entry(self, entry: dict):
        """Store audit entry in encrypted database"""
        # Implementation for storing audit logs
        pass

    def _get_current_session_id(self) -> str:
        """Get current session ID from context"""
        # Implementation for session tracking
        return "session-123"
```

### Security Monitoring Dashboard

#### Real-time Security Metrics
```python
# Security monitoring service
class SecurityMonitor:
    def __init__(self, redis_client, alert_service):
        self.redis = redis_client
        self.alert_service = alert_service

    async def monitor_failed_logins(self):
        """Monitor failed login attempts"""
        while True:
            # Check failed login rate
            failed_attempts = await self.redis.get('failed_login_attempts')

            if int(failed_attempts or 0) > 10:  # Threshold
                await self.alert_service.send_alert(
                    title="High Failed Login Rate",
                    message=f"Detected {failed_attempts} failed login attempts in last 5 minutes",
                    severity="high"
                )

            await asyncio.sleep(300)  # Check every 5 minutes

    async def monitor_suspicious_activity(self):
        """Monitor for suspicious user behavior"""
        # Check for unusual login locations
        # Check for rapid password changes
        # Check for excessive data downloads
        pass

    async def monitor_api_abuse(self):
        """Monitor for API abuse patterns"""
        # Rate limiting violations
        # Unusual request patterns
        # Brute force attempts
        pass
```

## 📋 Compliance Requirements

### GDPR Compliance

#### Data Protection Measures
```python
# GDPR compliance features
class GDPRCompliance:
    def __init__(self, db_session):
        self.db = db_session

    async def handle_data_subject_request(self, user_id: str, request_type: str):
        """Handle GDPR data subject requests"""
        if request_type == "access":
            return await self._provide_data_access(user_id)
        elif request_type == "rectification":
            return await self._rectify_data(user_id)
        elif request_type == "erasure":
            return await self._erase_data(user_id)
        elif request_type == "portability":
            return await self._export_data(user_id)

    async def _erase_data(self, user_id: str):
        """Implement right to erasure"""
        # Anonymize or delete user data
        await self.db.execute("""
            UPDATE cases SET
                title = 'Anonymized Case',
                description = NULL,
                assignee_id = NULL
            WHERE created_by = :user_id
        """, {'user_id': user_id})

        # Delete direct user data
        await self.db.execute("""
            DELETE FROM user_sessions WHERE user_id = :user_id;
            DELETE FROM audit_logs WHERE user_id = :user_id;
        """, {'user_id': user_id})

        # Log erasure for compliance
        await self.audit_logger.log_event(
            AuditEvent.DATA_ERASURE,
            user_id,
            details={"erasure_type": "gdpr_request"}
        )

    async def _export_data(self, user_id: str) -> dict:
        """Implement data portability"""
        # Collect all user data
        user_data = await self.db.execute("""
            SELECT
                u.username, u.email, u.created_at,
                c.title, c.description, c.status, c.created_at as case_created,
                e.filename, e.uploaded_at
            FROM users u
            LEFT JOIN cases c ON u.id = c.created_by
            LEFT JOIN evidence e ON c.id = e.case_id
            WHERE u.id = :user_id
        """, {'user_id': user_id})

        return {
            "user_profile": user_data[0],
            "cases": [row for row in user_data if row.case_id],
            "evidence": [row for row in user_data if row.evidence_id],
            "export_date": datetime.utcnow().isoformat()
        }
```

### SOX Compliance

#### Financial Controls
```python
# SOX compliance logging
class SOXCompliance:
    def __init__(self, audit_logger):
        self.audit_logger = audit_logger

    async def log_financial_transaction(self, transaction_data: dict, user_id: str):
        """Log all financial data access and modifications"""
        await self.audit_logger.log_event(
            AuditEvent.FINANCIAL_DATA_ACCESS,
            user_id,
            resource_id=transaction_data.get('id'),
            details={
                "action": "access",
                "data_type": "financial_transaction",
                "fields_accessed": list(transaction_data.keys()),
                "justification": transaction_data.get('access_reason')
            }
        )

    async def validate_financial_controls(self, operation: str, user_id: str) -> bool:
        """Validate SOX segregation of duties"""
        # Check if user has appropriate permissions
        # Check if operation requires dual authorization
        # Log all financial control validations
        pass
```

## 🚨 Incident Response

### Security Incident Response Plan

#### Incident Classification
```python
# Incident classification system
class IncidentClassifier:
    def classify_incident(self, incident_data: dict) -> str:
        """Classify security incident severity"""
        indicators = incident_data.get('indicators', [])

        # Critical indicators
        if any(indicator in indicators for indicator in [
            'data_breach', 'unauthorized_access', 'system_compromise'
        ]):
            return 'critical'

        # High severity
        if any(indicator in indicators for indicator in [
            'suspicious_login', 'failed_authentication_burst', 'data_exfiltration'
        ]):
            return 'high'

        # Medium severity
        if any(indicator in indicators for indicator in [
            'unusual_traffic', 'configuration_change', 'failed_login'
        ]):
            return 'medium'

        return 'low'
```

#### Incident Response Workflow
```python
# Incident response orchestration
class IncidentResponse:
    def __init__(self, alert_service, forensics_service, communication_service):
        self.alert_service = alert_service
        self.forensics_service = forensics_service
        self.communication_service = communication_service

    async def handle_incident(self, incident: dict):
        """Orchestrate incident response"""
        # Classify incident
        severity = self.classifier.classify_incident(incident)

        # Assemble response team
        response_team = await self._assemble_team(severity)

        # Isolate affected systems
        await self._isolate_systems(incident)

        # Collect forensics
        evidence = await self.forensics_service.collect_evidence(incident)

        # Notify stakeholders
        await self.communication_service.notify_stakeholders(
            incident, severity, response_team
        )

        # Execute response plan
        await self._execute_response_plan(incident, severity, evidence)

        # Post-incident review
        await self._conduct_post_mortem(incident, evidence)

    async def _isolate_systems(self, incident: dict):
        """Isolate compromised systems"""
        affected_systems = incident.get('affected_systems', [])

        for system in affected_systems:
            # Disconnect from network
            await self._disconnect_system(system)

            # Disable compromised accounts
            await self._disable_accounts(system)

            # Enable enhanced monitoring
            await self._enable_monitoring(system)

    async def _execute_response_plan(self, incident: dict, severity: str, evidence: dict):
        """Execute appropriate response plan"""
        if severity == 'critical':
            # Immediate containment
            await self._emergency_containment(incident)

            # Legal notification
            await self._notify_authorities(incident)

            # Customer communication
            await self._notify_customers(incident)

        elif severity == 'high':
            # Rapid containment
            await self._rapid_containment(incident)

            # Internal escalation
            await self._escalate_internally(incident)

        # Common response actions
        await self._preserve_evidence(evidence)
        await self._implement_fixes(incident)
        await self._restore_services(incident)
```

## 🧪 Security Testing

### Automated Security Testing

#### Security Test Suite
```python
# Security test suite
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app

class TestSecurity:
    def setup_method(self):
        self.client = TestClient(app)

    def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        malicious_payload = {
            "title": "'; DROP TABLE cases; --",
            "description": "SQL injection attempt"
        }

        response = self.client.post("/api/v1/cases", json=malicious_payload)
        assert response.status_code == 422  # Validation error

    def test_xss_prevention(self):
        """Test XSS prevention"""
        xss_payload = {
            "title": "<script>alert('XSS')</script>",
            "description": "XSS attack attempt"
        }

        response = self.client.post("/api/v1/cases", json=xss_payload)
        assert response.status_code == 422

        # Verify data is sanitized
        assert "<script>" not in response.json().get('title', '')

    def test_authentication_required(self):
        """Test authentication enforcement"""
        response = self.client.get("/api/v1/cases")
        assert response.status_code == 401

    def test_authorization_enforcement(self):
        """Test authorization controls"""
        # Test with insufficient permissions
        headers = {"Authorization": "Bearer insufficient_permissions_token"}
        response = self.client.post("/api/v1/cases", json={}, headers=headers)
        assert response.status_code == 403

    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        # Make multiple rapid requests
        for _ in range(100):
            response = self.client.get("/api/v1/health")
            if response.status_code == 429:  # Too Many Requests
                break

        assert response.status_code == 429

    def test_input_validation(self):
        """Test comprehensive input validation"""
        invalid_payloads = [
            {"title": "", "case_type": "invalid_type"},
            {"title": "A" * 256, "case_type": "financial_fraud"},  # Too long
            {"title": "Valid Title", "case_type": "financial_fraud", "invalid_field": "value"}
        ]

        for payload in invalid_payloads:
            response = self.client.post("/api/v1/cases", json=payload)
            assert response.status_code == 422

    @patch('app.services.audit_service.AuditService.log_event')
    def test_audit_logging(self, mock_audit):
        """Test audit logging functionality"""
        # Perform auditable action
        response = self.client.post("/api/v1/cases", json={
            "title": "Audit Test Case",
            "case_type": "financial_fraud"
        })

        # Verify audit logging was called
        mock_audit.assert_called()

    def test_encryption_at_rest(self):
        """Test data encryption at rest"""
        # This would require database access testing
        # Verify sensitive data is encrypted in database
        pass

    def test_secure_headers(self):
        """Test security headers are present"""
        response = self.client.get("/api/v1/health")

        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        assert "Content-Security-Policy" in response.headers
```

### Penetration Testing

#### Automated Penetration Testing
```bash
# OWASP ZAP automated security testing
#!/bin/bash
# Automated security testing script

ZAP_API_KEY="your-zap-api-key"
TARGET_URL="https://api.378x492.com"

# Start ZAP daemon
docker run -d --name zap \
  -p 8080:8080 \
  -p 8090:8090 \
  -i owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.key=$ZAP_API_KEY

# Wait for ZAP to start
sleep 30

# Configure ZAP
curl "http://localhost:8080/JSON/core/action/setOptionMarketplaceAddOnInstallDir/?zapapiformat=JSON&apikey=$ZAP_API_KEY&String=%2Fhome%2Fzap%2F.owasp.org%2Fmarketplace%2F"

# Spider the application
curl "http://localhost:8080/JSON/spider/action/scan/?zapapiformat=JSON&apikey=$ZAP_API_KEY&url=$TARGET_URL&maxChildren=10"

# Wait for spidering to complete
sleep 60

# Run active scan
curl "http://localhost:8080/JSON/ascan/action/scan/?zapapiformat=JSON&apikey=$ZAP_API_KEY&url=$TARGET_URL&recurse=true&inScopeOnly=false"

# Wait for scan to complete
sleep 300

# Generate report
curl "http://localhost:8080/OTHER/core/other/htmlreport/?apikey=$ZAP_API_KEY" > security_report.html

# Check for high-risk vulnerabilities
HIGH_RISKS=$(grep -c "High" security_report.html)
if [ $HIGH_RISKS -gt 0 ]; then
  echo "High-risk vulnerabilities found: $HIGH_RISKS"
  exit 1
fi

echo "Security scan completed successfully"
```

### Vulnerability Management

#### Continuous Vulnerability Scanning
```yaml
# GitHub Actions vulnerability scanning
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Code vulnerability scanning
      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, python

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

      # Container vulnerability scanning
      - name: Build Docker image
        run: docker build -t 378x492:test .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'image'
          scan-ref: '378x492:test'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      # Dependency vulnerability scanning
      - name: Run safety (Python)
        run: safety check --full-report

      - name: Run npm audit
        run: npm audit --audit-level high

      - name: Dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Simple378'
          path: '.'
          format: 'ALL'
```

This comprehensive security implementation provides multiple layers of protection, ensuring the confidentiality, integrity, and availability of sensitive fraud investigation data while maintaining compliance with industry standards and regulatory requirements.