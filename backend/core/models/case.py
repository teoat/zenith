"""
Case Management Models

Contains Case, Transaction, Evidence, and related models for
fraud case management and investigation.
"""

import json

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from .base import Base, CasePriority, CaseStatus, CaseType, EncryptedString, utc_now


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), index=True, default="default")
    title = Column(String, nullable=False, index=True)
    description = Column(EncryptedString)
    status = Column(String, default=CaseStatus.OPEN, index=True)
    priority = Column(String, default=CasePriority.MEDIUM, index=True)
    case_type = Column(String, default=CaseType.FRAUD_SUSPECTED)
    assignee_id = Column(String, ForeignKey("users.id"), index=True)
    team_id = Column(String, ForeignKey("teams.id"))
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, index=True)
    closed_at = Column(DateTime)
    risk_score = Column(Float, default=0.0, index=True)
    tags = Column(JSON, default=list)
    case_metadata = Column(JSON, default=dict)
    is_synced = Column(Boolean, default=False)
    fraud_amount = Column(Float, default=0.0)
    customer_name = Column(EncryptedString, default="Unknown")
    risk_level = Column(String, default="low", index=True)
    due_date = Column(DateTime)
    created_by = Column(String, ForeignKey("users.id"))

    # Relationships
    project = relationship("Project", back_populates="cases")
    assignee = relationship("User", back_populates="cases", foreign_keys=[assignee_id])
    creator = relationship("User", foreign_keys=[created_by])
    transactions = relationship("Transaction", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan")
    activities = relationship("CaseActivity", back_populates="case", cascade="all, delete-orphan")
    alerts = relationship("FraudAlert", back_populates="case", cascade="all, delete-orphan")
    trade_transactions = relationship("TradeTransaction", back_populates="case", cascade="all, delete-orphan")
    crypto_transactions = relationship("CryptoTransaction", back_populates="case", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    source_id = Column(String, index=True)  # File origin
    external_transaction_id = Column(String, index=True)  # External reference ID
    date = Column(DateTime, index=True)
    amount = Column(Float, index=True)
    currency = Column(String, default="USD")
    description = Column(EncryptedString)
    merchant_name = Column(EncryptedString, index=True)
    category = Column(String, index=True)
    transaction_type = Column(String, index=True)  # DEBIT, CREDIT
    ip_address = Column(String, index=True)  # IP address for fraud detection
    device_fingerprint = Column(String)  # Device fingerprint for fraud detection
    transaction_metadata = Column(JSON, default=dict)
    confidence_score = Column(Float, default=1.0)
    is_reconciled = Column(Boolean, default=False, index=True)
    reconciled_id = Column(String)  # Link to reconciled transaction
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    case = relationship("Case", back_populates="transactions")

    __table_args__ = (Index("idx_transactions_case_date_amount", "case_id", "date", "amount"),)


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), index=True)

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
    processing_status = Column(String, default="pending", index=True)  # pending, processing, completed, failed
    processed_at = Column(DateTime, index=True)

    # Content analysis
    hash = Column(String, index=True)
    ocr_text = Column(EncryptedString)
    extracted_text = Column(EncryptedString)
    sentiment_score = Column(Float, index=True)
    fraud_amount = Column(Float, default=0.0)
    customer_name = Column(EncryptedString, default="Unknown")

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
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
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
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
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
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    alert_type = Column(String, nullable=False, index=True)
    severity = Column(String, default="medium", index=True)  # low, medium, high, critical
    title = Column(String, nullable=False)
    description = Column(EncryptedString)
    alert_metadata = Column(JSON, default=dict)
    is_acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_by = Column(String, ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    created_at = Column(DateTime, default=utc_now, index=True)

    # Relationships
    case = relationship("Case", back_populates="alerts")


# Specialized transaction models
class TradeTransaction(Base):
    __tablename__ = "trade_transactions"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    commodity_type = Column(String, index=True)
    declared_value = Column(Float)
    market_value = Column(Float)
    shipping_route = Column(String, index=True)
    anomaly_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now, index=True)

    case = relationship("Case", back_populates="trade_transactions")

    __table_args__ = (
        Index("idx_trade_case_date", "case_id", "created_at"),
        Index("idx_trade_commodity", "commodity_type"),
    )


class CryptoTransaction(Base):
    __tablename__ = "crypto_transactions"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    blockchain = Column(String, index=True)  # btc, eth, etc.
    tx_hash = Column(String, unique=True, index=True)
    from_address = Column(String, index=True)
    to_address = Column(String, index=True)
    amount = Column(Float)
    timestamp = Column(DateTime, index=True)
    risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now, index=True)

    case = relationship("Case", back_populates="crypto_transactions")

    __table_args__ = (
        Index("idx_crypto_case_timestamp", "case_id", "timestamp"),
        Index("idx_crypto_addresses", "from_address", "to_address"),
    )


class EvidenceChain(Base):
    __tablename__ = "evidence_chain"

    id = Column(String, primary_key=True, index=True)
    package_id = Column(String, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    evidence_type = Column(String, index=True)
    hash_value = Column(String, nullable=False)
    collected_by = Column(String, index=True)
    collection_method = Column(String, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    chain_metadata = Column(EncryptedString, default="{}")

    __table_args__ = (Index("idx_evidence_package_timestamp", "package_id", "timestamp"),)


__all__ = [
    "Case",
    "Transaction",
    "Evidence",
    "CaseNote",
    "CaseActivity",
    "FraudAlert",
    "TradeTransaction",
    "CryptoTransaction",
    "EvidenceChain",
]
