"""Lightweight sync & collaboration shim (API surface only).
Implements presence and a simple in-memory event queue for local testing.
"""

import asyncio
import logging
import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import WebSocket


class SyncService:
    def __init__(self):
        self.presence: dict[str, dict[str, Any]] = {}
        self.events: list[dict[str, Any]] = []

    def announce(self, user_id: str, metadata: dict[str, Any]):
        self.presence[user_id] = metadata

    def leave(self, user_id: str):
        if user_id in self.presence:
            del self.presence[user_id]

    def push_event(self, payload: dict[str, Any]) -> str:
        event_id = str(uuid.uuid4())
        ev = {"id": event_id, "payload": payload}
        self.events.append(ev)
        return event_id

    def pop_events(self):
        evs = self.events[:]
        self.events.clear()
        return evs


logger = logging.getLogger(__name__)


class OperationType(Enum):
    INSERT = "insert"
    DELETE = "delete"
    RETAIN = "retain"


@dataclass
class CRDTOperation:
    """Conflict-free Replicated Data Type operation"""

    id: str
    type: OperationType
    position: int
    content: str | None = None
    length: int | None = None
    timestamp: float = None
    client_id: str = None
    vector_clock: dict[str, int] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().timestamp()
        if self.vector_clock is None:
            self.vector_clock = {}


class CRDTDocument:
    """CRDT implementation for collaborative document editing"""

    def __init__(self, document_id: str):
        self.document_id = document_id
        self.content = ""
        self.operations: list[CRDTOperation] = []
        self.vector_clock: dict[str, int] = {}
        self.client_states: dict[str, dict[str, int]] = {}

    def apply_operation(self, operation: CRDTOperation) -> bool:
        """Apply an operation to the document"""
        try:
            # Check if operation is already applied
            if self._is_operation_applied(operation):
                return False

            # Apply operation based on type
            if operation.type == OperationType.INSERT:
                self._apply_insert(operation)
            elif operation.type == OperationType.DELETE:
                self._apply_delete(operation)
            elif operation.type == OperationType.RETAIN:
                # Retain operations don't modify content
                pass

            # Record operation
            self.operations.append(operation)

            # Update vector clock
            self._update_vector_clock(operation)

            logger.debug(f"Applied {operation.type.value} operation to document {self.document_id}")
            return True

        except Exception as e:
            logger.error(f"Error applying operation: {e!s}")
            return False

    def _apply_insert(self, operation: CRDTOperation):
        """Apply insert operation"""
        position = min(operation.position, len(self.content))
        self.content = self.content[:position] + (operation.content or "") + self.content[position:]

    def _apply_delete(self, operation: CRDTOperation):
        """Apply delete operation"""
        length = operation.length or 1
        position = min(operation.position, len(self.content))
        end_position = min(position + length, len(self.content))
        self.content = self.content[:position] + self.content[end_position:]

    def _is_operation_applied(self, operation: CRDTOperation) -> bool:
        """Check if operation has already been applied"""
        return any(existing_op.id == operation.id for existing_op in self.operations)

    def _update_vector_clock(self, operation: CRDTOperation):
        """Update vector clock with operation"""
        client_id = operation.client_id or "unknown"

        # Update local vector clock
        self.vector_clock[client_id] = max(
            self.vector_clock.get(client_id, 0),
            operation.vector_clock.get(client_id, 0) + 1,
        )

        # Merge with operation's vector clock
        for key, value in operation.vector_clock.items():
            self.vector_clock[key] = max(self.vector_clock.get(key, 0), value)

    def create_insert_operation(self, position: int, content: str, client_id: str) -> CRDTOperation:
        """Create an insert operation"""
        operation_id = str(uuid.uuid4())

        # Update vector clock for this client
        self.vector_clock[client_id] = self.vector_clock.get(client_id, 0) + 1

        return CRDTOperation(
            id=operation_id,
            type=OperationType.INSERT,
            position=position,
            content=content,
            client_id=client_id,
            vector_clock=self.vector_clock.copy(),
        )

    def create_delete_operation(self, position: int, length: int, client_id: str) -> CRDTOperation:
        """Create a delete operation"""
        operation_id = str(uuid.uuid4())

        # Update vector clock for this client
        self.vector_clock[client_id] = self.vector_clock.get(client_id, 0) + 1

        return CRDTOperation(
            id=operation_id,
            type=OperationType.DELETE,
            position=position,
            length=length,
            client_id=client_id,
            vector_clock=self.vector_clock.copy(),
        )

    def get_state(self) -> dict[str, Any]:
        """Get current document state"""
        return {
            "document_id": self.document_id,
            "content": self.content,
            "vector_clock": self.vector_clock,
            "operations_count": len(self.operations),
            "last_modified": datetime.now().isoformat(),
        }

    def get_missing_operations(self, client_vector_clock: dict[str, int]) -> list[CRDTOperation]:
        """Get operations that client hasn't seen yet"""
        missing_ops = []

        for operation in self.operations:
            client_version = client_vector_clock.get(operation.client_id, 0)
            operation_version = operation.vector_clock.get(operation.client_id, 0)

            if operation_version > client_version:
                missing_ops.append(operation)

        return missing_ops


