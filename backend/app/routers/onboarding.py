<<<<<<< Updated upstream
"""Onboarding API with Pydantic validation and DB persistence.

This module replaces the earlier JSON-file stub with a DB-backed implementation
using the project's SQLAlchemy session. It keeps a compatibility response for tests.
"""
from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
=======
"""
DEPRECATED: This module is deprecated. The functionality has been consolidated into backend/app/routers/identity.py.
Please use the onboarding endpoints provided in backend/app/routers/identity.py instead.
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import re
import json
import uuid
>>>>>>> Stashed changes
from datetime import datetime, timezone
import uuid

from core.database import RookieChecklist, get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="", tags=["onboarding"])


class RookieChecklistIn(BaseModel):
    user_email: Optional[EmailStr] = None
    user_id: Optional[str] = None
    items: List[str]
    metadata: Optional[Dict[str, Any]] = None


@router.get("/roles")
def get_roles():
    """Return a list of supported roles for the role selection wizard."""
    return {"roles": ["analyst", "investigator", "admin", "viewer"]}


@router.post("/rookie-checklist")
def submit_rookie_checklist(
    payload: RookieChecklistIn = Body(...), db: Session = Depends(get_db)
):
    """Validate and persist the rookie checklist submission to the DB.

    Returns a lightweight acceptance response for integration tests.
    """
    try:
        entry = RookieChecklist(
            id=str(uuid.uuid4()),
            user_email=payload.user_email if payload.user_email else None,
            user_id=payload.user_id if payload.user_id else None,
            items=payload.items,
            extra_metadata=payload.metadata or {},
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        db.commit()
        return {"status": "accepted", "stored": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to store checklist: {e}")