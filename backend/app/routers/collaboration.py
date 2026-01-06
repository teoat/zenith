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
