import uuid

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from core.database import Base, utc_now


class PluginRegistry(Base):
    __tablename__ = "plugin_registry"

    plugin_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    namespace = Column(String, unique=True, nullable=False, index=True)
    version = Column(String, nullable=False)
    trust_level = Column(String, nullable=False)  # 'official', 'verified', 'community', 'custom'
    status = Column(String, default="inactive", index=True)  # 'active', 'inactive', 'quarantined'
    metadata_json = Column(JSON, nullable=False)
    signature = Column(Text)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    created_by = Column(String, ForeignKey("users.id"))

    # Relationships
    dependencies = relationship("PluginDependency", back_populates="plugin", cascade="all, delete-orphan")
    permissions = relationship("PluginPermission", back_populates="plugin", cascade="all, delete-orphan")
    executions = relationship("PluginExecution", back_populates="plugin")


class PluginDependency(Base):
    __tablename__ = "plugin_dependencies"

    dependency_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    plugin_id = Column(String, ForeignKey("plugin_registry.plugin_id"), index=True)
    depends_on_namespace = Column(String, nullable=False)
    version_constraint = Column(String, nullable=False)
    is_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    plugin = relationship("PluginRegistry", back_populates="dependencies")


class PluginPermission(Base):
    __tablename__ = "plugin_permissions"

    permission_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    plugin_id = Column(String, ForeignKey("plugin_registry.plugin_id"), index=True)
    permission_name = Column(String, nullable=False)
    granted_at = Column(DateTime, default=utc_now)
    granted_by = Column(String, ForeignKey("users.id"))

    plugin = relationship("PluginRegistry", back_populates="permissions")


class PluginExecution(Base):
    __tablename__ = "plugin_executions"

    execution_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    plugin_id = Column(String, ForeignKey("plugin_registry.plugin_id"), index=True)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime)
    status = Column(String)  # 'success', 'failure', 'timeout'
    execution_time_ms = Column(Integer)
    error_message = Column(Text)
    input_hash = Column(String)
    output_hash = Column(String)

    plugin = relationship("PluginRegistry", back_populates="executions")
