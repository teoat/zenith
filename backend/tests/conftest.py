"""
Simplified test configuration for unit testing
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture(scope="session")
def engine():
    """Create in-memory SQLite database for testing"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    yield engine


@pytest.fixture(scope="function")
def db_session(engine):
    """Create database session for testing"""
    import os

    # Set environment variables for this test
    os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only_not_for_production"
    os.environ["ENCRYPTION_KEY"] = "m67Uv-neF2aFHI4hVLve7qIr9N4gHHUFDBkiUnKovcw="
    os.environ["FIELD_ENCRYPTION_KEY"] = "FKzrNO8gbxaVVAHxV5qB7M3UX9N2omjmyyAVeBqBLJ4="

    from core.models.base import Base

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client():
    """Create minimal FastAPI test client"""
    app = FastAPI(title="Test API")

    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    @app.post("/auth/login")
    async def login():
        return {"error": "Validation error"}

    @app.post("/auth/register")
    async def register():
        return {"error": "Validation error"}

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def auth_headers():
    """Create authentication headers for testing"""
    return {}
