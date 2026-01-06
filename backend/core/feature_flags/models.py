import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text

from core.database import Base, utc_now


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    flag_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    enabled = Column(Boolean, default=False, index=True)
    rollout_percentage = Column(Integer, default=0)  # 0-100
    target_users = Column(JSON)  # List of user IDs
    target_contexts = Column(JSON)  # Targeting rules
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    disabled_at = Column(DateTime)
    disabled_reason = Column(Text)
