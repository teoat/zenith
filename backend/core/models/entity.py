"""
Entity and Relationship Models

Contains Entity, Relationship, and related models for
network analysis and entity mapping.
"""

import json

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import relationship

from .base import Base, EncryptedString, utc_now


class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    entity_type = Column(String, index=True)  # person, company, account, merchant, etc.
    name = Column(EncryptedString)
    entity_metadata = Column(EncryptedString, default=lambda: json.dumps({}))  # phone, email, address, ip_address, etc.

    # Timestamps
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    case = relationship("Case", backref="entities")
    source_relationships = relationship(
        "Relationship",
        foreign_keys="Relationship.source_id",
        back_populates="source_entity",
    )
    target_relationships = relationship(
        "Relationship",
        foreign_keys="Relationship.target_id",
        back_populates="target_entity",
    )

    # Composite indexes
    __table_args__ = (
        Index("idx_entity_case_type", "case_id", "entity_type"),
        Index("idx_entity_name_type", "name", "entity_type"),
    )


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    source_id = Column(String, ForeignKey("entities.id"), index=True)
    target_id = Column(String, ForeignKey("entities.id"), index=True)
    relationship_type = Column(String, index=True)  # phone, email, address, ip_address, transaction, etc.
    confidence = Column(Float, default=0.0, index=True)
    relationship_metadata = Column(EncryptedString, default=lambda: json.dumps({}))  # additional relationship data

    # Timestamps
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    case = relationship("Case", backref="relationships")
    source_entity = relationship("Entity", foreign_keys=[source_id], back_populates="source_relationships")
    target_entity = relationship("Entity", foreign_keys=[target_id], back_populates="target_relationships")

    # Composite indexes
    __table_args__ = (
        Index("idx_relationship_case_type", "case_id", "relationship_type"),
        Index("idx_relationship_source_target", "source_id", "target_id"),
        Index("idx_relationship_confidence_type", "confidence", "relationship_type"),
    )


class IdentityNode(Base):
    __tablename__ = "identity_nodes"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    identity_type = Column(String, index=True)  # person, company, address
    attributes = Column(EncryptedString)  # JSON of identity attributes
    risk_score = Column(Float, default=0.0)
    validation_status = Column(String, default="pending")  # pending, valid, suspicious
    created_at = Column(DateTime, default=utc_now, index=True)


class IdentityRelationship(Base):
    __tablename__ = "identity_relationships"

    id = Column(String, primary_key=True, index=True)
    from_node_id = Column(String, ForeignKey("identity_nodes.id"), index=True)
    to_node_id = Column(String, ForeignKey("identity_nodes.id"), index=True)
    relationship_type = Column(String, index=True)  # shared_address, shared_phone, etc.
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now, index=True)


class FrozenEntity(Base):
    __tablename__ = "frozen_entities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_id = Column(String, unique=True, index=True, nullable=False)
    entity_type = Column(String, index=True, default="account")
    frozen_at = Column(DateTime, default=utc_now)
    frozen_by = Column(String)
    reason = Column(String)
    status = Column(String, default="frozen")  # frozen, thawed
    metadata_json = Column(String, default=dict)


# Graph and visualization models
class GraphSnapshot(Base):
    __tablename__ = "graph_snapshots"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), index=True)
    name = Column(EncryptedString, default="Untitled Snapshot")
    description = Column(EncryptedString)

    # Graph data stored as JSON
    nodes = Column(EncryptedString, default=lambda: json.dumps([]))
    links = Column(EncryptedString, default=list)

    # Metadata
    node_count = Column(Integer, default=0)
    link_count = Column(Integer, default=0)
    snapshot_metadata = Column(EncryptedString, default=lambda: json.dumps({}))

    # User info
    created_by = Column(String, index=True)

    # Timestamps
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    case = relationship("Case", backref="graph_snapshots")

    __table_args__ = (Index("idx_snapshot_case_created", "case_id", "created_at"),)


__all__ = [
    "Entity",
    "Relationship",
    "IdentityNode",
    "IdentityRelationship",
    "FrozenEntity",
    "GraphSnapshot",
]
