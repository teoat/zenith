"""
Case Service - Business logic for case management
"""

import logging
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from core.database import Case

logger = logging.getLogger(__name__)


class CaseService:
    """Service for managing fraud investigation cases"""

    def get_case(self, db: Session, case_id: str) -> Case | None:
        """Get a case by ID with optimized eager loading for performance"""
        return (
            db.query(Case)
            .options(
                joinedload(Case.assignee),  # Load assignee relationship
                joinedload(Case.project),  # Load project relationship
                # Use selectinload for collections to avoid N+1 queries
                selectinload(Case.evidence),  # Load evidence with selectin for better performance
                selectinload(Case.notes),  # Load notes with selectin
                selectinload(Case.activities),  # Load activities with selectin
                selectinload(Case.alerts),  # Load alerts with selectin
            )
            .filter(Case.id == case_id)
            .first()
        )

    def get_case_summary(self, db: Session, case_id: str) -> dict[str, Any] | None:
        """Get case summary with selective fields for performance"""
        result = (
            db.query(
                Case.id,
                Case.title,
                Case.description,
                Case.status,
                Case.priority,
                Case.created_at,
                Case.updated_at,
                func.count(Case.evidence).label("evidence_count"),
                func.count(Case.notes).label("notes_count"),
            )
            .outerjoin(Case.evidence)
            .outerjoin(Case.notes)
            .filter(Case.id == case_id)
            .group_by(Case.id)
            .first()
        )

        if result:
            return {
                "id": result.id,
                "title": result.title,
                "description": result.description,
                "status": result.status,
                "priority": result.priority,
                "created_at": result.created_at,
                "updated_at": result.updated_at,
                "evidence_count": result.evidence_count or 0,
                "notes_count": result.notes_count or 0,
            }
        return None

    def get_cases(
        self,
        db: Session,
        status: str | None = None,
        priority: str | None = None,
        project_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Case]:
        """Get cases with optimized querying and pagination"""
        query = db.query(Case).options(
            joinedload(Case.assignee),  # Eager load assignee for performance
            # Avoid loading heavy relationships by default
        )

        # Apply filters efficiently
        if project_id:
            query = query.filter(Case.project_id == project_id)
        if status:
            query = query.filter(Case.status == status)
        if priority:
            query = query.filter(Case.priority == priority)

        # Order by creation date for consistent pagination
        query = query.order_by(Case.created_at.desc())

        # Apply pagination
        return query.offset(offset).limit(limit).all()

    def get_cases_with_counts(
        self,
        db: Session,
        status: str | None = None,
        priority: str | None = None,
        project_id: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Get cases with evidence/note counts for dashboard performance"""
        from sqlalchemy import func

        query = (
            db.query(
                Case,
                func.count(Case.evidence).label("evidence_count"),
                func.count(Case.notes).label("notes_count"),
            )
            .outerjoin(Case.evidence)
            .outerjoin(Case.notes)
            .options(joinedload(Case.assignee))
        )

        if project_id:
            query = query.filter(Case.project_id == project_id)
        if status:
            query = query.filter(Case.status == status)
        if priority:
            query = query.filter(Case.priority == priority)

        query = query.group_by(Case.id).order_by(Case.created_at.desc()).limit(limit)

        results = []
        for case, evidence_count, notes_count in query.all():
            case_dict = {
                "id": case.id,
                "title": case.title,
                "description": case.description,
                "status": case.status,
                "priority": case.priority,
                "created_at": case.created_at,
                "updated_at": case.updated_at,
                "assignee": case.assignee.username if case.assignee else None,
                "evidence_count": evidence_count or 0,
                "notes_count": notes_count or 0,
            }
            results.append(case_dict)

        return results

    def create_case(
        self,
        db: Session,
        title: str,
        description: str,
        priority: str = "medium",
        status: str = "open",
        project_id: str = "default",
        **kwargs,
    ) -> Case:
        """Create a new case"""
        case = Case(
            title=title,
            description=description,
            priority=priority,
            status=status,
            project_id=project_id,
            **kwargs,
        )
        db.add(case)
        db.commit()
        db.refresh(case)
        return case

    def update_case(self, db: Session, case_id: str, **updates) -> Case | None:
        """Update a case"""
        case = self.get_case(db, case_id)
        if not case:
            return None

        # Prevent cross-project updates via ID checks if we enforced tenant isolation strictly here
        # For now, simplistic update is fine.

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

    def get_case_stats(self, db: Session, project_id: str | None = None) -> dict[str, Any]:
        """Get case statistics with optimized single query"""
        from sqlalchemy import func, case

        # Optimize: Use single query with aggregations instead of 4 separate count queries
        query = db.query(
            func.count().label("total"),
            func.sum(case((Case.status == "open", 1), else_=0)).label("open_cases"),
            func.sum(case((Case.status == "closed", 1), else_=0)).label("closed_cases"),
            func.sum(case((Case.priority == "critical", 1), else_=0)).label("critical_cases"),
        )

        if project_id:
            query = query.filter(Case.project_id == project_id)

        result = query.one()

        return {
            "total_cases": result.total or 0,
            "open_cases": result.open_cases or 0,
            "closed_cases": result.closed_cases or 0,
            "critical_cases": result.critical_cases or 0,
        }

    def get_cases_paginated(self, db: Session, page: int, per_page: int, filters: dict[str, Any]) -> dict[str, Any]:
        """Get cases with pagination and filtering"""
        import math

        query = db.query(Case)

        if filters.get("project_id"):
            query = query.filter(Case.project_id == filters["project_id"])
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
        cases = query.options(joinedload(Case.assignee)).order_by(Case.created_at.desc()).offset(offset).limit(per_page).all()

        return {
            "cases": cases,
            "total": total,
            "total_pages": total_pages,
            "current_page": page,
        }


# Singleton instance
case_service = CaseService()
