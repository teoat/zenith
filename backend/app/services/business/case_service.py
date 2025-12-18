"""
Case Service - Business logic for case management
"""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import Case

logger = logging.getLogger(__name__)


class CaseService:
    """Service for managing fraud investigation cases"""

    def get_case(self, db: Session, case_id: str) -> Optional[Case]:
        """Get a case by ID"""
        return db.query(Case).filter(Case.id == case_id).first()

    def get_cases(
        self,
        db: Session,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 100,
    ) -> List[Case]:
        """Get all cases with optional filtering"""
        query = db.query(Case)

        if status:
            query = query.filter(Case.status == status)
        if priority:
            query = query.filter(Case.priority == priority)

        return query.limit(limit).all()

    def create_case(
        self,
        db: Session,
        title: str,
        description: str,
        priority: str = "medium",
        status: str = "open",
        **kwargs,
    ) -> Case:
        """Create a new case"""
        case = Case(
            title=title,
            description=description,
            priority=priority,
            status=status,
            **kwargs,
        )
        db.add(case)
        db.commit()
        db.refresh(case)
        return case

    def update_case(self, db: Session, case_id: str, **updates) -> Optional[Case]:
        """Update a case"""
        case = self.get_case(db, case_id)
        if not case:
            return None

        for key, value in updates.items():
            if hasattr(case, key):
                setattr(case, key, value)

        db.commit()
        db.refresh(case)
        return case

    def delete_case(self, db: Session, case_id: str) -> bool:
        """Delete a case"""
        case = self.get_case(db, case_id)
        if not case:
            return False

        db.delete(case)
        db.commit()
        return True

    def get_case_stats(self, db: Session) -> Dict[str, Any]:
        """Get case statistics"""
        total = db.query(Case).count()
        open_cases = db.query(Case).filter(Case.status == "open").count()
        closed = db.query(Case).filter(Case.status == "closed").count()
        critical = db.query(Case).filter(Case.priority == "critical").count()

        return {
            "total_cases": total,
            "open_cases": open_cases,
            "closed_cases": closed,
            "critical_cases": critical,
        }


    def get_cases_paginated(
        self, db: Session, page: int, per_page: int, filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get cases with pagination and filtering"""
        import math

        query = db.query(Case)

        if filters.get("status"):
            query = query.filter(Case.status == filters["status"])
        if filters.get("priority"):
            query = query.filter(Case.priority == filters["priority"])
        if filters.get("search"):
            search = f"%{filters['search']}%"
            query = query.filter(Case.title.ilike(search))

        total = query.count()
        total_pages = math.ceil(total / per_page)
        
        # Ensure page is valid
        if page < 1:
            page = 1
        if page > total_pages and total_pages > 0:
            page = total_pages

        offset = (page - 1) * per_page
        cases = query.order_by(Case.created_at.desc()).offset(offset).limit(per_page).all()

        return {
            "cases": cases,
            "total": total,
            "total_pages": total_pages,
            "current_page": page
        }

# Singleton instance
case_service = CaseService()
