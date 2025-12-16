# Database models for 378x492 Fraud Detection Platform
import uuid
import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, JSON, Float, Date, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os

# Encrypted field types
from core.security.encryption import EncryptedString

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
    INVESTIGATOR = "INVESTIGATOR"
    ANALYST = "ANALYST"
    AUDITOR = "AUDITOR"
    VIEWER = "VIEWER"

class ReconciliationType(str, Enum):
    EXACT = "EXACT"
    FUZZY = "FUZZY"
    MANUAL = "MANUAL"
    REJECTED = "REJECTED"

# Database models
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(EncryptedString, unique=True, nullable=False)
    full_name = Column(EncryptedString, nullable=False)
    role = Column(String, default=UserRole.INVESTIGATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    last_login = Column(DateTime)

    # Relationships
    cases = relationship("Case", back_populates="assignee")
    activities = relationship("CaseActivity", back_populates="user")

class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=utc_now)

    # Relationships - members relationship removed due to missing association table

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, index=True)
    description = Column(EncryptedString)
    status = Column(String, default=CaseStatus.OPEN, index=True)
    priority = Column(String, default=CasePriority.MEDIUM, index=True)
    case_type = Column(String, default=CaseType.FRAUD_SUSPECTED)
    assignee_id = Column(String, ForeignKey('users.id'), index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, index=True)
    closed_at = Column(DateTime)
    risk_score = Column(Float, default=0.0, index=True)
    tags = Column(JSON, default=list)
    case_metadata = Column(JSON, default=dict)
    is_synced = Column(Boolean, default=False)

    # Relationships
    assignee = relationship("User", back_populates="cases")
    transactions = relationship("Transaction", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan")
    activities = relationship("CaseActivity", back_populates="case", cascade="all, delete-orphan")
    alerts = relationship("FraudAlert", back_populates="case", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey('cases.id'), index=True)
    source_id = Column(String, index=True)  # File origin
    date = Column(Date, index=True)
    amount = Column(Float, index=True)
    currency = Column(String, default='USD')
    description = Column(EncryptedString)
    merchant_name = Column(EncryptedString, index=True)
    category = Column(String, index=True)
    type = Column(String, index=True)  # DEBIT, CREDIT
    transaction_metadata = Column(JSON, default=dict)
    confidence_score = Column(Float, default=1.0)
    is_reconciled = Column(Boolean, default=False, index=True)
    reconciled_id = Column(String)  # Link to reconciled transaction
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    case = relationship("Case", back_populates="transactions")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey('cases.id'), index=True)

    # File information
    filename = Column(String, index=True)
    file_path = Column(EncryptedString)
    file_type = Column(String, index=True)  # MIME type
    file_category = Column(String, index=True)  # document, image, video, audio, etc.
    size_bytes = Column(Integer, index=True)

    # Upload information
    uploaded_at = Column(DateTime, default=utc_now, index=True)
    uploaded_by = Column(String, index=True)

    # Processing information
    processing_status = Column(String, default='pending', index=True)  # pending, processing, completed, failed
    processed_at = Column(DateTime, index=True)

    # Content analysis
    hash = Column(String, index=True)
    ocr_text = Column(EncryptedString)
    extracted_text = Column(EncryptedString)
    sentiment_score = Column(Float, index=True)

    # Quality and admissibility
    quality_score = Column(Float, default=0.0, index=True)
    relevance_score = Column(Float, default=0.0, index=True)
    is_admissible = Column(Boolean, default=True, index=True)

    # Additional metadata
    evidence_metadata = Column(EncryptedString, default=lambda: json.dumps({}))
    evidence_tags = Column(EncryptedString, default=lambda: json.dumps([]))

    # Relationships
    case = relationship("Case", back_populates="evidence")

class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey('cases.id'), index=True)
    user_id = Column(String, ForeignKey('users.id'), index=True)
    content = Column(EncryptedString, nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    is_internal = Column(Boolean, default=False)

    # Relationships
    case = relationship("Case", back_populates="notes")
    user = relationship("User")

class CaseActivity(Base):
    __tablename__ = "case_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey('cases.id'), index=True)
    user_id = Column(String, ForeignKey('users.id'), index=True)
    activity_type = Column(String, nullable=False, index=True)  # created, updated, viewed, etc.
    description = Column(String, nullable=False)
    activity_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now, index=True)

    # Relationships
    case = relationship("Case", back_populates="activities")
    user = relationship("User", back_populates="activities")

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey('cases.id'), index=True)
    alert_type = Column(String, nullable=False, index=True)
    severity = Column(String, default='medium', index=True)  # low, medium, high, critical
    title = Column(String, nullable=False)
    description = Column(EncryptedString)
    alert_metadata = Column(JSON, default=dict)
    is_acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_by = Column(String, ForeignKey('users.id'))
    acknowledged_at = Column(DateTime)
    created_at = Column(DateTime, default=utc_now, index=True)

    # Relationships
    case = relationship("Case", back_populates="alerts")

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    entity_type = Column(String, nullable=False, index=True)  # person, company, account
    entity_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    from_entity_id = Column(String, ForeignKey('entities.id'), index=True)
    to_entity_id = Column(String, ForeignKey('entities.id'), index=True)
    relationship_type = Column(String, nullable=False, index=True)
    strength = Column(Float, default=1.0)
    relationship_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

class GraphSnapshot(Base):
    __tablename__ = "graph_snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    created_by = Column(String, ForeignKey('users.id'))

class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), index=True)
    device_id = Column(String, nullable=False, index=True)
    device_name = Column(String)
    last_seen = Column(DateTime, default=utc_now)

class RookieChecklist(Base):
    __tablename__ = "rookie_checklists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), index=True)
    checklist_data = Column(JSON, default=dict)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=utc_now)

# Database setup functions
def get_database_url():
    """Get SQLite database path"""
    app_data_dir = os.path.expanduser('~/.378x492')
    os.makedirs(app_data_dir, exist_ok=True)
    return f'sqlite:///{app_data_dir}/fraud_detection.db'

def create_engine_and_session():
    """Create database engine and session"""
    engine = create_engine(get_database_url(), echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal

def create_tables():
    """Create all database tables"""
    engine, _ = create_engine_and_session()
    Base.metadata.create_all(bind=engine)

# Session management
engine, SessionLocal = create_engine_and_session()

def get_db():
    """Dependency for FastAPI to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Export all models and utilities
__all__ = [
    # Base class
    'Base',

    # Enums
    'CaseStatus',
    'CasePriority',
    'CaseType',
    'UserRole',
    'ReconciliationType',

    # Models
    'User',
    'Team',
    'Case',
    'Transaction',
    'Evidence',
    'CaseNote',
    'CaseActivity',
    'FraudAlert',
    'Entity',
    'Relationship',
    'GraphSnapshot',
    'UserDevice',
    'RookieChecklist',

    # Utilities
    'utc_now',
    'get_database_url',
    'create_engine_and_session',
    'create_tables',
    'get_db',
    'SessionLocal',
    'engine'
]