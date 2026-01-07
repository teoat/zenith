from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.business.project_service import project_service
from app.services.infrastructure.auth_service import auth_service
from core.database import get_db

router = APIRouter()


# Response models
class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    created_at: str | None = None

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


@router.get("", response_model=list[ProjectResponse])
async def get_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """List all projects"""
    projects = project_service.get_projects(db)
    # Ensure default exists if list is empty, or wait for explicit init?
    # Let's ensure default exists on first load to be safe.
    if not projects:
        default_p = project_service.create_default_project(db)
        projects = [default_p]

    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Create a new project"""
    user_id = getattr(current_user, "id", str(current_user)) if current_user else None

    new_project = project_service.create_project(db, name=project.name, description=project.description, created_by=user_id)

    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description,
        "created_at": new_project.created_at.isoformat() if new_project.created_at else None,
    }


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get project details"""
    project = project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat() if project.created_at else None,
    }
