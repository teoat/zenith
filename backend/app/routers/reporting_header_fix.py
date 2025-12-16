import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.auth_service import auth_service
from core.database import User, get_db

router = APIRouter()

# --- Models ---


class CaseAnalytics(BaseModel):
    totalCases: int
    activeCases: int
    resolvedCases: int
    casesByStatus: Dict[str, int]
    avgResolutionTimeDays: float
    urgentCases: int
