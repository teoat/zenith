"""
Workflow management router
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/cases/{case_id}/workflow")
async def create_workflow(case_id: str):
    """Create workflow for case investigation"""
    return {"message": f"Workflow creation for case {case_id} - to be implemented"}


@router.post("/tasks")
async def create_task():
    """Create automated investigation task"""
    return {"message": "Task creation endpoint - to be implemented"}
