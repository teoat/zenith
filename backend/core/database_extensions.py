import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

# Note: Models moved to core/database.py to avoid duplication
# These models are already defined in core/database.py
