"""
CRDT (Conflict-free Replicated Data Type) Service
Enables real-time collaborative editing without conflicts
"""

import uuid
from datetime import datetime
from typing import Any


class Operation:
    """Base class for CRDT operations"""

    def __init__(self, op_id: str, user_id: str, timestamp: float):
        self.op_id = op_id
        self.user_id = user_id
        self.timestamp = timestamp

    def to_dict(self) -> dict[str, Any]:
        return {
            "op_id": self.op_id,
            "user_id": self.user_id,
            "timestamp": self.timestamp,
        }


class InsertOperation(Operation):
    """Insert operation for text"""

    def __init__(
        self, op_id: str, user_id: str, timestamp: float, position: int, content: str
    ):
        super().__init__(op_id, user_id, timestamp)
        self.position = position
        self.content = content

    def to_dict(self) -> dict[str, Any]:
        return {
            **super().to_dict(),
            "type": "insert",
            "position": self.position,
            "content": self.content,
        }


class DeleteOperation(Operation):
    """Delete operation for text"""

    def __init__(
        self, op_id: str, user_id: str, timestamp: float, position: int, length: int
    ):
        super().__init__(op_id, user_id, timestamp)
        self.position = position
        self.length = length

    def to_dict(self) -> dict[str, Any]:
        return {
            **super().to_dict(),
            "type": "delete",
            "position": self.position,
            "length": self.length,
        }


class CRDTDocument:
    """
    CRDT-based document for conflict-free collaboration

    Implements a simplified version of Logoot/LSEQ CRDT
    """

    def __init__(self, document_id: str):
        self.document_id = document_id
        self.content: list[dict[str, Any]] = []
        self.operations: list[Operation] = []
        self.version = 0
        self.participants: dict[str, dict[str, Any]] = {}

    def apply_operation(self, operation: dict[str, Any]) -> bool:
        """
        Apply an operation to the document

        Returns True if successful, False if conflict
        """
        try:
            op_type = operation.get("type")

            if op_type == "insert":
                return self._apply_insert(operation)
            elif op_type == "delete":
                return self._apply_delete(operation)
            else:
                return False
        except Exception as e:
            print(f"Error applying operation: {e}")
            return False

    def _apply_insert(self, operation: dict[str, Any]) -> bool:
        """Apply insert operation"""
        position = operation.get("position", 0)
        content = operation.get("content", "")

        # Create element with unique ID
        element = {
            "id": str(uuid.uuid4()),
            "content": content,
            "user_id": operation.get("user_id"),
            "timestamp": operation.get("timestamp"),
            "position": position,
        }

        # Insert at position
        if position <= len(self.content):
            self.content.insert(position, element)
            self.version += 1
            return True

        return False

    def _apply_delete(self, operation: dict[str, Any]) -> bool:
        """Apply delete operation"""
        position = operation.get("position", 0)
        length = operation.get("length", 1)

        # Remove elements
        if position < len(self.content):
            del self.content[position : position + length]
            self.version += 1
            return True

        return False

    def get_text(self) -> str:
        """Get current document text"""
        return "".join(elem.get("content", "") for elem in self.content)

    def add_participant(self, user_id: str, user_data: dict[str, Any]):
        """Add a participant to the document"""
        self.participants[user_id] = {
            **user_data,
            "joined_at": datetime.utcnow().isoformat(),
            "cursor_position": 0,
        }

    def remove_participant(self, user_id: str):
        """Remove a participant from the document"""
        if user_id in self.participants:
            del self.participants[user_id]

    def update_cursor(self, user_id: str, position: int):
        """Update participant cursor position"""
        if user_id in self.participants:
            self.participants[user_id]["cursor_position"] = position

    def to_dict(self) -> dict[str, Any]:
        """Get document state"""
        return {
            "document_id": self.document_id,
            "content": self.get_text(),
            "version": self.version,
            "participants": self.participants,
            "element_count": len(self.content),
        }


class CRDTManager:
    """Manages multiple CRDT documents"""

    def __init__(self):
        self.documents: dict[str, CRDTDocument] = {}

    def create_document(self, document_id: str) -> CRDTDocument:
        """Create a new CRDT document"""
        if document_id not in self.documents:
            self.documents[document_id] = CRDTDocument(document_id)
        return self.documents[document_id]

    def get_document(self, document_id: str) -> CRDTDocument | None:
        """Get existing document"""
        return self.documents.get(document_id)

    def delete_document(self, document_id: str):
        """Delete a document"""
        if document_id in self.documents:
            del self.documents[document_id]

    def apply_operation(self, document_id: str, operation: dict[str, Any]) -> bool:
        """Apply operation to document"""
        doc = self.get_document(document_id)
        if not doc:
            doc = self.create_document(document_id)

        return doc.apply_operation(operation)

    def get_stats(self) -> dict[str, Any]:
        """Get manager statistics"""
        return {
            "total_documents": len(self.documents),
            "total_participants": sum(
                len(doc.participants) for doc in self.documents.values()
            ),
            "documents": [
                {
                    "document_id": doc_id,
                    "version": doc.version,
                    "participants": len(doc.participants),
                    "content_length": len(doc.get_text()),
                }
                for doc_id, doc in self.documents.items()
            ],
        }


# Global CRDT manager
crdt_manager = CRDTManager()
