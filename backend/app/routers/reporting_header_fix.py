from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from sqlalchemy.orm import Session
import datetime
from enum import Enum

from core.database import get_db, User
from app.services.auth_service import auth_service

router = APIRouter()

# --- Models ---

class CaseAnalytics(BaseModel):
    totalCases: int
    activeCases: int
    resolvedCases: int
    casesByStatus: Dict[str, int]
    avgResolutionTimeDays: float
    urgentCases: int
