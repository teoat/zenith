"""Unit tests for database models and services"""

import os
import uuid
from unittest.mock import MagicMock, patch

import pytest
from app.services.infrastructure.auth_service import AuthService
from app.services.infrastructure.storage.database_service import DatabaseService
from sqlalchemy.orm import Session

from core.database import (
    Case,
    CaseStatus,
    CaseType,
    Evidence,
    Transaction,
    User,
    UserRole,
    create_tables,
)


class TestDatabaseModels:
    """Test database model functionality"""

    def test_case_model_creation(self):
        """Test Case model creation"""
        case_id = str(uuid.uuid4())
        case = Case(
            id=case_id,
            title="Test Fraud Case",
            description="Test case description",
            status=CaseStatus.OPEN,
            case_type=CaseType.FRAUD_SUSPECTED,
            customer_name="John Doe",
            fraud_amount=5000.0,
        )

        assert case.id == case_id
        assert case.title == "Test Fraud Case"
        assert case.status == CaseStatus.OPEN
        assert case.fraud_amount == 5000.0

    def test_transaction_model_creation(self):
        """Test Transaction model creation"""
        transaction = Transaction(
            id=str(uuid.uuid4()),
            case_id=str(uuid.uuid4()),
            date="2024-01-01T00:00:00Z",
            amount=1000.0,
            currency="USD",
            description="Test transaction",
            merchant_name="Test Merchant",
            transaction_type="DEBIT",
        )

        assert transaction.amount == 1000.0
        assert transaction.currency == "USD"
        assert transaction.transaction_type == "DEBIT"

    def test_evidence_model_creation(self):
        """Test Evidence model creation"""
        evidence = Evidence(
            id=str(uuid.uuid4()),
            case_id=str(uuid.uuid4()),
            filename="test.pdf",
            file_type="application/pdf",
            file_category="document",
            size_bytes=1024,
            uploaded_by="test_user",
        )

        assert evidence.filename == "test.pdf"
        assert evidence.file_type == "application/pdf"
        assert evidence.size_bytes == 1024

    def test_user_model_creation(self):
        """Test User model creation"""
        user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test@example.com",
            role=UserRole.ANALYST,
            full_name="Test User",
            is_active=True,
        )

        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == UserRole.ANALYST
        assert user.is_active == True


class TestDatabaseService:
    """Test database service functionality"""

    @pytest.fixture
    def db_service(self):
        """Create database service instance"""
        return DatabaseService()

    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        return MagicMock(spec=Session)

    def test_db_service_initialization(self, db_service):
        """Test database service initialization"""
        assert db_service is not None
        assert hasattr(db_service, "get_db")

    @patch(
        "app.services.infrastructure.storage.database_service.DatabaseService.get_db"
    )
    def test_get_cases_paginated(self, mock_get_db, db_service, mock_session):
        """Test paginated case retrieval"""
        mock_get_db.return_value.__enter__.return_value = mock_session

        # Mock query results
        mock_query = MagicMock()
        mock_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = []

        result = db_service.get_cases_paginated(page=1, per_page=20)

        assert "items" in result
        assert "total" in result
        assert "page" in result
        assert "per_page" in result

    @patch(
        "app.services.infrastructure.storage.database_service.DatabaseService.get_db"
    )
    def test_create_case(self, mock_get_db, db_service, mock_session):
        """Test case creation"""
        mock_get_db.return_value.__enter__.return_value = mock_session

        case_data = {
            "title": "Test Case",
            "description": "Test description",
            "case_type": "fraud_suspected",
        }

        result = db_service.create_case(case_data, "test_user")

        assert result is not None
        # Should be called twice: once for case, once for activity log
        assert mock_session.add.call_count == 2
        mock_session.commit.assert_called_once()

    @patch(
        "app.services.infrastructure.storage.database_service.DatabaseService.get_db"
    )
    def test_get_user_by_username(self, mock_get_db, db_service, mock_session):
        """Test user retrieval by username"""
        mock_get_db.return_value.__enter__.return_value = mock_session

        mock_user = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = (
            mock_user
        )

        result = db_service.get_user_by_username("testuser")

        assert result == mock_user
        mock_session.query.assert_called_once()


class TestAuthService:
    """Test authentication service functionality"""

    @pytest.fixture
    def auth_service(self):
        """Create auth service instance"""
        return AuthService()

    def test_auth_service_initialization(self, auth_service):
        """Test auth service initialization"""
        assert auth_service is not None
        assert hasattr(auth_service, "hash_password")
        assert hasattr(auth_service, "verify_password")

    def test_password_hashing(self, auth_service):
        """Test password hashing and verification"""
        password = os.getenv("TEST_PASSWORD", "test_password_123")

        # Hash password
        hashed = auth_service.hash_password(password)
        assert hashed != password
        assert len(hashed) > 0

        # Verify password
        is_valid = auth_service.verify_password(password, hashed)
        assert is_valid == True

        # Test wrong password
        is_invalid = auth_service.verify_password("wrong_password", hashed)
        assert is_invalid == False

    def test_create_access_token(self, auth_service):
        """Test JWT access token creation"""
        data = {"sub": "user123", "username": "testuser"}

        token = auth_service.create_access_token(data)
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_token(self, auth_service):
        """Test JWT token decoding"""
        data = {"sub": "user123", "username": "testuser"}

        # Create token
        token = auth_service.create_access_token(data)

        # Decode token
        decoded = auth_service.decode_token(token)
        assert decoded["sub"] == "user123"
        assert decoded["username"] == "testuser"

    @patch("app.services.infrastructure.auth_service.db_service")
    def test_authenticate_user_success(self, mock_db_service, auth_service):
        """Test successful user authentication"""
        # Mock user
        mock_user = MagicMock()
        mock_user.id = "user123"
        mock_user.password_hash = auth_service.hash_password("testpass")
        mock_user.is_active = True

        mock_db_service.get_user_by_username.return_value = mock_user
        mock_db_service.get_user_by_email.return_value = None

        result = auth_service.authenticate_user("testuser", "testpass")

        assert result == mock_user

    @patch("app.services.infrastructure.auth_service.db_service")
    def test_authenticate_user_invalid_password(self, mock_db_service, auth_service):
        """Test authentication with invalid password"""
        # Mock user
        mock_user = MagicMock()
        mock_user.id = "user123"
        mock_user.password_hash = auth_service.hash_password("testpass")
        mock_user.is_active = True

        mock_db_service.get_user_by_username.return_value = mock_user
        mock_db_service.get_user_by_email.return_value = None

        result = auth_service.authenticate_user("testuser", "wrongpass")

        assert result is None

    @patch("app.services.infrastructure.auth_service.db_service")
    def test_authenticate_user_not_found(self, mock_db_service, auth_service):
        """Test authentication with non-existent user"""
        mock_db_service.get_user_by_username.return_value = None
        mock_db_service.get_user_by_email.return_value = None

        # Also mock get_db to return a mock that doesn't return data for Scans
        mock_db = mock_db_service.get_db.return_value.__enter__.return_value
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.all.return_value = []

        result = auth_service.authenticate_user("nonexistent", "testpass")

        assert result is None


class TestDatabaseCreation:
    """Test database table creation"""

    @patch("core.database.create_engine")
    @patch("core.database.Base.metadata.create_all")
    def test_create_tables(self, mock_create_all, mock_create_engine):
        """Test database table creation"""
        mock_engine = MagicMock()
        mock_create_engine.return_value = mock_engine

        create_tables()

        mock_create_engine.assert_called_once()
        mock_create_all.assert_called_once_with(bind=mock_engine)
