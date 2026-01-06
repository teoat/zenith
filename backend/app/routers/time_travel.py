from typing import Any

from fastapi import APIRouter, Depends

from backend.app.services.intelligence.time_travel_service import (
    TimeTravelService,
    time_travel_service,
)

router = APIRouter(prefix="/cases", tags=["Time Travel"])


@router.get("/{case_id}/history", response_model=list[dict[str, Any]])
async def get_case_history(
    case_id: str, service: TimeTravelService = Depends(lambda: time_travel_service)
):
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
