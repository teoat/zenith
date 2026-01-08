"""
Unit Tests for Security Controls
Tests rate limiting, JWT auth, RBAC, encryption, and input validation
"""

import pytest
import time
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta

# Import security module
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Check for optional dependencies
try:
    import jwt
    HAS_JWT = True
except ImportError:
    HAS_JWT = False

try:
    from cryptography.fernet import Fernet
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False

from services.shared.security.security_controls import (
    RateLimiter, RateLimitConfig,
    AuthorizationChecker, Permission, ROLE_PERMISSIONS,
    InputSanitizer,
    AuditLogger,
    CSRFProtection,
    SECURITY_HEADERS,
)

# Conditionally import JWT and encryption classes
if HAS_JWT:
    from services.shared.security.security_controls import JWTAuthenticator

if HAS_CRYPTO:
    from services.shared.security.security_controls import DataEncryptor



class TestRateLimiter:
    """Tests for RateLimiter class."""
    
    @pytest.fixture
    def mock_redis(self):
        redis = AsyncMock()
        pipe = AsyncMock()
        pipe.execute = AsyncMock(return_value=[None, None, 5, True])
        redis.pipeline = Mock(return_value=pipe)
        return redis
    
    @pytest.fixture
    def rate_limiter(self, mock_redis):
        config = RateLimitConfig(requests_per_minute=60)
        return RateLimiter(mock_redis, config)
    
    @pytest.mark.asyncio
    async def test_is_allowed_under_limit(self, rate_limiter):
        """Test request is allowed when under limit."""
        allowed, info = await rate_limiter.is_allowed("user123", "api")
        assert allowed is True
        assert info["remaining"] == 55
        assert info["limit"] == 60
    
    @pytest.mark.asyncio
    async def test_is_allowed_over_limit(self, mock_redis):
        """Test request is denied when over limit."""
        pipe = AsyncMock()
        pipe.execute = AsyncMock(return_value=[None, None, 65, True])
        mock_redis.pipeline = Mock(return_value=pipe)
        
        config = RateLimitConfig(requests_per_minute=60)
        limiter = RateLimiter(mock_redis, config)
        
        allowed, info = await limiter.is_allowed("user123", "api")
        assert allowed is False
        assert info["remaining"] == 0
    
    @pytest.mark.asyncio
    async def test_get_limit_headers(self, rate_limiter):
        """Test rate limit headers generation."""
        headers = await rate_limiter.get_limit_headers("user123", "api")
        assert "X-RateLimit-Limit" in headers
        assert "X-RateLimit-Remaining" in headers
        assert "X-RateLimit-Reset" in headers


@pytest.mark.skipif(not HAS_JWT, reason="PyJWT not installed")
class TestJWTAuthenticator:
    """Tests for JWTAuthenticator class."""
    
    @pytest.fixture
    def authenticator(self):
        return JWTAuthenticator(secret_key="test-secret-key-12345")
    
    def test_create_access_token(self, authenticator):
        """Test access token creation."""
        token = authenticator.create_access_token("user123", ["admin"])
        assert token is not None
        assert isinstance(token, str)
    
    def test_verify_valid_token(self, authenticator):
        """Test valid token verification."""
        token = authenticator.create_access_token("user123", ["admin"])
        payload = authenticator.verify_token(token)
        
        assert payload is not None
        assert payload["sub"] == "user123"
        assert "admin" in payload["roles"]
        assert payload["type"] == "access"
    
    def test_verify_expired_token(self, authenticator):
        """Test expired token returns None."""
        authenticator.access_token_expire = timedelta(seconds=-1)
        token = authenticator.create_access_token("user123", ["admin"])
        
        payload = authenticator.verify_token(token)
        assert payload is None
    
    def test_verify_invalid_token(self, authenticator):
        """Test invalid token returns None."""
        payload = authenticator.verify_token("invalid.token.here")
        assert payload is None
    
    def test_create_refresh_token(self, authenticator):
        """Test refresh token creation."""
        token = authenticator.create_refresh_token("user123")
        payload = authenticator.verify_token(token)
        
        assert payload["type"] == "refresh"
        assert payload["sub"] == "user123"
    
    def test_refresh_access_token(self, authenticator):
        """Test using refresh token to get new access token."""
        refresh_token = authenticator.create_refresh_token("user123")
        new_access_token = authenticator.refresh_access_token(refresh_token)
        
        assert new_access_token is not None
        payload = authenticator.verify_token(new_access_token)
        assert payload["sub"] == "user123"
        assert payload["type"] == "access"


