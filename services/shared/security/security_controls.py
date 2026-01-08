"""
Security Implementation Module
Rate limiting, authentication, authorization, and security controls
"""

import os
import time
import hashlib
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from functools import wraps
from dataclasses import dataclass
from enum import Enum

# JWT and cryptography - optional imports with fallbacks
try:
    import jwt
except ImportError:
    jwt = None  # Will use mock in tests

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    Fernet = None
    hashes = None
    PBKDF2HMAC = None

import base64


class Permission(Enum):
    """RBAC permissions."""
    READ_CASES = "read:cases"
    WRITE_CASES = "write:cases"
    DELETE_CASES = "delete:cases"
    READ_USERS = "read:users"
    MANAGE_USERS = "manage:users"
    ADMIN = "admin"


ROLE_PERMISSIONS = {
    "viewer": [Permission.READ_CASES],
    "analyst": [Permission.READ_CASES, Permission.WRITE_CASES],
    "manager": [Permission.READ_CASES, Permission.WRITE_CASES, Permission.DELETE_CASES, Permission.READ_USERS],
    "admin": [Permission.ADMIN],
}


@dataclass
class RateLimitConfig:
    """Rate limit configuration."""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_limit: int = 10


class RateLimiter:
    """Token bucket rate limiter with Redis backend."""
    
    def __init__(self, redis_client, config: RateLimitConfig = None):
        self.redis = redis_client
        self.config = config or RateLimitConfig()
    
    async def is_allowed(self, identifier: str, endpoint: str = "default") -> tuple[bool, Dict[str, Any]]:
        """Check if request is allowed under rate limits."""
        key = f"ratelimit:{identifier}:{endpoint}"
        now = time.time()
        window = 60  # 1 minute window
        
        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window + 1)
        
        results = await pipe.execute()
        request_count = results[2]
        
        allowed = request_count <= self.config.requests_per_minute
        
        return allowed, {
            "limit": self.config.requests_per_minute,
            "remaining": max(0, self.config.requests_per_minute - request_count),
            "reset": int(now + window),
        }
    
    async def get_limit_headers(self, identifier: str, endpoint: str = "default") -> Dict[str, str]:
        """Get rate limit headers for response."""
        allowed, info = await self.is_allowed(identifier, endpoint)
        return {
            "X-RateLimit-Limit": str(info["limit"]),
            "X-RateLimit-Remaining": str(info["remaining"]),
            "X-RateLimit-Reset": str(info["reset"]),
        }


class JWTAuthenticator:
    """JWT-based authentication."""
    
    def __init__(self, secret_key: str = None, algorithm: str = "HS256"):
        self.secret_key = secret_key or os.getenv("JWT_SECRET_KEY")
        self.algorithm = algorithm
        self.access_token_expire = timedelta(minutes=30)
        self.refresh_token_expire = timedelta(days=7)
        if jwt is None:
            raise ImportError("PyJWT is required for JWT authentication. Install with: pip install PyJWT")
    
    def create_access_token(self, user_id: str, roles: list[str], extra_claims: dict = None) -> str:
        """Create a new access token."""
        now = datetime.utcnow()
        claims = {
            "sub": user_id,
            "roles": roles,
            "type": "access",
            "iat": now,
            "exp": now + self.access_token_expire,
            "jti": secrets.token_urlsafe(16),
        }
        if extra_claims:
            claims.update(extra_claims)
        return jwt.encode(claims, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: str) -> str:
        """Create a new refresh token."""
        now = datetime.utcnow()
        claims = {
            "sub": user_id,
            "type": "refresh",
            "iat": now,
            "exp": now + self.refresh_token_expire,
            "jti": secrets.token_urlsafe(16),
        }
        return jwt.encode(claims, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """Use refresh token to get new access token."""
        payload = self.verify_token(refresh_token)
        if payload and payload.get("type") == "refresh":
            return self.create_access_token(payload["sub"], [])
        return None


class AuthorizationChecker:
    """RBAC authorization checker."""
    
    @staticmethod
    def has_permission(user_roles: list[str], required_permission: Permission) -> bool:
        """Check if user has required permission."""
        for role in user_roles:
            if role in ROLE_PERMISSIONS:
                role_perms = ROLE_PERMISSIONS[role]
                if Permission.ADMIN in role_perms or required_permission in role_perms:
                    return True
        return False
    
    @staticmethod
    def require_permission(permission: Permission):
        """Decorator to require permission for endpoint."""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                request = kwargs.get("request") or args[0]
                user = getattr(request.state, "user", None)
                if not user:
                    raise PermissionError("Authentication required")
                
                if not AuthorizationChecker.has_permission(user.get("roles", []), permission):
                    raise PermissionError(f"Permission {permission.value} required")
                
                return await func(*args, **kwargs)
            return wrapper
        return decorator


class DataEncryptor:
    """AES encryption for sensitive data at rest."""
    
    def __init__(self, encryption_key: str = None):
        key = encryption_key or os.getenv("ENCRYPTION_KEY")
        if key:
            # Derive a proper Fernet key from the provided key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b"zenith_salt_v1",
                iterations=100000,
            )
            derived_key = base64.urlsafe_b64encode(kdf.derive(key.encode()))
            self.fernet = Fernet(derived_key)
        else:
            self.fernet = None
    
    def encrypt(self, data: str) -> str:
        """Encrypt sensitive data."""
        if not self.fernet:
            return data
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        if not self.fernet:
            return encrypted_data
        return self.fernet.decrypt(encrypted_data.encode()).decode()


