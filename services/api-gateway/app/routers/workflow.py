"""
Placeholder workflow router
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/workflows")
async def create_workflow():
    return {"message": "Workflow endpoint - to be implemented"}
