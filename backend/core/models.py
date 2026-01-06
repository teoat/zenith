# Basic SQLAlchemy models for Zenith
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True)
    full_name = Column(String(100))
    hashed_password = Column(String(255))
    is_active = Column(Integer, default=1)
    mfa_enabled = Column(Integer, default=0)
    mfa_secret = Column(String(255), nullable=True)
    mfa_recovery_codes = Column(Text, nullable=True)
    role = Column(String(50), default='user')

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True)
    title = Column(String(255))
    description = Column(Text)
    status = Column(String(50))
    risk_score = Column(DECIMAL(5, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_to = Column(Integer, ForeignKey('users.id'))

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey('cases.id'))
    filename = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(50))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    amount = Column(DECIMAL(10, 2))
    description = Column(Text)
    transaction_date = Column(DateTime)

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    theme = Column(String(20), default='system')
    language = Column(String(10), default='en')
    timezone = Column(String(50), default='UTC')
    dashboard_layout = Column(Text)
    notifications_enabled = Column(Integer, default=1)
    email_notifications = Column(Integer, default=1)
    push_notifications = Column(Integer, default=0)
    auto_refresh_interval = Column(Integer, default=30)
    items_per_page = Column(Integer, default=25)
    date_format = Column(String(20), default='MM/DD/YYYY')
    time_format = Column(String(10), default='12h')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Placeholder classes for imports
CaseActivity = None
CaseNote = None
