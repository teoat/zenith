import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from starlette.testclient import TestClient
import os
import sys
from unittest.mock import MagicMock

# Mock networkx if not present
sys.modules["networkx"] = MagicMock()

# Set environment to development for tests to bypass production security middleware
os.environ["ENVIRONMENT"] = "development"
# Conditionally mock heavy/optional dependencies
# Only mock them if they cannot be imported (e.g. absent in CI env)
for lib in ["pytesseract", "PIL", "cv2", "PyPDF2", "docx", "transformers", "sentence_transformers"]:
    try:
        __import__(lib)
    except ImportError:
        sys.modules[lib] = MagicMock()
# Note: 'python-docx' is imported as 'docx'

from main import app
from core.database import Base, get_db

# Use in-memory database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def test_user():
    """Standard test user entity"""
    from core.database import User, UserRole
    return User(
        id="test_user_id",
        username="testuser",
        email="test@example.com",
        role=UserRole.ANALYST,
        is_active=True
    )

@pytest.fixture(scope="session")
def auth_headers():
    """Standard authorized headers"""
    return {"Authorization": "Bearer test_token"}

from sqlalchemy.pool import StaticPool

@pytest.fixture(scope="session")
def engine():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
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
