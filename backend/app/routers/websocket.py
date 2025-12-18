import asyncio
import logging
from typing import List, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Any):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message: {e}")
                # Ideally remove dead connection here
                pass

manager = ConnectionManager()

@router.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for any client messages (optional)
            # For now, we mainly broadcast TO clients.
            data = await websocket.receive_text()
            # Echo back or process commands if needed
            # await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Endpoint to trigger a test alert (for demo/zenith showcase)
@router.post("/broadcast_alert")
async def trigger_alert(alert_data: dict):
    await manager.broadcast({
        "type": "new_alert",
        "data": alert_data
    })
    return {"status": "broadcasted"}


@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time adjudication alerts
    """
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
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for alerts: {e}")
        manager.disconnect(websocket)
