"""
User and Team Models

Contains User, Team, Project, and related models for user management
and project organization.
"""

import json

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from .base import Base, EncryptedString, UserRole, utc_now


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(EncryptedString, unique=True, nullable=False)
    full_name = Column(EncryptedString, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default=UserRole.INVESTIGATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    last_login = Column(DateTime)

    # MFA fields
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(EncryptedString, nullable=True)

    # Relationships
    cases = relationship("Case", back_populates="assignee", foreign_keys="Case.assignee_id")
    activities = relationship("CaseActivity", back_populates="user")
    devices = relationship("UserDevice", backref="user")
    onboarding_state = relationship("UserOnboardingState", backref="user")


class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=utc_now)

    # Relationships - members relationship removed due to missing association table


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    created_at = Column(DateTime, default=utc_now)
    created_by = Column(String, ForeignKey("users.id"))

    # Relationships
    cases = relationship("Case", back_populates="project")


class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    device_name = Column(String)
    device_type = Column(String)
    ip_address = Column(String)
    last_login = Column(DateTime, default=utc_now)
    is_trusted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)


class UserOnboardingState(Base):
    __tablename__ = "user_onboarding_states"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    checklist_state = Column(String, default=lambda: json.dumps(dict()))
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class RookieChecklist(Base):
    __tablename__ = "rookie_checklists"

    id = Column(String, primary_key=True, index=True)
    user_email = Column(EncryptedString, index=True)
    user_id = Column(String, index=True)
    items = Column(EncryptedString, default=lambda: json.dumps([]))
    extra_metadata = Column(EncryptedString, default=lambda: json.dumps({}))
    created_at = Column(DateTime, default=utc_now, index=True)

    __table_args__ = (
        Index("idx_rookie_user_email", "user_email"),
        Index("idx_rookie_created", "created_at"),
    )


# Training and compliance models
class TrainingRecord(Base):
    __tablename__ = "training_records"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    training_type = Column(String, index=True)  # security_awareness, compliance, technical
    training_module = Column(String, index=True)  # specific course or topic
    completion_status = Column(String, default="not_started", index=True)  # not_started, in_progress, completed, failed
    score = Column(Float)  # Test score if applicable
    completion_date = Column(DateTime, index=True)
    expiry_date = Column(DateTime, index=True)
    certificate_issued = Column(Boolean, default=False)
    certificate_id = Column(String)
    training_provider = Column(String, index=True)
    training_duration_hours = Column(Float)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    __table_args__ = (
        Index("idx_training_user_type", "user_id", "training_type"),
        Index("idx_training_completion", "completion_status", "completion_date"),
        Index("idx_training_expiry", "expiry_date"),
    )


class AccessReview(Base):
    __tablename__ = "access_reviews"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    reviewer_id = Column(String, index=True)
    review_period_start = Column(DateTime, index=True)
    review_period_end = Column(DateTime, index=True)
    review_status = Column(String, default="pending", index=True)  # pending, in_progress, completed, overdue
    overall_risk_assessment = Column(String, index=True)  # low, medium, high, critical
    findings = Column(String, default=lambda: json.dumps([]))  # Specific access issues found
    recommendations = Column(String, default=lambda: json.dumps([]))  # Remediation actions
    approval_status = Column(String, default="pending")  # pending, approved, rejected
    approved_by = Column(String)
    approved_at = Column(DateTime)
    next_review_date = Column(DateTime, index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


__all__ = [
    "User",
    "Team",
    "Project",
    "UserDevice",
    "UserOnboardingState",
    "RookieChecklist",
    "TrainingRecord",
    "AccessReview",
]
