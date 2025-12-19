import os
import sys
sys.path.insert(0, os.path.abspath('.'))

# tests/unit/test_auth.py
import pytest
from unittest.mock import Mock, patch
from backend.app.services.infrastructure.auth_service import AuthService, auth_service
from core.database import User, UserRole


class TestAuthService:
    """Unit tests for AuthService"""

    @pytest.fixture
    def auth_svc(self):
        """Create a fresh auth service instance"""
        return AuthService()

    def test_password_hashing(self, auth_svc):
        """Test password hashing and verification"""
        password = "test_password_123"

        # Hash password
        hashed = auth_svc.hash_password(password)
        assert hashed != password
        assert hashed.startswith("$pbkdf2-sha256")

        # Verify correct password
        assert auth_svc.verify_password(password, hashed)

        # Verify incorrect password
        assert not auth_svc.verify_password("wrong_password", hashed)

    def test_create_access_token(self, auth_svc):
        """Test JWT access token creation"""
        data = {"sub": "user123", "username": "testuser"}

        token = auth_svc.create_access_token(data)

        # Decode and verify token
        decoded = auth_svc.decode_token(token)

        assert decoded["sub"] == "user123"
        assert decoded["username"] == "testuser"
        assert decoded["type"] == "access"
        assert "exp" in decoded
        assert "iat" in decoded
        assert decoded["iss"] == "378x492"

    def test_create_refresh_token(self, auth_svc):
        """Test JWT refresh token creation"""
        user_id = "user123"

        token = auth_svc.create_refresh_token(user_id)

        # Decode and verify token
        decoded = auth_svc.decode_token(token)

        assert decoded["sub"] == user_id
        assert decoded["type"] == "refresh"
        assert "exp" in decoded
        assert "iat" in decoded

    def test_decode_invalid_token(self, auth_svc):
        """Test decoding invalid tokens"""
        with pytest.raises(Exception):
            auth_svc.decode_token("invalid_token")

        with pytest.raises(Exception):
            auth_svc.decode_token("")

    @patch('backend.app.services.infrastructure.auth_service.db_service')
    def test_authenticate_user_success(self, mock_db, auth_svc):
        """Test successful user authentication"""
        # Mock user
        mock_user = Mock()
        mock_user.password_hash = auth_svc.hash_password("correct_password")
        mock_db.get_user_by_username.return_value = mock_user

        result = auth_svc.authenticate_user("testuser", "correct_password")

        assert result == mock_user
        mock_db.get_user_by_username.assert_called_once_with("testuser")

    @patch('backend.app.services.infrastructure.auth_service.db_service')
    def test_authenticate_user_failure(self, mock_db, auth_svc):
        """Test failed user authentication"""
        # Mock user
        mock_user = Mock()
        mock_user.password_hash = auth_svc.hash_password("correct_password")
        mock_db.get_user_by_username.side_effect = lambda username: mock_user if username == "testuser" else None

        # Wrong password
        result = auth_svc.authenticate_user("testuser", "wrong_password")
        assert result is None

        # Non-existent user
        result = auth_svc.authenticate_user("nonexistent", "password")
        assert result is None

    @patch('app.services.infrastructure.storage.database_service.db_service')
    def test_get_current_user_success(self, mock_db, auth_svc):
        """Test getting current authenticated user"""
        # Mock user
        mock_user = Mock()
        mock_user.id = "user123"
        mock_user.is_active = True
        mock_db.get_user.return_value = mock_user

        # Mock token
        token_data = {"sub": "user123"}
        token = auth_svc.create_access_token(token_data)

        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        result = auth_svc.get_current_user(credentials)

        assert result == mock_user
        mock_db.get_user.assert_called_once_with("user123")

    @patch('backend.app.services.infrastructure.auth_service.db_service')
    def test_get_current_user_inactive(self, mock_db, auth_svc):
        """Test getting inactive user fails"""
        # Mock inactive user
        mock_user = Mock()
        mock_user.is_active = False
        mock_db.get_user.return_value = mock_user

        token_data = {"sub": "user123"}
        token = auth_svc.create_access_token(token_data)

        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(Exception):  # Should raise HTTPException
            auth_svc.get_current_user(credentials)

    def test_role_checker_admin(self, auth_svc):
        """Test admin role requirement"""
        checker = auth_svc.require_role(UserRole.ADMIN)

        # Mock user with admin role
        mock_user = Mock()
        mock_user.role = UserRole.ADMIN

        # Should not raise exception
        result = checker(mock_user)
        assert result == mock_user

    def test_role_checker_insufficient(self, auth_svc):
        """Test insufficient role raises exception"""
        checker = auth_svc.require_role(UserRole.ADMIN)

        # Mock user with investigator role
        mock_user = Mock()
        mock_user.role = UserRole.INVESTIGATOR

        with pytest.raises(Exception):  # Should raise HTTPException
            checker(mock_user)

    def test_permission_checker_read(self, auth_svc):
        """Test read permission check"""
        checker = auth_svc.require_permission("read")

        # Admin user should have read permission
        mock_user = Mock()
        mock_user.role = UserRole.ADMIN

        result = checker(mock_user)
        assert result == mock_user

    def test_permission_checker_write(self, auth_svc):
        """Test write permission check"""
        checker = auth_svc.require_permission("write")

        # Analyst should not have write permission
        mock_user = Mock()
        mock_user.role = UserRole.ANALYST

        with pytest.raises(Exception):  # Should raise HTTPException
            checker(mock_user)

    def test_password_strength_validation(self, auth_svc):
        """Test password strength validation"""
        # Weak passwords should be flagged
        weak_passwords = [
            "short",
            "nouppercase123",
            "NOLOWERCASE123",
            "NoNumbers",
            "NoSpecial123"
        ]

        for password in weak_passwords:
            errors = auth_svc.validate_password_strength(password)
            assert len(errors) > 0

        # Strong password should pass
        strong_password = "StrongPass123!"
        errors = auth_svc.validate_password_strength(strong_password)
        assert len(errors) == 0