"""
Compliance and Audit Models

Contains models for compliance reporting, audit logs, security incidents,
and regulatory requirements.
"""

import json

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from .base import Base, EncryptedString, utc_now


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    action = Column(String, index=True)
    user_id = Column(String, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    signature = Column(String)
    data = Column(EncryptedString, default=lambda: json.dumps({}))
    checksum = Column(String)
    previous_checksum = Column(String)
    is_error = Column(Boolean, default=False, index=True)

    __table_args__ = (
        Index("idx_audit_action", "action"),
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_user_timestamp", "user_id", "timestamp"),
        Index("idx_audit_error", "is_error"),
    )


class ComplianceAuditLog(Base):
    __tablename__ = "compliance_audit_logs"

    id = Column(String, primary_key=True, index=True)
    action = Column(String, index=True)  # create, update, delete, access
    resource_type = Column(String, index=True)  # user, case, transaction, etc.
    resource_id = Column(String, index=True)
    user_id = Column(String, index=True)
    user_role = Column(String, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    ip_address = Column(String)
    user_agent = Column(String)
    compliance_flags = Column(JSON, default=list)  # FATF, GDPR, etc. flags
    risk_score = Column(Float, default=0.0)
    details = Column(EncryptedString)

    __table_args__ = (
        Index("idx_audit_timestamp", "timestamp"),
        Index("idx_audit_user_action", "user_id", "action"),
        Index("idx_audit_resource", "resource_type", "resource_id"),
    )


# Regulatory reporting models
class SAR(Base):
    __tablename__ = "suspicious_activity_reports"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    sar_id = Column(String, unique=True, index=True)  # External tracking ID
    status = Column(String, default="draft")  # draft, pending, submitted, accepted
    priority = Column(String, default="medium")
    report_data = Column(EncryptedString)  # JSON of the actual report content
    created_by = Column(String, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    submitted_at = Column(DateTime, nullable=True)
    metadata_json = Column(EncryptedString, default="{}")

    case = relationship("Case")
    user = relationship("User")


class RegulatoryReport(Base):
    __tablename__ = "regulatory_reports"

    id = Column(String, primary_key=True, index=True)
    report_type = Column(String, index=True)  # SAR, CTR, STR, etc.
    report_id = Column(String, unique=True, index=True)  # FINCEN report ID
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    filing_status = Column(String, default="draft", index=True)  # draft, filed, rejected
    filing_date = Column(DateTime, index=True)
    due_date = Column(DateTime, index=True)
    regulatory_body = Column(String, index=True)  # FINCEN, EU, etc.
    report_data = Column(EncryptedString)  # Full report content
    attachments = Column(JSON, default=list)  # Supporting documents
    created_by = Column(String, index=True)
    reviewed_by = Column(String, index=True)
    approved_by = Column(String, index=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, index=True)


# Security models
class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(String, primary_key=True, index=True)
    incident_type = Column(String, index=True)  # breach, unauthorized_access, malware, etc.
    severity = Column(String, index=True)  # critical, high, medium, low
    status = Column(String, default="open", index=True)  # open, investigating, contained, resolved, closed
    title = Column(String, nullable=False)
    description = Column(String)
    affected_systems = Column(JSON, default=list)
    affected_users = Column(Integer, default=0)
    data_exposed = Column(JSON, default=dict)  # types and volumes of data
    root_cause = Column(String)
    impact_assessment = Column(String)
    remediation_steps = Column(JSON, default=list)
    lessons_learned = Column(String)
    reported_to_regulators = Column(Boolean, default=False)
    regulator_report_id = Column(String)
    detected_by = Column(String, index=True)
    assigned_to = Column(String, index=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    detected_at = Column(DateTime, index=True)
    contained_at = Column(DateTime)
    resolved_at = Column(DateTime)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, index=True)

    __table_args__ = (
        Index("idx_incident_status_severity", "status", "severity"),
        Index("idx_incident_created", "created_at"),
        Index("idx_incident_type", "incident_type"),
    )


# AI/ML model models
class ModelFeedback(Base):
    __tablename__ = "model_feedback"

    id = Column(String, primary_key=True, index=True)
    feedback_type = Column(String, index=True)  # false_positive, new_pattern, etc.
    data = Column(EncryptedString)
    submitted_by = Column(String, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    applied_to_model = Column(Boolean, default=False)


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String, primary_key=True, index=True)
    model_version = Column(String, unique=True, index=True)
    model_type = Column(String, index=True)  # fraud_detection, identity_analysis, etc.
    accuracy_score = Column(Float)
    training_data_hash = Column(String)
    deployed_at = Column(DateTime, index=True)
    retired_at = Column(DateTime, index=True)


# Configuration and integration models
class FraudRule(Base):
    __tablename__ = "fraud_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    rule_type = Column(String, nullable=False)  # 'threshold', 'velocity', 'pattern'
    value_type = Column(String, nullable=False)  # 'int', 'float', 'json'
    value = Column(String, nullable=False)  # Stored as string, cast on load
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class IntegrationConfigModel(Base):
    __tablename__ = "integrations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    status = Column(String, default="active")
    endpoint_url = Column(String, nullable=False)
    auth_type = Column(String, default="none")
    auth_config = Column(JSON, nullable=True)
    rate_limit = Column(Integer, default=100)
    created_at = Column(DateTime, default=utc_now)
    last_used = Column(DateTime, nullable=True)


__all__ = [
    "AuditLog",
    "ComplianceAuditLog",
    "SAR",
    "RegulatoryReport",
    "SecurityIncident",
    "ModelFeedback",
    "ModelRegistry",
    "FraudRule",
    "IntegrationConfigModel",
]
