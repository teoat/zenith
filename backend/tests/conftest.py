import os
import sys
from unittest.mock import MagicMock

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

# Ensure backend directory is at the front of sys.path to avoid import conflicts
# with the root 'app' directory shims
if os.path.abspath("backend") not in sys.path:
    sys.path.insert(0, os.path.abspath("backend"))

# Mock networkx if not present with proper __spec__
mock_networkx = MagicMock()
mock_networkx.__spec__ = MagicMock()
mock_networkx.__spec__.name = "networkx"
sys.modules["networkx"] = mock_networkx

# Set environment to development for tests to bypass production security middleware
os.environ["ENVIRONMENT"] = "development"

# Mock heavy ML dependencies before they can import
# This prevents transformers/torch from trying to use networkx
sys.modules["transformers"] = MagicMock()
sys.modules["sentence_transformers"] = MagicMock()

# Conditionally mock heavy/optional dependencies
# Only mock them if they cannot be imported (e.g. absent in CI env)
for lib in ["pytesseract", "PIL", "cv2", "PyPDF2", "docx"]:
    try:
        __import__(lib)
    except ImportError:
        sys.modules[lib] = MagicMock()
# Note: 'python-docx' is imported as 'docx'

from main import app

from core.database import Base, get_db

# Use in-memory database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def test_user(db_session):
    """Standard test user entity persisted in DB"""
    from core.database import User, UserRole
    # Check if exists
    existing = db_session.query(User).filter(User.username == "testuser").first()
    if existing:
        return existing
        
    user = User(
        id="test_user_id",
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        role=UserRole.ANALYST,
        is_active=True,
        # Hash for "password123" (pbkdf2_sha256)
        password_hash="$pbkdf2-sha256$29000$N2YJ..$..." # Mock hash or use auth_service
    )
    # Use auth_service to hash properly if reachable
    from app.services.infrastructure.auth_service import auth_service
    user.password_hash = auth_service.hash_password("password123")
    
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def auth_headers(test_user):
    """Standard authorized headers with REAL token for test_user"""
    from app.services.infrastructure.auth_service import auth_service
    
    role_val = test_user.role.value if hasattr(test_user.role, 'value') else test_user.role
    token = auth_service.create_access_token({
        "sub": test_user.id,
        "username": test_user.username,
        "role": role_val
    })
    return {"Authorization": f"Bearer {token}"}


from sqlalchemy.pool import StaticPool


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable SQLCipher-like PRAGMAs if needed, or skip for pure testing speed if encryption logic robustness is tested elsewhere.
    # For integration tests, we might want to simulate encryption or just ensure tables work.
    # Given we might not have SQLCipher in all test envs, let's keep it simple for now,
    # but strictly if we want to match prod behavior we should add pragmas.
    # However, standard sqlite3 will error on "PRAGMA key" if not supported? No, it usually ignores unknown pragmas.
    # Let's add them to be safe/consistent.

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode = WAL")
        cursor.execute("PRAGMA synchronous = NORMAL")
        cursor.execute("PRAGMA temp_store = MEMORY")
        cursor.close()

    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def tables(engine):
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(engine, tables):
    """Returns an sqlalchemy session, and after the test tears down everything properly."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    yield session
    session.close()

    # Clean up data after each test?
    # Since we use :memory:, scope="session" for engine means data persists between tests unless cleanup.
    # For full isolation, we should truncate tables.
    # But :memory: with session scope is shared.
    # Let's iterate metadata to truncate.
    with engine.connect() as connection:
        trans = connection.begin()
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
        trans.commit()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def patch_db_service(db_session):
    """Patch db_service to use the test session"""
    from app.services.infrastructure.storage.database_service import db_service
    from contextlib import contextmanager

    @contextmanager
    def mock_get_db():
        yield db_session

    original_get_db = db_service.get_db
    db_service.get_db = mock_get_db
    yield
    db_service.get_db = original_get_db
