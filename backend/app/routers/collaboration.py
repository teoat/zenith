from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Dict, Any
import json
import logging

router = APIRouter(tags=["Collaboration"])

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map case_id -> List of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

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

    async def broadcast(self, message: Dict[str, Any], case_id: str, sender: WebSocket = None):
        if case_id in self.active_connections:
            # Conflict Resolution: Simple Version Check
            if message.get("type") == "node_update":
                version = message.get("payload", {}).get("version", 0)
                # In a real app, we'd check against DB version. 
                # Here we simulate accepting only if version > 0
                if version <= 0:
                    logger.warning(f"Conflict detected: Outdated version {version} for case {case_id}")
                    return

            for connection in self.active_connections[case_id]:
                if connection != sender:
                    await connection.send_json(message)


manager = ConnectionManager()

@router.websocket("/ws/collaboration/{case_id}")
async def websocket_endpoint(websocket: WebSocket, case_id: str):
    await manager.connect(websocket, case_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Expecting data format: { "type": "cursor_move", "user": "userId", "payload": {...} }
            await manager.broadcast(data, case_id, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, case_id)
        # Broadcast disconnect event
        await manager.broadcast({"type": "user_left", "case_id": case_id}, case_id)
