"""
Project Service - Business logic for project management
"""

import logging
import uuid

from sqlalchemy.orm import Session

from core.database import Project

logger = logging.getLogger(__name__)


class ProjectService:
    """Service for managing projects"""

    def get_project(self, db: Session, project_id: str) -> Project | None:
        """Get a project by ID"""
        return db.query(Project).filter(Project.id == project_id).first()

    def get_projects(self, db: Session, limit: int = 100) -> list[Project]:
        """Get all projects"""
        return db.query(Project).limit(limit).all()

    def create_project(
        self,
        db: Session,
        name: str,
        description: str | None = None,
        created_by: str | None = None,
    ) -> Project:
        """Create a new project"""
        project = Project(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            created_by=created_by,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    def create_default_project(self, db: Session) -> Project:
        """Ensure a default project exists"""
        project = db.query(Project).filter(Project.id == "default").first()
        if not project:
            project = Project(
                id="default",
                name="Default Project",
                description="Default project container",
            )
            db.add(project)
            db.commit()
            db.refresh(project)
        return project


project_service = ProjectService()
