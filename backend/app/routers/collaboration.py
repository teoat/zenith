import logging
from typing import Any

from app.services.infrastructure.auth_service import auth_service
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

router = APIRouter(tags=["Collaboration"])

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Map case_id -> List of WebSockets
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, case_id: str):
        await websocket.accept()
        if case_id not in self.active_connections:
            self.active_connections[case_id] = []
        self.active_connections[case_id].append(websocket)
        logger.info(f"Client connected to case {case_id}")

    def disconnect(self, websocket: WebSocket, case_id: str):
        if case_id in self.active_connections:
            if websocket in self.active_connections[case_id]:
                self.active_connections[case_id].remove(websocket)
            if not self.active_connections[case_id]:
                del self.active_connections[case_id]

    async def broadcast(
        self, message: dict[str, Any], case_id: str, sender: WebSocket = None
    ):
        if case_id in self.active_connections:
            # Conflict Resolution: Simple Version Check
            if message.get("type") == "node_update":
                version = message.get("payload", {}).get("version", 0)
                # In a real app, we'd check against DB version.
                # Here we simulate accepting only if version > 0
                if version <= 0:
                    logger.warning(
                        f"Conflict detected: Outdated version {version} for case {case_id}"
                    )
                    return

            for connection in self.active_connections[case_id]:
                if connection != sender:
                    await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/collaboration/{case_id}")
async def websocket_endpoint(websocket: WebSocket, case_id: str):
    # Authenticate via Cookie
    token = websocket.cookies.get("access_token")

    # Fallback to query param if needed (optional migration step, skipping for strict security)
    # if not token:
    #     token = websocket.query_params.get("token")

    if not token:
        logger.warning(
            f"WebSocket connection rejected: No token. Cookies: {websocket.cookies.keys()}"
        )
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        # Verify token
        payload = auth_service.decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No user_id in token")

        # logger.info(f"WebSocket authenticated for user: {user_id}")

    except Exception as e:
        logger.warning(f"WebSocket authentication failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, case_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Expecting data format: { "type": "cursor_move", "user": "user_id", "payload": {...} }
            await manager.broadcast(data, case_id, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, case_id)
        # Broadcast disconnect event
        await manager.broadcast({"type": "user_left", "case_id": case_id}, case_id)


# ===== ADVANCED REAL-TIME COLLABORATION FEATURES =====

import json
from datetime import datetime, UTC
from fastapi import HTTPException

@router.websocket("/advanced/{resource_type}/{resource_id}")
async def advanced_collaborative_session(
    websocket: WebSocket,
    resource_type: str,
    resource_id: str,
    token: str = None
):
    """Advanced WebSocket endpoint for real-time collaboration with presence and editing"""

    # Mock authentication for demonstration
    user = type('User', (), {'id': f'user_{hash(token or "anonymous") % 1000}', 'email': 'user@example.com'})()

    await websocket.accept()

    # Connect user using advanced connection manager
    from app.services.collaboration.realtime_service import connection_manager

    connection_id = await connection_manager.connect(user.id, websocket, user.email)

    # Join collaborative session
    session_id = await connection_manager.join_session(user.id, resource_type, resource_id)

    # Send welcome message with full session info
    await websocket.send_json({
        "type": "session_joined",
        "session_id": session_id,
        "user_id": user.id,
        "participants": connection_manager.get_session_participants(session_id),
        "timestamp": datetime.now(UTC).isoformat()
    })

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # Handle collaboration event
            await connection_manager.handle_collaboration_event(user.id, message_data)

            # Send acknowledgment
            await websocket.send_json({
                "type": "ack",
                "event_id": message_data.get("id"),
                "timestamp": datetime.now(UTC).isoformat()
            })

    except WebSocketDisconnect:
        logging.info(f"Advanced WebSocket disconnected for user {user.id}")
    finally:
        await connection_manager.disconnect(user.id)


@router.websocket("/presence-updates")
async def presence_updates(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for real-time presence updates"""

    # Mock authentication
    user = type('User', (), {'id': f'user_{hash(token or "anonymous") % 1000}', 'email': 'user@example.com'})()

    await websocket.accept()

    # Connect user
    from app.services.collaboration.realtime_service import connection_manager
    connection_id = await connection_manager.connect(user.id, websocket, user.email)

    try:
        while True:
            # Send periodic presence updates
            await asyncio.sleep(30)  # Update every 30 seconds

            presence_data = {
                "type": "presence_update",
                "users": [
                    {
                        "user_id": uid,
                        "username": info.username,
                        "status": info.status,
                        "last_seen": info.last_seen.isoformat(),
                        "current_resource": info.current_resource
                    }
                    for uid, info in connection_manager.presence_info.items()
                ],
                "timestamp": datetime.now(UTC).isoformat()
            }

            await websocket.send_json(presence_data)

    except WebSocketDisconnect:
        logging.info(f"Presence WebSocket disconnected for user {user.id}")
    finally:
        await connection_manager.disconnect(user.id)


# REST API endpoints for collaboration management

@router.get("/collaboration/sessions/active")
async def get_active_sessions():
    """Get all active collaborative sessions"""
    try:
        from app.services.collaboration.realtime_service import connection_manager
        sessions = connection_manager.get_active_sessions()
        return {"sessions": sessions, "total": len(sessions)}
    except Exception as e:
        logging.error(f"Failed to get active sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve sessions")


@router.get("/collaboration/sessions/{session_id}/participants")
async def get_session_participants(session_id: str):
    """Get participants in a specific session"""
    try:
        from app.services.collaboration.realtime_service import connection_manager
        participants = connection_manager.get_session_participants(session_id)
        return {"participants": participants, "total": len(participants)}
    except Exception as e:
        logging.error(f"Failed to get session participants: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve participants")
