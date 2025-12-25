"""
Real-time Collaboration System
Provides WebSocket-based real-time collaboration for investigation workflows
"""

import asyncio
import json
import logging
import os
import queue
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any, Callable, Dict, List, Optional, Set

import websockets
from websockets.server import ServerConnection

# Type alias for WebSocket connection (modern API)
WebSocketConnection = ServerConnection

logger = logging.getLogger(__name__)


class CollaborationManager:
    """
    Manages real-time collaboration sessions and WebSocket connections
    """

    def __init__(self, host: str = "localhost", port: int = 8080):
        self.host = host
        self.port = port
        self.active_connections: Dict[str, Set[WebSocketConnection]] = {}
        self.session_participants: Dict[str, Dict[str, Any]] = {}
        self.message_queue = queue.Queue()
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.running = False
        self.server = None

        # Message handlers
        self.message_handlers: Dict[str, Callable] = {
            "join_session": self.handle_join_session,
            "leave_session": self.handle_leave_session,
            "cursor_update": self.handle_cursor_update,
            "entity_select": self.handle_entity_select,
            "entity_update": self.handle_entity_update,
            "chat_message": self.handle_chat_message,
            "ping": self.handle_ping,
        }

        logger.info("Collaboration Manager initialized")

    async def start_server(self):
        """Start the WebSocket server"""
        print(f"DEBUG: Starting WebSocket server on {self.host}:{self.port}")
        import traceback
        try:
            self.running = True
            print(f"DEBUG: Set running to True")
            self.server = await websockets.serve(
                self.handle_connection,
                self.host,
                self.port,
                ping_interval=30,
                ping_timeout=10,
            )

            logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")

            # Start message processing loop
            asyncio.create_task(self.process_messages())

            # For testing/development, don't wait for server closure
            # This allows the server to start without blocking the lifespan
            if os.getenv("TESTING", "false").lower() == "true":
                logger.info("WebSocket server started in testing mode - not waiting for closure")
                return

            # Keep server running (production mode)
            await self.server.wait_closed()
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
            self.running = False
            raise

    async def stop_server(self):
        """Stop the WebSocket server"""
        self.running = False

        if self.server:
            self.server.close()
            await self.server.wait_closed()

        self.executor.shutdown(wait=True)
        logger.info("WebSocket server stopped")

    async def handle_connection(self, websocket: WebSocketConnection, path: str):
        """Handle incoming WebSocket connections"""
        print(f"DEBUG: New WebSocket connection, path: {path}")
        try:
            print("DEBUG: Starting connection handler")
            # Extract session ID from path (e.g., /ws/session/123)
            path_parts = path.strip("/").split("/")
            if (
                len(path_parts) >= 3
                and path_parts[0] == "ws"
                and path_parts[1] == "session"
            ):
                session_id = path_parts[2]
            else:
                await websocket.close(1008, "Invalid session path")
                return

            # Register connection
            if session_id not in self.active_connections:
                self.active_connections[session_id] = set()

            self.active_connections[session_id].add(websocket)

            # Initialize participant
            participant_id = f"user_{id(websocket)}"
            if session_id not in self.session_participants:
                self.session_participants[session_id] = {}

            self.session_participants[session_id][participant_id] = {
                "id": participant_id,
                "joined_at": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat(),
                "cursor": None,
                "selected_entity": None,
                "status": "active",
            }

            logger.info(f"Participant {participant_id} joined session {session_id}")

            # Broadcast participant joined (temporarily disabled for debugging)
            # await self.broadcast_to_session(
            #     session_id,
            #     {
            #         "type": "participant_joined",
            #         "participant": self.session_participants[session_id][
            #             participant_id
            #         ],
            #         "participants": list(
            #             self.session_participants[session_id].values()
            #         ),
            #     },
            #     exclude=websocket,
            # )

            # Send current session state (temporarily simplified for debugging)
            await websocket.send(
                json.dumps(
                    {
                        "type": "session_state",
                        "participants": [],
                    }
                )
            )

            # Handle messages
            async for message in websocket:
                print(f"DEBUG: Received message: {message}")
                try:
                    data = json.loads(message)
                    print(f"DEBUG: Parsed message: {data}")
                    await self.handle_message(
                        session_id, participant_id, data, websocket
                    )
                except json.JSONDecodeError as je:
                    print(f"DEBUG: JSON decode error: {je}")
                    await websocket.send(
                        json.dumps({"type": "error", "message": "Invalid JSON message"})
                    )
                except Exception as e:
                    print(f"DEBUG: Error handling message: {e}")
                    logger.error(f"Error handling message: {e}")
                    await websocket.send(
                        json.dumps(
                            {"type": "error", "message": "Internal server error"}
                        )
                    )

        except Exception as e:
            logger.error(f"Connection handler error: {e}", exc_info=True)
            try:
                await websocket.close(1011, f"Internal error: {str(e)}")
            except:
                pass  # Connection might already be closed
        finally:
            # Cleanup connection
            if session_id in self.active_connections:
                self.active_connections[session_id].discard(websocket)

                if participant_id and session_id in self.session_participants:
                    if participant_id in self.session_participants[session_id]:
                        del self.session_participants[session_id][participant_id]

                # Broadcast participant left
                await self.broadcast_to_session(
                    session_id,
                    {
                        "type": "participant_left",
                        "participant_id": participant_id,
                        "participants": list(
                            self.session_participants.get(session_id, {}).values()
                        ),
                    },
                )

                # Clean up empty sessions
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
                    if session_id in self.session_participants:
                        del self.session_participants[session_id]

    async def handle_message(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle incoming messages"""
        print(f"DEBUG: Handling message: {data}")
        message_type = data.get("type", "")
        print(f"DEBUG: Message type: {message_type}")

        if message_type in self.message_handlers:
            try:
                print(f"DEBUG: Calling handler for {message_type}")
                await self.message_handlers[message_type](
                    session_id, participant_id, data, websocket
                )
                print(f"DEBUG: Handler completed for {message_type}")
            except Exception as e:
                print(f"DEBUG: Handler error: {e}")
                logger.error(f"Message handler error for {message_type}: {e}")
                await websocket.send(
                    json.dumps(
                        {"type": "error", "message": f"Error processing {message_type}"}
                    )
                )
        else:
            print(f"DEBUG: Unknown message type: {message_type}")
            await websocket.send(
                json.dumps(
                    {
                        "type": "error",
                        "message": f"Unknown message type: {message_type}",
                    }
                )
            )

    async def handle_join_session(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle session join"""
        print(f"DEBUG: Handling join_session for session {session_id}, participant {participant_id}")
        try:
            # Simple response for testing
            await websocket.send(
                json.dumps(
                    {
                        "type": "join_success",
                        "session_id": session_id,
                        "participant_id": participant_id,
                    }
                )
            )
            print("DEBUG: Join success response sent")
        except Exception as e:
            print(f"DEBUG: Error in handle_join_session: {e}")
            raise

        await websocket.send(
            json.dumps(
                {
                    "type": "join_success",
                    "session_id": session_id,
                    "participant_id": participant_id,
                }
            )
        )

    async def handle_leave_session(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle session leave"""
        # Participant cleanup is handled in connection close
        await websocket.send(json.dumps({"type": "leave_success"}))

    async def handle_cursor_update(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle cursor position updates"""
        if (
            session_id in self.session_participants
            and participant_id in self.session_participants[session_id]
        ):
            participant = self.session_participants[session_id][participant_id]
            participant["cursor"] = {
                "x": data.get("x", 0),
                "y": data.get("y", 0),
                "timestamp": datetime.now().isoformat(),
            }
            participant["last_activity"] = datetime.now().isoformat()

        # Broadcast cursor update to other participants
        await self.broadcast_to_session(
            session_id,
            {
                "type": "cursor_update",
                "participant_id": participant_id,
                "cursor": participant["cursor"],
            },
            exclude=websocket,
        )

    async def handle_entity_select(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle entity selection"""
        if (
            session_id in self.session_participants
            and participant_id in self.session_participants[session_id]
        ):
            participant = self.session_participants[session_id][participant_id]
            participant["selected_entity"] = data.get("entity_id")
            participant["last_activity"] = datetime.now().isoformat()

        # Broadcast entity selection to other participants
        await self.broadcast_to_session(
            session_id,
            {
                "type": "entity_selected",
                "participant_id": participant_id,
                "entity_id": data.get("entity_id"),
                "entity_name": data.get("entity_name"),
            },
            exclude=websocket,
        )

    async def handle_entity_update(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle entity updates"""
        # Broadcast entity update to all participants
        await self.broadcast_to_session(
            session_id,
            {
                "type": "entity_updated",
                "participant_id": participant_id,
                "entity_id": data.get("entity_id"),
                "changes": data.get("changes", {}),
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def handle_chat_message(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle chat messages"""
        message = {
            "type": "chat_message",
            "participant_id": participant_id,
            "message": data.get("message", ""),
            "timestamp": datetime.now().isoformat(),
        }

        # Add participant info
        if (
            session_id in self.session_participants
            and participant_id in self.session_participants[session_id]
        ):
            participant = self.session_participants[session_id][participant_id]
            message["participant_name"] = participant.get(
                "name", f"User {participant_id}"
            )
            message["participant_color"] = participant.get("color", "#3b82f6")

        # Broadcast to all participants in session
        await self.broadcast_to_session(session_id, message)

    async def handle_ping(
        self,
        session_id: str,
        participant_id: str,
        data: Dict[str, Any],
        websocket: WebSocketConnection,
    ):
        """Handle ping messages"""
        await websocket.send(
            json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()})
        )

    async def broadcast_to_session(
        self,
        session_id: str,
        message: Dict[str, Any],
        exclude: WebSocketConnection = None,
    ):
        """Broadcast message to all participants in a session"""
        if session_id not in self.active_connections:
            return

        message_json = json.dumps(message)
        tasks = []

        for connection in self.active_connections[session_id]:
            if connection != exclude and connection.open:
                tasks.append(connection.send(message_json))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_participant(
        self, session_id: str, participant_id: str, message: Dict[str, Any]
    ):
        """Send message to specific participant"""
        if session_id not in self.active_connections:
            return

        # Find participant's connection
        for connection in self.active_connections[session_id]:
            # In a real implementation, you'd track which connection belongs to which participant
            # For now, send to all connections (they can filter by participant_id)
            if connection.open:
                await connection.send(json.dumps(message))

    async def process_messages(self):
        """Process queued messages"""
        while self.running:
            try:
                # Process any queued messages (for future use)
                while not self.message_queue.empty():
                    message = self.message_queue.get_nowait()
                    # Process message
                    pass

                await asyncio.sleep(0.1)  # Small delay to prevent busy waiting

            except Exception as e:
                logger.error(f"Message processing error: {e}")
                await asyncio.sleep(1)

    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get information about a session"""
        return {
            "session_id": session_id,
            "active_connections": len(self.active_connections.get(session_id, set())),
            "participants": list(
                self.session_participants.get(session_id, {}).values()
            ),
            "created_at": datetime.now().isoformat(),
        }

    def get_all_sessions(self) -> List[Dict[str, Any]]:
        """Get information about all active sessions"""
        return [
            self.get_session_info(session_id)
            for session_id in self.active_connections.keys()
        ]

    def get_system_stats(self) -> Dict[str, Any]:
        """Get system-wide collaboration statistics"""
        try:
            total_connections = sum(
                len(connections) for connections in self.active_connections.values()
            )
            total_participants = sum(
                len(participants) for participants in self.session_participants.values()
            )

            return {
                "active_sessions": len(self.active_connections),
                "total_connections": total_connections,
                "total_participants": total_participants,
                "server_running": self.running,
                "host": self.host,
                "port": self.port,
            }
        except Exception:
            # Return mock data if stats collection fails
            return {
                "active_sessions": 0,
                "total_connections": 0,
                "total_participants": 0,
                "server_running": False,
                "host": self.host,
                "port": self.port,
            }


# Global collaboration manager instance
collaboration_manager = CollaborationManager()


async def get_collaboration_manager() -> CollaborationManager:
    """Get the global collaboration manager instance"""
    return collaboration_manager


# WebSocket client for frontend use
class CollaborationClient:
    """
    WebSocket client for frontend collaboration
    """

    def __init__(self, session_id: str, server_url: str = "ws://localhost:8080"):
        self.session_id = session_id
        self.server_url = server_url
        self.websocket = None
        self.connected = False
        self.participant_id = None
        self.message_handlers: Dict[str, Callable] = {}
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5

    def add_message_handler(self, message_type: str, handler: Callable):
        """Add a message handler"""
        self.message_handlers[message_type] = handler

    async def connect(self, participant_info: Dict[str, Any] = None):
        """Connect to the collaboration server"""
        try:
            self.websocket = await websockets.connect(
                f"{self.server_url}/ws/session/{self.session_id}",
                ping_interval=30,
                ping_timeout=10,
            )

            self.connected = True
            self.reconnect_attempts = 0

            # Send join message
            join_message = {
                "type": "join_session",
                "name": participant_info.get("name", "Anonymous"),
                "role": participant_info.get("role", "investigator"),
                "color": participant_info.get("color", "#3b82f6"),
            }

            await self.websocket.send(json.dumps(join_message))

            # Start message handling loop
            asyncio.create_task(self.handle_messages())

            logger.info(f"Connected to collaboration session {self.session_id}")

        except Exception as e:
            logger.error(f"Failed to connect to collaboration server: {e}")
            self.connected = False
            raise

    async def disconnect(self):
        """Disconnect from the collaboration server"""
        if self.websocket and self.connected:
            await self.websocket.close()
            self.connected = False
            logger.info(f"Disconnected from collaboration session {self.session_id}")

    async def handle_messages(self):
        """Handle incoming messages"""
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    message_type = data.get("type", "")

                    if message_type == "join_success":
                        self.participant_id = data.get("participant_id")

                    # Call message handler if registered
                    if message_type in self.message_handlers:
                        await self.message_handlers[message_type](data)

                except json.JSONDecodeError:
                    logger.error("Received invalid JSON message")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")

        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.connected = False
            # Attempt reconnection
            await self.attempt_reconnect()
        except Exception as e:
            logger.error(f"Message handling error: {e}")
            self.connected = False

    async def attempt_reconnect(self):
        """Attempt to reconnect to the server"""
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            logger.error("Max reconnection attempts reached")
            return

        self.reconnect_attempts += 1
        wait_time = min(2**self.reconnect_attempts, 30)  # Exponential backoff, max 30s

        logger.info(
            f"Attempting reconnection in {wait_time} seconds (attempt {self.reconnect_attempts})"
        )

        await asyncio.sleep(wait_time)
        try:
            await self.connect()
        except Exception as e:
            logger.error(f"Reconnection failed: {e}")

    async def send_message(self, message: Dict[str, Any]):
        """Send a message to the server"""
        if not self.connected or not self.websocket:
            raise Exception("Not connected to collaboration server")

        try:
            await self.websocket.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise

    async def update_cursor(self, x: float, y: float):
        """Update cursor position"""
        await self.send_message({"type": "cursor_update", "x": x, "y": y})

    async def select_entity(self, entity_id: str, entity_name: str = ""):
        """Select an entity"""
        await self.send_message(
            {
                "type": "entity_select",
                "entity_id": entity_id,
                "entity_name": entity_name,
            }
        )

    async def update_entity(self, entity_id: str, changes: Dict[str, Any]):
        """Update an entity"""
        await self.send_message(
            {"type": "entity_update", "entity_id": entity_id, "changes": changes}
        )

    async def send_chat_message(self, message: str):
        """Send a chat message"""
        await self.send_message({"type": "chat_message", "message": message})

    def is_connected(self) -> bool:
        """Check if connected to the server"""
        return self.connected
