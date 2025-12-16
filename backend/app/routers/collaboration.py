"""
Collaboration API Router
Provides REST endpoints for collaboration management
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any
from app.services.collaboration_service import get_collaboration_manager, CollaborationManager

router = APIRouter()

@router.get("/sessions", response_model=List[Dict[str, Any]])
async def get_sessions(manager: CollaborationManager = Depends(get_collaboration_manager)):
    """Get all active collaboration sessions"""
    return manager.get_all_sessions()

@router.get("/sessions/{session_id}", response_model=Dict[str, Any])
async def get_session_info(session_id: str, manager: CollaborationManager = Depends(get_collaboration_manager)):
    """Get information about a specific session"""
    session_info = manager.get_session_info(session_id)
    if not session_info['participants']:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_info

@router.get("/stats", response_model=Dict[str, Any])
async def get_collaboration_stats(manager: CollaborationManager = Depends(get_collaboration_manager)):
    """Get collaboration system statistics"""
    return manager.get_system_stats()

@router.post("/sessions/{session_id}/broadcast")
async def broadcast_to_session(
    session_id: str,
    message: Dict[str, Any],
    manager: CollaborationManager = Depends(get_collaboration_manager)
):
    """Broadcast a message to all participants in a session"""
    try:
        await manager.broadcast_to_session(session_id, message)
        return {"status": "message_broadcasted", "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to broadcast message: {str(e)}")

@router.post("/sessions/{session_id}/participants/{participant_id}/message")
async def send_to_participant(
    session_id: str,
    participant_id: str,
    message: Dict[str, Any],
    manager: CollaborationManager = Depends(get_collaboration_manager)
):
    """Send a message to a specific participant"""
    try:
        await manager.send_to_participant(session_id, participant_id, message)
        return {"status": "message_sent", "session_id": session_id, "participant_id": participant_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")