class TestAuthorizationChecker:
    """Tests for AuthorizationChecker class."""
    
    def test_admin_has_all_permissions(self):
        """Test admin role has all permissions."""
        assert AuthorizationChecker.has_permission(["admin"], Permission.READ_CASES)
        assert AuthorizationChecker.has_permission(["admin"], Permission.DELETE_CASES)
        assert AuthorizationChecker.has_permission(["admin"], Permission.MANAGE_USERS)
    
    def test_viewer_limited_permissions(self):
        """Test viewer role has limited permissions."""
        assert AuthorizationChecker.has_permission(["viewer"], Permission.READ_CASES)
        assert not AuthorizationChecker.has_permission(["viewer"], Permission.WRITE_CASES)
        assert not AuthorizationChecker.has_permission(["viewer"], Permission.DELETE_CASES)
    
    def test_analyst_permissions(self):
        """Test analyst role has read and write."""
        assert AuthorizationChecker.has_permission(["analyst"], Permission.READ_CASES)
        assert AuthorizationChecker.has_permission(["analyst"], Permission.WRITE_CASES)
        assert not AuthorizationChecker.has_permission(["analyst"], Permission.DELETE_CASES)
    
    def test_manager_permissions(self):
        """Test manager role permissions."""
        assert AuthorizationChecker.has_permission(["manager"], Permission.READ_CASES)
        assert AuthorizationChecker.has_permission(["manager"], Permission.WRITE_CASES)
        assert AuthorizationChecker.has_permission(["manager"], Permission.DELETE_CASES)
        assert AuthorizationChecker.has_permission(["manager"], Permission.READ_USERS)
    
    def test_multiple_roles(self):
        """Test user with multiple roles."""
        assert AuthorizationChecker.has_permission(["viewer", "analyst"], Permission.WRITE_CASES)
    
    def test_unknown_role(self):
        """Test unknown role has no permissions."""
        assert not AuthorizationChecker.has_permission(["unknown"], Permission.READ_CASES)


@pytest.mark.skipif(not HAS_CRYPTO, reason="cryptography not installed")
class TestDataEncryptor:
    """Tests for DataEncryptor class."""
    
    @pytest.fixture
    def encryptor(self):
        return DataEncryptor(encryption_key="test-encryption-key-32bytes")
    
    def test_encrypt_decrypt(self, encryptor):
        """Test data can be encrypted and decrypted."""
        original = "sensitive data here"
        encrypted = encryptor.encrypt(original)
        decrypted = encryptor.decrypt(encrypted)
        
        assert encrypted != original
        assert decrypted == original
    
    def test_encrypted_data_is_different(self, encryptor):
        """Test same data encrypted twice produces different ciphertext."""
        data = "test data"
        encrypted1 = encryptor.encrypt(data)
        encrypted2 = encryptor.encrypt(data)
        
        # Fernet uses random IV, so encryptions should differ
        assert encrypted1 != encrypted2
    
    def test_no_key_returns_original(self):
        """Test encryptor without key returns original data."""
        with patch.dict('os.environ', {}, clear=True):
            encryptor = DataEncryptor(encryption_key=None)
            encryptor.fernet = None  # Force no encryption
            
            data = "test data"
            assert encryptor.encrypt(data) == data
            assert encryptor.decrypt(data) == data


