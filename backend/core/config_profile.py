from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from core.database import Base

class ConfigurationProfile(Base):
    __tablename__ = "configuration_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    rules = Column(JSON, default={})  # Stores thresholds, weights, etc.
    active = Column(Integer, default=1) # 1=Active, 0=Inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<ConfigurationProfile(name={self.name})>"
