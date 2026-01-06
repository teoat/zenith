import contextlib
import json
import logging
from datetime import datetime
from typing import Any

from app.core.exceptions import ZenithError
from app.services.infrastructure.auth_service import AuthService
from app.services.integration.collaboration.sync_service import sync_manager
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()
auth_service = AuthService()


# --- Connection Managers ---
class SimpleConnectionManager:
    """Basic manager for broadcasting to all connected clients"""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            f"WebSocket client connected. Total: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(
                f"WebSocket client disconnected. Total: {len(self.active_connections)}"
            )

    async def broadcast(self, message: Any):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except (ZenithError, Exception) as e:
                logger.error(f"Failed to send message: {e}")


class CollaborationManager:
    """Manager for case-specific collaboration"""

    def __init__(self):
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
        self, message: dict[str, Any], case_id: str, sender: WebSocket | None = None
    ):
        if case_id in self.active_connections:
            for connection in self.active_connections[case_id]:
                if connection != sender:
                    with contextlib.suppress(Exception):
                        await connection.send_json(message)


# Global instances
manager = SimpleConnectionManager()
collab_manager = CollaborationManager()


# --- WebSocket Endpoints ---
@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """Real-time adjudication alerts"""
    await manager.connect(websocket)
    try:
        await websocket.send_json(
            {
                "type": "connected",
                "room": "alerts",
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except (ZenithError, Exception) as e:
        logger.error(f"WebSocket error for alerts: {e}")
        manager.disconnect(websocket)


@router.websocket("/ws/metrics")
async def metrics_websocket(websocket: WebSocket):
    """Real-time system metrics"""
    from app.routers.metrics_ws import metrics_manager

    await metrics_manager.connect(websocket)
    try:
        initial_metrics = metrics_manager.collect_system_metrics()
        await websocket.send_json({"type": "metrics", "payload": initial_metrics})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        metrics_manager.disconnect(websocket)
    except (ZenithError, Exception) as e:
        logger.error(f"WebSocket error for metrics: {e}")
        metrics_manager.disconnect(websocket)


@router.websocket("/ws/collaboration/{case_id}")
async def collaboration_websocket(
    websocket: WebSocket, case_id: str, token: str | None = None
):
    """Case-specific collaboration"""
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return
    try:
        user_data = await auth_service.validate_jwt_token(token)
        if not user_data:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception:
        await websocket.close(code=4001, reason="Authentication failed")
        return
    await collab_manager.connect(websocket, case_id)
    try:
        while True:
            data = await websocket.receive_json()
            await collab_manager.broadcast(data, case_id, sender=websocket)
    except WebSocketDisconnect:
        collab_manager.disconnect(websocket, case_id)
    except (ZenithError, Exception) as e:
        logger.error(f"WebSocket error for collaboration: {e}")
        collab_manager.disconnect(websocket, case_id)


async def handle_websocket_message(client_id: str, message: dict[str, Any]) -> None:
    """Handle incoming WebSocket message for sync"""
    message_type = message.get("type")
    try:
        if message_type == "subscribe":
            document_id = message.get("document_id")
            if document_id:
                await sync_manager.subscribe_to_document(client_id, document_id)
        elif message_type == "unsubscribe":
            document_id = message.get("document_id")
            if document_id:
                await sync_manager.unsubscribe_from_document(client_id, document_id)
        elif message_type == "operation":
            document_id = message.get("document_id")
            operation_data = message.get("operation")
            if document_id and operation_data:
                await sync_manager.handle_operation(
                    client_id, document_id, operation_data
                )
        elif message_type == "sync":
            document_id = message.get("document_id")
            client_vector_clock = message.get("vector_clock", {})
            if document_id:
                await sync_manager.sync_client(
                    client_id, document_id, client_vector_clock
                )
        elif message_type == "ping":
            await sync_manager._send_to_client(
                client_id, {"type": "pong", "timestamp": datetime.now().isoformat()}
            )
    except (ZenithError, Exception) as e:
        logger.error(f"Error handling message {message_type}: {e!s}")


@router.websocket("/ws/sync/{user_id}")
async def sync_websocket(websocket: WebSocket, user_id: str):
    """Real-time document sync with CRDT support"""
    await websocket.accept()
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
    try:
        payload = auth_service.decode_token(token)
        if payload.get("sub") != user_id:
            await websocket.close(code=1008, reason="Token mismatch")
            return
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return
    client_id = f"{user_id}_{datetime.now().timestamp()}"
    await sync_manager.register_client(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_websocket_message(client_id, message)
    except WebSocketDisconnect:
        await sync_manager.unregister_client(client_id)
    except (ZenithError, Exception) as e:
        logger.error(f"WebSocket error for sync: {e}")
        await sync_manager.unregister_client(client_id)


# --- REST Trigger Endpoints ---
@router.post("/broadcast_alert")
async def trigger_alert(alert_data: dict):
    await manager.broadcast({"type": "new_alert", "data": alert_data})
    return {"status": "broadcasted"}


@router.websocket("/ws/frenly/{user_id}")
async def frenly_websocket(websocket: WebSocket, user_id: str):
    """Real-time Frenly AI event stream"""
    await websocket.accept()
    token = websocket.query_params.get("token")
    # Basic auth check
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
    try:
        # Validate token
        payload = auth_service.decode_token(token)
        # Note: In production, check payload['sub'] == user_id or admin
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return
    from app.services.frenly_event_bus import frenly_event_bus

    try:
        # Subscribe to Redis events and forward to WebSocket
        async for event in frenly_event_bus.subscribe(user_id):
            await websocket.send_json(event)
    except WebSocketDisconnect:
        logger.info(f"Frenly stream disconnected for user {user_id}")
    except (ZenithError, Exception) as e:
        logger.error(f"Frenly stream error: {e}")
        with contextlib.suppress(Exception):
            await websocket.close(code=1011)