class TestInputSanitizer:
    """Tests for InputSanitizer class."""
    
    def test_sanitize_string_removes_null_bytes(self):
        """Test null bytes are removed."""
        result = InputSanitizer.sanitize_string("hello\x00world")
        assert result == "helloworld"
    
    def test_sanitize_string_truncates(self):
        """Test string is truncated to max length."""
        long_string = "a" * 2000
        result = InputSanitizer.sanitize_string(long_string, max_length=100)
        assert len(result) == 100
    
    def test_sanitize_string_strips_whitespace(self):
        """Test whitespace is stripped."""
        result = InputSanitizer.sanitize_string("  hello  ")
        assert result == "hello"
    
    def test_sanitize_string_non_string_raises(self):
        """Test non-string input raises error."""
        with pytest.raises(ValueError):
            InputSanitizer.sanitize_string(123)
    
    def test_validate_email_valid(self):
        """Test valid email passes validation."""
        assert InputSanitizer.validate_email("user@example.com")
        assert InputSanitizer.validate_email("user.name+tag@example.co.uk")
    
    def test_validate_email_invalid(self):
        """Test invalid emails fail validation."""
        assert not InputSanitizer.validate_email("invalid")
        assert not InputSanitizer.validate_email("@example.com")
        assert not InputSanitizer.validate_email("user@")
    
    def test_sanitize_sql_identifier_valid(self):
        """Test valid SQL identifiers pass."""
        assert InputSanitizer.sanitize_sql_identifier("users") == "users"
        assert InputSanitizer.sanitize_sql_identifier("_private") == "_private"
        assert InputSanitizer.sanitize_sql_identifier("Table123") == "Table123"
    
    def test_sanitize_sql_identifier_invalid(self):
        """Test invalid SQL identifiers raise error."""
        with pytest.raises(ValueError):
            InputSanitizer.sanitize_sql_identifier("123table")
        with pytest.raises(ValueError):
            InputSanitizer.sanitize_sql_identifier("table-name")
        with pytest.raises(ValueError):
            InputSanitizer.sanitize_sql_identifier("DROP TABLE users;--")


class TestCSRFProtection:
    """Tests for CSRFProtection class."""
    
    @pytest.fixture
    def csrf(self):
        return CSRFProtection(secret_key="test-csrf-secret")
    
    def test_generate_token(self, csrf):
        """Test token generation."""
        token = csrf.generate_token("session123")
        assert token is not None
        assert "session123" in token
    
    def test_validate_valid_token(self, csrf):
        """Test valid token passes validation."""
        token = csrf.generate_token("session123")
        assert csrf.validate_token(token, "session123") is True
    
    def test_validate_wrong_session(self, csrf):
        """Test token with wrong session fails."""
        token = csrf.generate_token("session123")
        assert csrf.validate_token(token, "session456") is False
    
    def test_validate_expired_token(self, csrf):
        """Test expired token fails validation."""
        # Create token and test with max_age=-1 to simulate expiration
        token = csrf.generate_token("session123")
        # max_age=-1 means token is already expired
        assert csrf.validate_token(token, "session123", max_age=-1) is False
    
    def test_validate_invalid_token(self, csrf):
        """Test invalid token format fails."""
        assert csrf.validate_token("invalid", "session123") is False
        assert csrf.validate_token("a:b", "session123") is False


class TestSecurityHeaders:
    """Tests for security headers configuration."""
    
    def test_required_headers_present(self):
        """Test all required security headers are defined."""
        required = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security",
            "Content-Security-Policy",
        ]
        for header in required:
            assert header in SECURITY_HEADERS
    
    def test_hsts_max_age(self):
        """Test HSTS has appropriate max-age."""
        hsts = SECURITY_HEADERS["Strict-Transport-Security"]
        assert "max-age=31536000" in hsts  # 1 year
    
    def test_frame_options_deny(self):
        """Test X-Frame-Options is DENY."""
        assert SECURITY_HEADERS["X-Frame-Options"] == "DENY"


class TestAuditLogger:
    """Tests for AuditLogger class."""
    
    @pytest.fixture
    def mock_logger(self):
        return Mock()
    
    @pytest.fixture
    def audit_logger(self, mock_logger):
        audit = AuditLogger()
        audit.logger = mock_logger
        return audit
    
    def test_log_authentication(self, audit_logger, mock_logger):
        """Test authentication logging."""
        audit_logger.log_authentication("user123", True, "192.168.1.1", "password")
        mock_logger.info.assert_called_once()
    
    def test_log_authorization(self, audit_logger, mock_logger):
        """Test authorization logging."""
        audit_logger.log_authorization("user123", "cases", "read", True)
        mock_logger.info.assert_called_once()
    
    def test_log_data_access(self, audit_logger, mock_logger):
        """Test data access logging."""
        audit_logger.log_data_access("user123", "case", "case-001", "read")
        mock_logger.info.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
