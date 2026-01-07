"""
Models Module Init

Exports all models and provides convenient imports.
"""

from .base import (
    Base,
    CasePriority,
    # Enums
    CaseStatus,
    CaseType,
    ReconciliationType,
    SessionLocal,
    UserRole,
    create_engine_and_session,
    create_tables,
    engine,
    # Database setup
    get_database_url,
    get_db,
    secure_query_execution,
    utc_now,
)
from .case import (
    Case,
    CaseActivity,
    CaseNote,
    CryptoTransaction,
    Evidence,
    EvidenceChain,
    FraudAlert,
    TradeTransaction,
    Transaction,
)
from .compliance import (
    SAR,
    AuditLog,
    ComplianceAuditLog,
    FraudRule,
    IntegrationConfigModel,
    ModelFeedback,
    ModelRegistry,
    RegulatoryReport,
    SecurityIncident,
)
from .entity import (
    Entity,
    FrozenEntity,
    GraphSnapshot,
    IdentityNode,
    IdentityRelationship,
    Relationship,
)
from .user import (
    AccessReview,
    Project,
    RookieChecklist,
    Team,
    TrainingRecord,
    User,
    UserDevice,
    UserOnboardingState,
)

# Export all models for backward compatibility
__all__ = [
    # Base
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
    "SessionLocal",
    "engine",
    "get_db",
    "secure_query_execution",
    "create_tables",
    # User models
    "User",
    "Team",
    "Project",
    "UserDevice",
    "UserOnboardingState",
    "RookieChecklist",
    "TrainingRecord",
    "AccessReview",
    # Case models
    "Case",
    "Transaction",
    "Evidence",
    "CaseNote",
    "CaseActivity",
    "FraudAlert",
    "TradeTransaction",
    "CryptoTransaction",
    "EvidenceChain",
    # Entity models
    "Entity",
    "Relationship",
    "IdentityNode",
    "IdentityRelationship",
    "FrozenEntity",
    "GraphSnapshot",
    # Compliance models
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
