"""
Investigation Service - Business logic for fraud investigations
"""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from core.database import Case, Transaction

logger = logging.getLogger(__name__)


class InvestigationService:
    """Service for managing fraud investigations"""

    def start_investigation(
        self, db: Session, case_id: str, investigator_id: str
    ) -> Dict[str, Any]:
        """Start a new investigation for a case"""
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        case.status = "investigating"
        case.assigned_to = investigator_id
        db.commit()

        return {
            "case_id": case_id,
            "status": "investigating",
            "assigned_to": investigator_id,
        }

    def get_investigation_status(self, db: Session, case_id: str) -> Dict[str, Any]:
        """Get current investigation status"""
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        return {
            "case_id": case_id,
            "status": case.status,
            "assigned_to": case.assigned_to,
            "priority": case.priority,
        }

    def close_investigation(
        self, db: Session, case_id: str, resolution: str, notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Close an investigation"""
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        case.status = "closed"
        case.resolution = resolution
        if notes:
            case.notes = notes
        db.commit()

        return {"case_id": case_id, "status": "closed", "resolution": resolution}

    def get_related_transactions(
        self, db: Session, case_id: str, limit: int = 50
    ) -> List[Transaction]:
        """Get transactions related to a case"""
        # This would typically query based on case relationships
        # For now, return flagged transactions as a placeholder
        return (
            db.query(Transaction)
            .filter(Transaction.is_flagged == True)
            .limit(limit)
            .all()
        )


# Singleton instance
investigation_service = InvestigationService()
