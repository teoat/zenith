# Real-time Collaboration Service with WebSocket Support
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional, Set

from core.logging import logger


@dataclass
class CollaborativeSession:
    """A collaborative session for real-time editing"""

    id: str
    resource_type: str  # 'case', 'investigation', 'alert', etc.
    resource_id: str
    participants: Set[str]  # User IDs
    created_at: datetime
    last_activity: datetime
    is_active: bool = True


@dataclass
class CollaborationEvent:
    """Real-time collaboration event"""

    id: str
    session_id: str
    user_id: str
    event_type: str  # 'join', 'leave', 'edit', 'comment', 'cursor', etc.
    data: Dict[str, Any]
    timestamp: datetime


@dataclass
class PresenceInfo:
    """User presence information"""

    user_id: str
    username: str
    avatar_url: Optional[str]
    last_seen: datetime
    current_resource: Optional[str]
    cursor_position: Optional[Dict[str, Any]]  # For text editing
    status: str = "online"  # 'online', 'away', 'offline'


class WebSocketConnectionManager:
    """Manages WebSocket connections for real-time collaboration"""

    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Any]] = {}  # user_id -> connection info
        self.collaborative_sessions: Dict[str, CollaborativeSession] = {}
        self.presence_info: Dict[str, PresenceInfo] = {}

    async def connect(self, user_id: str, websocket: Any, username: str) -> str:
        """Handle new WebSocket connection"""
        connection_id = str(uuid.uuid4())

        self.active_connections[user_id] = {
            "websocket": websocket,
            "connection_id": connection_id,
            "username": username,
            "connected_at": datetime.now(UTC),
        }

        # Update presence
        self.presence_info[user_id] = PresenceInfo(user_id=user_id, username=username, last_seen=datetime.now(UTC), status="online")

        logger.info(f"User {username} ({user_id}) connected with connection {connection_id}")
        return connection_id

    async def disconnect(self, user_id: str):
        """Handle WebSocket disconnection"""
        if user_id in self.active_connections:
            connection_info = self.active_connections[user_id]

            # Update presence to offline
            if user_id in self.presence_info:
                self.presence_info[user_id].status = "offline"
                self.presence_info[user_id].last_seen = datetime.now(UTC)

            # Leave all sessions
            for session_id, session in self.collaborative_sessions.items():
                if user_id in session.participants:
                    await self.leave_session(user_id, session_id)

            # Remove connection
            del self.active_connections[user_id]
            logger.info(f"User {connection_info['username']} ({user_id}) disconnected")

    async def join_session(self, user_id: str, resource_type: str, resource_id: str) -> str:
        """Join or create a collaborative session"""
        session_key = f"{resource_type}:{resource_id}"

        if session_key not in self.collaborative_sessions:
            # Create new session
            session = CollaborativeSession(
                id=str(uuid.uuid4()),
                resource_type=resource_type,
                resource_id=resource_id,
                participants=set(),
                created_at=datetime.now(UTC),
                last_activity=datetime.now(UTC),
            )
            self.collaborative_sessions[session_key] = session
            logger.info(f"Created new collaborative session {session.id} for {resource_type}:{resource_id}")
        else:
            session = self.collaborative_sessions[session_key]

        # Add participant
        session.participants.add(user_id)
        session.last_activity = datetime.now(UTC)

        # Update presence
        if user_id in self.presence_info:
            self.presence_info[user_id].current_resource = session_key

        # Broadcast join event
        await self.broadcast_to_session(
            session_key,
            {
                "type": "user_joined",
                "user_id": user_id,
                "username": self.active_connections.get(user_id, {}).get("username", "Unknown"),
                "timestamp": datetime.now(UTC).isoformat(),
            },
            exclude_user=user_id,
        )

        logger.info(f"User {user_id} joined session {session.id}")
        return session.id

    async def leave_session(self, user_id: str, session_id: str):
        """Leave a collaborative session"""
        session_key = None
        for key, session in self.collaborative_sessions.items():
            if session.id == session_id:
                session_key = key
                break

        if not session_key:
            return

        session = self.collaborative_sessions[session_key]

        if user_id in session.participants:
            session.participants.remove(user_id)
            session.last_activity = datetime.now(UTC)

            # Update presence
            if user_id in self.presence_info:
                self.presence_info[user_id].current_resource = None

            # Broadcast leave event
            await self.broadcast_to_session(
                session_key,
                {
                    "type": "user_left",
                    "user_id": user_id,
                    "username": self.active_connections.get(user_id, {}).get("username", "Unknown"),
                    "timestamp": datetime.now(UTC).isoformat(),
                },
            )

            # Clean up empty sessions
            if not session.participants:
                session.is_active = False
                # Keep session for history, but mark as inactive

            logger.info(f"User {user_id} left session {session_id}")

    async def broadcast_to_session(self, session_key: str, message: Dict[str, Any], exclude_user: Optional[str] = None):
        """Broadcast message to all participants in a session"""
        if session_key not in self.collaborative_sessions:
            return

        session = self.collaborative_sessions[session_key]

        for user_id in session.participants:
            if user_id == exclude_user:
                continue

            if user_id in self.active_connections:
                try:
                    websocket = self.active_connections[user_id]["websocket"]
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id}: {e}")

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]["websocket"]
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")

    async def handle_collaboration_event(self, user_id: str, event_data: Dict[str, Any]):
        """Handle incoming collaboration events"""
        event_type = event_data.get("type", "")
        session_id = event_data.get("session_id", "")

        # Find session
        session = None
        session_key = None
        for key, s in self.collaborative_sessions.items():
            if s.id == session_id:
                session = s
                session_key = key
                break

        if not session:
            await self.send_to_user(user_id, {"type": "error", "message": "Session not found", "event_id": event_data.get("id")})
            return

        # Update session activity
        session.last_activity = datetime.now(UTC)

        # Handle different event types
        if event_type == "cursor_move":
            # Update cursor position
            if user_id in self.presence_info:
                self.presence_info[user_id].cursor_position = event_data.get("position")

            # Broadcast cursor position to other participants
            await self.broadcast_to_session(
                session_key,
                {
                    "type": "cursor_update",
                    "user_id": user_id,
                    "position": event_data.get("position"),
                    "timestamp": datetime.now(UTC).isoformat(),
                },
                exclude_user=user_id,
            )

        elif event_type == "text_edit":
            # Broadcast text changes
            await self.broadcast_to_session(
                session_key,
                {
                    "type": "text_change",
                    "user_id": user_id,
                    "changes": event_data.get("changes", {}),
                    "timestamp": datetime.now(UTC).isoformat(),
                },
                exclude_user=user_id,
            )

        elif event_type == "comment_add":
            # Broadcast new comments
            await self.broadcast_to_session(
                session_key,
                {
                    "type": "comment_added",
                    "user_id": user_id,
                    "comment": event_data.get("comment"),
                    "position": event_data.get("position"),
                    "timestamp": datetime.now(UTC).isoformat(),
                },
            )

        elif event_type == "status_update":
            # Update user status
            if user_id in self.presence_info:
                self.presence_info[user_id].status = event_data.get("status", "online")

            await self.broadcast_to_session(
                session_key,
                {
                    "type": "user_status_update",
                    "user_id": user_id,
                    "status": event_data.get("status", "online"),
                    "timestamp": datetime.now(UTC).isoformat(),
                },
            )

    def get_session_participants(self, session_id: str) -> List[Dict[str, Any]]:
        """Get list of participants in a session"""
        for session_key, session in self.collaborative_sessions.items():
            if session.id == session_id:
                participants = []
                for user_id in session.participants:
                    presence = self.presence_info.get(user_id)
                    if presence:
                        participants.append(
                            {
                                "user_id": user_id,
                                "username": presence.username,
                                "status": presence.status,
                                "cursor_position": presence.cursor_position,
                                "last_seen": presence.last_seen.isoformat(),
                            }
                        )
                return participants
        return []

    def get_active_sessions(self) -> List[Dict[str, Any]]:
        """Get all active collaborative sessions"""
        sessions = []
        for session_key, session in self.collaborative_sessions.items():
            if session.is_active:
                sessions.append(
                    {
                        "id": session.id,
                        "resource_type": session.resource_type,
                        "resource_id": session.resource_id,
                        "participant_count": len(session.participants),
                        "participants": list(session.participants),
                        "created_at": session.created_at.isoformat(),
                        "last_activity": session.last_activity.isoformat(),
                    }
                )
        return sessions


