from typing import Any

from fastapi import APIRouter, Depends


# Mock time travel service for now
class TimeTravelService:
    def get_case_history(self, case_id: str):
        return {"history": [], "message": "Time travel service not implemented"}


time_travel_service = TimeTravelService()

router = APIRouter(prefix="/cases", tags=["Time Travel"])


@router.get("/{case_id}/history", response_model=list[dict[str, Any]])
async def get_case_history(case_id: str, service: TimeTravelService = Depends(lambda: time_travel_service)):
    """
    Get the timeline of changes for a case graph.
    """
    return await service.get_case_history(case_id)


@router.get("/{case_id}/graph/snapshot/{snapshot_id}", response_model=dict[str, Any])
async def get_graph_snapshot(
    case_id: str,
    snapshot_id: str,
    service: TimeTravelService = Depends(lambda: time_travel_service),
):
    """
    Get the state of the graph at a specific history snapshot.
    """
    return await service.get_graph_snapshot(case_id, snapshot_id)
