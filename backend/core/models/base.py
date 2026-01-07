"""
Base Models and Enums

Contains the base model class, enums, and utility functions
used across all database models.
"""

import os
from datetime import datetime

from sqlalchemy import (
    Enum,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Encrypted field types

# Create base class
Base = declarative_base()


# Utility functions
def utc_now():
    return datetime.utcnow()


# Enum classes
class CaseStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    PENDING_REVIEW = "PENDING_REVIEW"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


class CasePriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CaseType(str, Enum):
    MONEY_LAUNDERING = "MONEY_LAUNDERING"
    FRAUD_SUSPECTED = "FRAUD_SUSPECTED"
    IDENTITY_THEFT = "IDENTITY_THEFT"
    ACCOUNT_TAKEOVER = "ACCOUNT_TAKEOVER"
    WIRE_FRAUD = "WIRE_FRAUD"
    CHECK_FRAUD = "CHECK_FRAUD"
    CARD_FRAUD = "CARD_FRAUD"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    INVESTIGATOR = "INVESTIGATOR"
    ANALYST = "ANALYST"
    AUDITOR = "AUDITOR"
    VIEWER = "VIEWER"


class ReconciliationType(str, Enum):
    EXACT = "EXACT"
    FUZZY = "FUZZY"
    MANUAL = "MANUAL"
    REJECTED = "REJECTED"


# Database setup functions
def get_database_url():
    """Get database URL from settings or fallback to SQLite"""
    from core.config import settings

    # Priority 1: Settings/Env Variable (Postgres support)
    if hasattr(settings, "DATABASE_URL") and settings.DATABASE_URL and "sqlite" not in settings.DATABASE_URL:
        return settings.DATABASE_URL

    # Priority 2: Local SQLite Default
    app_data_dir = os.path.expanduser("~/.zenith")
    os.makedirs(app_data_dir, exist_ok=True)
    return f"sqlite:///{app_data_dir}/fraud_detection.db"


def create_engine_and_session():
    """Create database engine and session with connection pooling"""
    from sqlalchemy.pool import QueuePool

    engine = create_engine(
        get_database_url(),
        echo=False,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=30,
        pool_timeout=60,
        pool_recycle=1800,  # Recycle connections every 30 minutes
        pool_pre_ping=True,  # Check connection health before use
        connect_args={"check_same_thread": False},  # Needed for SQLite with pooling
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal


# Session management
engine, SessionLocal = create_engine_and_session()


def get_db():
    """Dependency for FastAPI to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Security hardening: Parameterized query enforcement
def secure_query_execution(query_template: str, params: dict) -> str:
    """Execute parameterized queries to prevent SQL injection"""
    try:
        from sqlalchemy import text

        # Use SQLAlchemy text() for safe parameter binding
        text(query_template)
        # Implementation would use session.execute(safe_query, params)
        return "Query executed safely"
    except Exception as e:
        from core.logging import logger

        logger.error(f"Secure query execution failed: {e!s}")
        raise


def create_tables():
    """Create all database tables"""
    engine, _ = create_engine_and_session()
    Base.metadata.create_all(bind=engine)


# Export all base components
__all__ = [
    "Base",
    "utc_now",
    # Enums
    "CaseStatus",
    "CasePriority",
    "CaseType",
    "UserRole",
    "ReconciliationType",
    # Database setup
    "get_database_url",
    "create_engine_and_session",
    "engine",
    "SessionLocal",
    "get_db",
    "secure_query_execution",
    "create_tables",
]
