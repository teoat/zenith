"""
DEPRECATED: This module is deprecated. The functionality has been consolidated into backend/app/routers/identity.py.
Please use the onboarding endpoints provided in backend/app/routers/identity.py instead.
"""

import json
import re
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import RookieChecklist, UserOnboardingState, get_db

router = APIRouter(prefix="", tags=["onboarding"])


class RookieChecklistIn(BaseModel):
    user_id: str
    items: list[str]
    metadata: dict[str, Any] | None = None


@router.get("/roles")
def get_roles():
    """Return a list of supported roles for the role selection wizard."""
    return {"roles": ["analyst", "investigator", "admin", "viewer"]}


@router.get("/rookie-checklist/{user_id}")
def get_rookie_checklist(user_id: str, db: Session = Depends(get_db)):
    """Fetch the current checklist state for a user."""
    state = db.query(UserOnboardingState).filter(UserOnboardingState.user_id == user_id).first()
    if not state:
        return {"items": [], "metadata": {}}
    return {
        "items": state.checklist_state.get("items", []),
        "metadata": state.checklist_state.get("metadata", {}),
    }


@router.post("/rookie-checklist")
def submit_rookie_checklist(payload: RookieChecklistIn = Body(...), db: Session = Depends(get_db)):
    """Validate and persist the rookie checklist submission to the DB."""
    try:
        # 1. Store in historical log
        entry = RookieChecklist(
            id=str(uuid.uuid4()),
            user_id=payload.user_id,
            items=json.dumps(payload.items),  # EncryptedString expects string or it handles json?
            # Actually RookieChecklist.items is EncryptedString in database.py
            extra_metadata=json.dumps(payload.metadata or {}),
            created_at=datetime.now(UTC),
        )
        db.add(entry)

        # 2. Update persistent state
        state = db.query(UserOnboardingState).filter(UserOnboardingState.user_id == payload.user_id).first()
        if not state:
            state = UserOnboardingState(
                user_id=payload.user_id,
                checklist_state={"items": payload.items, "metadata": payload.metadata},
            )
            db.add(state)
        else:
            state.checklist_state = {
                "items": payload.items,
                "metadata": payload.metadata,
            }
            state.updated_at = datetime.now(UTC)

        db.commit()
        return {"status": "accepted", "stored": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to store checklist: {e}")


router = APIRouter()


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@router.get("/onboarding/status")
async def onboarding_status():
    return {"status": "ok"}