class ConflictResolutionService:
    """Handles conflicts in collaborative editing"""

    def __init__(self):
        self.conflicts = []
        self.resolutions = []

    def detect_conflict(self, session_id: str, user_changes: Dict[str, Any], existing_state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Detect if there are conflicting changes"""
        # Simple conflict detection - check if same fields modified
        set(user_changes.get("modified_fields", []))

        # In a real implementation, this would be more sophisticated
        # For now, assume no conflicts for simplicity
        return None

    def resolve_conflict(self, conflict_data: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve a detected conflict"""
        # Simple resolution: last-write-wins
        resolution = {
            "conflict_id": conflict_data.get("id"),
            "resolution": "last_write_wins",
            "winner": conflict_data.get("latest_user"),
            "timestamp": datetime.now(UTC).isoformat(),
        }

        self.resolutions.append(resolution)
        return resolution


class NotificationService:
    """Handles real-time notifications for collaboration"""

    def __init__(self, connection_manager: WebSocketConnectionManager):
        self.connection_manager = connection_manager
        self.pending_notifications = []

    async def send_notification(self, user_id: str, notification: Dict[str, Any]):
        """Send notification to specific user"""
        await self.connection_manager.send_to_user(
            user_id, {"type": "notification", "notification": notification, "timestamp": datetime.now(UTC).isoformat()}
        )

    async def broadcast_notification(self, session_key: str, notification: Dict[str, Any], exclude_user: Optional[str] = None):
        """Broadcast notification to session participants"""
        await self.connection_manager.broadcast_to_session(
            session_key,
            {"type": "notification", "notification": notification, "timestamp": datetime.now(UTC).isoformat()},
            exclude_user=exclude_user,
        )

    async def send_case_assignment_notification(self, case_id: str, assignee_id: str, assigner_name: str):
        """Send case assignment notification"""
        notification = {
            "id": str(uuid.uuid4()),
            "type": "case_assigned",
            "title": "Case Assigned",
            "message": f"You have been assigned a new case by {assigner_name}",
            "case_id": case_id,
            "action_url": f"/cases/{case_id}",
            "priority": "normal",
        }

        await self.send_notification(assignee_id, notification)

    async def send_comment_notification(self, case_id: str, commenter_name: str, participants: List[str]):
        """Send comment notification to case participants"""
        notification = {
            "id": str(uuid.uuid4()),
            "type": "new_comment",
            "title": "New Comment",
            "message": f"{commenter_name} added a comment to case {case_id}",
            "case_id": case_id,
            "action_url": f"/cases/{case_id}",
            "priority": "low",
        }

        for user_id in participants:
            await self.send_notification(user_id, notification)


# Global instances
connection_manager = WebSocketConnectionManager()
conflict_resolver = ConflictResolutionService()
