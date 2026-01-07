# backend/app/routers/entities.py
import logging
import uuid
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.infrastructure.auth_service import auth_service
from core.database import Entity, Relationship, get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["entities"])
relationships_router = APIRouter(tags=["relationships"])


@router.post("", status_code=201)
@router.post("/", status_code=201)
async def create_entity(
    entity_data: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Create a new entity"""
    try:
        logger.info(f"Creating entity with data: {entity_data}")
        # Basic validation
        if "entity_type" not in entity_data or "name" not in entity_data:
            raise HTTPException(status_code=400, detail="Missing requirement fields")

        entity_id = str(uuid.uuid4())
        new_entity = Entity(
            id=entity_id,
            case_id=entity_data.get("case_id"),  # Optional
            entity_type=entity_data["entity_type"],
            name=entity_data["name"],
            # Flatten or store attributes as JSON metadata
            # For test compatibility, we might need specific field handling
            entity_metadata=str(entity_data.get("attributes", {})),
        )
        db.add(new_entity)
        db.commit()
        db.refresh(new_entity)

        return {
            "entity_id": new_entity.id,
            "name": new_entity.name,
            "entity_type": new_entity.entity_type,
            "attributes": entity_data.get("attributes", {}),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating entity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@relationships_router.post("", status_code=201)
async def create_relationship(
    rel_data: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Create a relationship between entities"""
    try:
        logger.info(f"Creating relationship with data: {rel_data}")
        rel_id = str(uuid.uuid4())

        # Validate existence of entities if strict, or just insert
        # Assuming entities exist for now

        relationship = Relationship(
            id=rel_id,
            source_id=rel_data.get("from_entity_id"),
            target_id=rel_data.get("to_entity_id"),
            relationship_type=rel_data.get("relationship_type", "RELATED"),
            confidence=rel_data.get("confidence", 1.0),
        )
        db.add(relationship)
        db.commit()

        return {
            "relationship_id": relationship.id,
            "status": "created",
            "relationship": rel_data,
        }

    except Exception as e:
        logger.error(f"Error creating relationship: {e}")
        # Identify if FK failure
        if "foreign key" in str(e).lower():
            raise HTTPException(status_code=404, detail="One or more entities not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{entity_id}")
async def get_entity(
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get entity details"""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    return {
        "entity_id": entity.id,
        "name": entity.name,
        "entity_type": entity.entity_type,
    }