class RealTimeSyncManager:
    """Enhanced real-time synchronization manager with CRDT support"""

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.user_sessions: dict[str, str] = {}  # websocket_id -> user_id
        self.document_locks: dict[str, str] = {}  # document_id -> user_id
        self.documents: dict[str, CRDTDocument] = {}  # document_id -> CRDTDocument
        self.client_subscriptions: dict[str, set[str]] = {}  # client_id -> set of document_ids
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """Connect a new WebSocket client"""
        await websocket.accept()
        connection_id = str(uuid.uuid4())

        self.active_connections[connection_id] = websocket
        self.user_sessions[connection_id] = user_id

        logger.info(f"WebSocket connected: {connection_id} for user {user_id}")

        # Send welcome message
        await self.send_to_connection(
            connection_id,
            {
                "type": "welcome",
                "connection_id": connection_id,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
            },
        )

        return connection_id

    async def register_client(self, websocket: WebSocket, user_id: str) -> str:
        """Alias for connect() - for backward compatibility"""
        return await self.connect(websocket, user_id)

    def unregister_client(self, connection_id: str):
        """Alias for disconnect() - for backward compatibility"""
        return self.disconnect(connection_id)

    def disconnect(self, connection_id: str):
        """Disconnect a WebSocket client"""
        if connection_id in self.active_connections:
            user_id = self.user_sessions.get(connection_id)

            # Release any locks held by this user
            locks_to_release = [doc_id for doc_id, locked_user in self.document_locks.items() if locked_user == user_id]
            for doc_id in locks_to_release:
                del self.document_locks[doc_id]

            del self.active_connections[connection_id]
            del self.user_sessions[connection_id]

            logger.info(f"WebSocket disconnected: {connection_id} for user {user_id}")

    async def send_to_connection(self, connection_id: str, message: dict[str, Any]):
        """Send message to specific connection"""
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to {connection_id}: {e}")
                self.disconnect(connection_id)

    async def broadcast_to_user(
        self,
        user_id: str,
        message: dict[str, Any],
        exclude_connection: str | None = None,
    ):
        """Broadcast message to all connections of a user"""
        for conn_id, uid in self.user_sessions.items():
            if uid == user_id and conn_id != exclude_connection:
                await self.send_to_connection(conn_id, message)

    async def broadcast_to_document(
        self,
        document_id: str,
        message: dict[str, Any],
        exclude_user: str | None = None,
    ):
        """Broadcast message to all users viewing a document"""
        # Find all users currently viewing this document
        viewers = set()
        for conn_id in self.active_connections:
            # In a real implementation, you'd track which documents each connection is viewing
            # For now, broadcast to all connections
            user_id = self.user_sessions.get(conn_id)
            if user_id and user_id != exclude_user:
                viewers.add(user_id)

        for user_id in viewers:
            await self.broadcast_to_user(user_id, {**message, "document_id": document_id})

    async def handle_crdt_operation(self, connection_id: str, operation: dict[str, Any]):
        """Handle CRDT-based operations for conflict-free replication"""
        document_id = operation.get("document_id")
        user_id = self.user_sessions.get(connection_id)

        if not document_id or not user_id:
            return

        # Initialize CRDT state if needed
        if document_id not in self.crdt_states:
            self.crdt_states[document_id] = {
                "operations": [],
                "vector_clock": {},
                "last_updated": datetime.now().isoformat(),
            }

        # Apply operation to CRDT state
        crdt_state = self.crdt_states[document_id]

        # Simple vector clock implementation
        if user_id not in crdt_state["vector_clock"]:
            crdt_state["vector_clock"][user_id] = 0
        crdt_state["vector_clock"][user_id] += 1

        operation["timestamp"] = datetime.now().isoformat()
        operation["user_id"] = user_id
        operation["operation_id"] = str(uuid.uuid4())

        crdt_state["operations"].append(operation)
        crdt_state["last_updated"] = operation["timestamp"]

        # Broadcast the operation to other clients
        await self.broadcast_to_document(
            document_id,
            {
                "type": "crdt_operation",
                "operation": operation,
                "vector_clock": crdt_state["vector_clock"],
            },
            exclude_user=user_id,
        )

        logger.info(f"Applied CRDT operation: {operation['type']} on {document_id} by {user_id}")

    async def handle_document_lock(self, connection_id: str, lock_request: dict[str, Any]):
        """Handle document locking for collaborative editing"""
        document_id = lock_request.get("document_id")
        action = lock_request.get("action")  # "acquire" or "release"
        user_id = self.user_sessions.get(connection_id)

        if not document_id or not user_id:
            return

        if action == "acquire":
            if document_id in self.document_locks:
                current_lock_holder = self.document_locks[document_id]
                if current_lock_holder != user_id:
                    await self.send_to_connection(
                        connection_id,
                        {
                            "type": "lock_denied",
                            "document_id": document_id,
                            "current_holder": current_lock_holder,
                            "reason": "Document already locked by another user",
                        },
                    )
                    return

            # Acquire lock
            self.document_locks[document_id] = user_id
            await self.broadcast_to_document(
                document_id,
                {
                    "type": "lock_acquired",
                    "document_id": document_id,
                    "user_id": user_id,
                },
            )

        elif action == "release":
            if self.document_locks.get(document_id) == user_id:
                del self.document_locks[document_id]
                await self.broadcast_to_document(
                    document_id,
                    {
                        "type": "lock_released",
                        "document_id": document_id,
                        "user_id": user_id,
                    },
                )

    async def handle_message(self, connection_id: str, message: dict[str, Any]):
        """Handle incoming WebSocket messages"""
        message_type = message.get("type")

        if message_type == "crdt_operation":
            await self.handle_crdt_operation(connection_id, message)
        elif message_type == "document_lock":
            await self.handle_document_lock(connection_id, message)
        elif message_type == "ping":
            await self.send_to_connection(connection_id, {"type": "pong"})
        elif message_type == "subscribe":
            # Handle document subscription
            document_id = message.get("document_id")
            if document_id:
                await self.send_to_connection(
                    connection_id,
                    {
                        "type": "subscribed",
                        "document_id": document_id,
                        "crdt_state": self.crdt_states.get(document_id, {}),
                    },
                )
        else:
            logger.warning(f"Unknown message type: {message_type}")

    def get_active_users(self) -> dict[str, Any]:
        """Get information about active users and connections"""
        users_online = set(self.user_sessions.values())
        user_connections = defaultdict(list)

        for conn_id, user_id in self.user_sessions.items():
            user_connections[user_id].append(conn_id)

        return {
            "total_connections": len(self.active_connections),
            "unique_users": len(users_online),
            "user_connections": dict(user_connections),
            "locked_documents": self.document_locks,
        }

    def resolve_conflicts(self, document_id: str) -> list[dict[str, Any]]:
        """Resolve conflicts in CRDT operations using vector clocks"""
        if document_id not in self.crdt_states:
            return []

        crdt_state = self.crdt_states[document_id]
        operations = crdt_state["operations"]

        # Simple conflict resolution: last-write-wins for same operation type
        resolved_operations = []
        operation_groups = defaultdict(list)

        for op in operations:
            key = f"{op.get('entity_type')}_{op.get('entity_id')}_{op.get('operation_type')}"
            operation_groups[key].append(op)

        for key, ops in operation_groups.items():
            if len(ops) == 1:
                resolved_operations.extend(ops)
            else:
                # Sort by timestamp and take the latest
                ops.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
                resolved_operations.append(ops[0])

        return resolved_operations


# Global instance
sync_manager = RealTimeSyncManager()
