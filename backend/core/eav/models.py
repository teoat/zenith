import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from core.database import Base, utc_now


class EAVEntity(Base):
    __tablename__ = "eav_entities"

    entity_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    values = relationship(
        "EAVValue", back_populates="entity", cascade="all, delete-orphan"
    )


class EAVAttribute(Base):
    __tablename__ = "eav_attributes"

    attribute_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    attribute_name = Column(String, unique=True, nullable=False, index=True)
    data_type = Column(
        String, nullable=False
    )  # 'text', 'numeric', 'boolean', 'json', 'date'
    description = Column(Text)
    is_required = Column(Boolean, default=False)


class EAVValue(Base):
    __tablename__ = "eav_values"

    value_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_id = Column(String, ForeignKey("eav_entities.entity_id"), index=True)
    attribute_id = Column(String, ForeignKey("eav_attributes.attribute_id"), index=True)

    value_text = Column(Text)
    value_numeric = Column(Numeric)
    value_boolean = Column(Boolean)
    value_json = Column(Text)  # Storing JSON as text string
    value_date = Column(DateTime)

    entity = relationship("EAVEntity", back_populates="values")
    attribute = relationship("EAVAttribute")

    __table_args__ = (
        Index("idx_eav_entity_attribute", "entity_id", "attribute_id", unique=True),
    )
