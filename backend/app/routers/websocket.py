"""
Enhanced WebSocket Handlers
Supports real-time case updates, notifications, and collaboration
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()

# Active connections by case ID
case_connections: Dict[str, Set[WebSocket]] = {}

# Active connections by user ID
user_connections: Dict[str, WebSocket] = {}

# Connection registry
all_connections: Set[WebSocket] = set()


class ConnectionManager:
    """Manages WebSocket connections and broadcasting"""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_sockets: Dict[str, WebSocket] = {}

    async def connect(
        self, websocket: WebSocket, user_id: str = None, room: str = None
    ):
        """Accept and register a new connection"""
        await websocket.accept()
        all_connections.add(websocket)

        if user_id:
            self.user_sockets[user_id] = websocket

        if room:
            if room not in self.active_connections:
                self.active_connections[room] = set()
            self.active_connections[room].add(websocket)

        logger.info(f"WebSocket connected - User: {user_id}, Room: {room}")

    def disconnect(self, websocket: WebSocket, user_id: str = None, room: str = None):
        """Remove a connection"""
        all_connections.discard(websocket)

        if user_id and user_id in self.user_sockets:
            del self.user_sockets[user_id]

        if room and room in self.active_connections:
            self.active_connections[room].discard(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]

        logger.info(f"WebSocket disconnected - User: {user_id}, Room: {room}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.user_sockets:
            try:
                await self.user_sockets[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to user {user_id}: {e}")

    async def broadcast_to_room(self, message: dict, room: str):
        """Broadcast message to all connections in a room"""
        if room in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to room {room}: {e}")
                    disconnected.append(connection)

            # Clean up disconnected sockets
            for ws in disconnected:
                self.active_connections[room].discard(ws)

    async def broadcast_all(self, message: dict):
        """Broadcast to all active connections"""
        disconnected = []
        for connection in all_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to all: {e}")
                disconnected.append(connection)

        for ws in disconnected:
            all_connections.discard(ws)


manager = ConnectionManager()


@router.websocket("/ws/case/{case_id}")
async def websocket_case_endpoint(websocket: WebSocket, case_id: str):
    """
    WebSocket endpoint for real-time case updates
    Clients subscribe to specific case changes
    """
    await manager.connect(websocket, room=f"case:{case_id}")

    try:
        # Send initial connection confirmation
        await websocket.send_json(
            {
                "type": "connected",
                "case_id": case_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "ping":
                # Respond to ping
                await websocket.send_json(
                    {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                )
            elif message_type == "update":
                # Broadcast update to all subscribers
                await manager.broadcast_to_room(
                    {
                        "type": "case_update",
                        "case_id": case_id,
                        "data": data.get("data"),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    f"case:{case_id}",
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, room=f"case:{case_id}")
    except Exception as e:
        logger.error(f"WebSocket error for case {case_id}: {e}")
        manager.disconnect(websocket, room=f"case:{case_id}")


@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for user notifications
    Real-time alerts, approvals, and system notifications
    """
    await manager.connect(websocket, user_id=user_id)

    try:
        await websocket.send_json(
            {
                "type": "connected",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        # Simulate periodic notifications
        async def send_notifications():
            while True:
                await asyncio.sleep(30)
                try:
                    await websocket.send_json(
                        {
                            "type": "notification",
                            "title": "System Update",
                            "message": "Your watchlist has been updated",
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    )
                except:
                    break

        # Start notification task
        notification_task = asyncio.create_task(send_notifications())

        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ping":
                await websocket.send_json(
                    {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                )
            elif data.get("type") == "mark_read":
                # Handle notification read acknowledgment
                await websocket.send_json(
                    {
                        "type": "ack",
                        "notification_id": data.get("notification_id"),
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id)
        notification_task.cancel()
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id=user_id)
        notification_task.cancel()


@router.websocket("/ws/collaboration/{session_id}")
async def websocket_collaboration_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time collaboration
    Supports cursor positions, edits, and presence
    """
    await manager.connect(websocket, room=f"collab:{session_id}")

    try:
        await websocket.send_json(
            {
                "type": "joined",
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "cursor":
                # Broadcast cursor position
                await manager.broadcast_to_room(
                    {
                        "type": "cursor_update",
                        "user": data.get("user"),
                        "position": data.get("position"),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    f"collab:{session_id}",
                )

            elif message_type == "edit":
                # Broadcast edit operation (CRDT)
                await manager.broadcast_to_room(
                    {
                        "type": "edit_operation",
                        "operation": data.get("operation"),
                        "user": data.get("user"),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    f"collab:{session_id}",
                )

            elif message_type == "presence":
                # Broadcast presence update
                await manager.broadcast_to_room(
                    {
                        "type": "presence_update",
                        "user": data.get("user"),
                        "status": data.get("status"),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    f"collab:{session_id}",
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, room=f"collab:{session_id}")
        # Notify others of disconnect
        await manager.broadcast_to_room(
            {
                "type": "user_left",
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            f"collab:{session_id}",
        )
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        manager.disconnect(websocket, room=f"collab:{session_id}")


# Helper functions for broadcasting events
async def broadcast_case_update(case_id: str, update_data: dict):
    """Broadcast case update to all subscribers"""
    await manager.broadcast_to_room(
        {
            "type": "case_update",
            "case_id": case_id,
            "data": update_data,
            "timestamp": datetime.utcnow().isoformat(),
        },
        f"case:{case_id}",
    )


async def send_notification(user_id: str, notification: dict):
    """Send notification to specific user"""
    await manager.send_personal_message(
        {
            "type": "notification",
            **notification,
            "timestamp": datetime.utcnow().isoformat(),
        },
        user_id,
    )


async def broadcast_system_alert(alert: dict):
    """Broadcast system-wide alert"""
    await manager.broadcast_all(
        {"type": "system_alert", **alert, "timestamp": datetime.utcnow().isoformat()}
    )