class InputSanitizer:
    """Input validation and sanitization."""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """Sanitize string input."""
        if not isinstance(value, str):
            raise ValueError("Expected string input")
        
        # Remove null bytes
        value = value.replace("\x00", "")
        
        # Truncate to max length
        value = value[:max_length]
        
        # Strip leading/trailing whitespace
        value = value.strip()
        
        return value
    
    @staticmethod
    def sanitize_sql_identifier(value: str) -> str:
        """Sanitize SQL identifier (table/column names)."""
        import re
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', value):
            raise ValueError(f"Invalid SQL identifier: {value}")
        return value
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))


class AuditLogger:
    """Security audit logging."""
    
    def __init__(self, logger=None):
        self.logger = logger or self._default_logger()
    
    def _default_logger(self):
        import logging
        logger = logging.getLogger("security.audit")
        logger.setLevel(logging.INFO)
        return logger
    
    def log_authentication(self, user_id: str, success: bool, ip_address: str, method: str = "password"):
        """Log authentication attempt."""
        self.logger.info(
            "AUTHENTICATION",
            extra={
                "event_type": "authentication",
                "user_id": user_id,
                "success": success,
                "ip_address": ip_address,
                "method": method,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
    
    def log_authorization(self, user_id: str, resource: str, action: str, allowed: bool):
        """Log authorization decision."""
        self.logger.info(
            "AUTHORIZATION",
            extra={
                "event_type": "authorization",
                "user_id": user_id,
                "resource": resource,
                "action": action,
                "allowed": allowed,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
    
    def log_data_access(self, user_id: str, resource_type: str, resource_id: str, operation: str):
        """Log data access."""
        self.logger.info(
            "DATA_ACCESS",
            extra={
                "event_type": "data_access",
                "user_id": user_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "operation": operation,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


class CSRFProtection:
    """CSRF token generation and validation."""
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or os.getenv("CSRF_SECRET_KEY", os.getenv("SECRET_KEY"))
    
    def generate_token(self, session_id: str) -> str:
        """Generate CSRF token for session."""
        timestamp = str(int(time.time()))
        data = f"{session_id}:{timestamp}"
        signature = hashlib.sha256(f"{data}:{self.secret_key}".encode()).hexdigest()
        return f"{data}:{signature}"
    
    def validate_token(self, token: str, session_id: str, max_age: int = 3600) -> bool:
        """Validate CSRF token."""
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return False
            
            stored_session, timestamp, signature = parts
            
            # Check session matches
            if stored_session != session_id:
                return False
            
            # Check not expired
            if int(time.time()) - int(timestamp) > max_age:
                return False
            
            # Check signature
            expected = hashlib.sha256(f"{stored_session}:{timestamp}:{self.secret_key}".encode()).hexdigest()
            return secrets.compare_digest(signature, expected)
        except Exception:
            return False


# Security headers middleware configuration
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}
