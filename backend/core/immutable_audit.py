import hashlib
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class MerkleNode:
    def __init__(self, left=None, right=None, data=None):
        self.left: MerkleNode | None = left
        self.right: MerkleNode | None = right
        self.data = data
        self.hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        if self.data:
            # Leaf node
            return hashlib.sha256(self.data.encode()).hexdigest()

        # Internal node
        left_hash = self.left.hash if self.left else ""
        right_hash = self.right.hash if self.right else ""
        return hashlib.sha256((left_hash + right_hash).encode()).hexdigest()


class ImmutableAuditLog:
    """
    Implements a Merkle Tree backed audit log for cryptographic integrity.
    Ensures that past log entries cannot be tampered with without invalidating the root hash.
    """

    def __init__(self):
        self._entries: list[str] = []
        self._root: MerkleNode | None = None
        self._root_hash: str = ""

    def add_entry(self, data: dict) -> str:
        """Add an entry and re-calculate the tree root"""
        # Canonical JSON representation
        entry_str = json.dumps(data, sort_keys=True)
        timestamp = datetime.utcnow().isoformat()
        signed_entry = f"{timestamp}|{entry_str}"

        self._entries.append(signed_entry)
        self._rebuild_tree()

        return self._root_hash

    def _rebuild_tree(self):
        """Rebuild the Merkle tree from current entries"""
        if not self._entries:
            self._root = None
            self._root_hash = ""
            return

        nodes = [MerkleNode(data=e) for e in self._entries]

        while len(nodes) > 1:
            temp_nodes = []
            for i in range(0, len(nodes), 2):
                left = nodes[i]
                right = nodes[i + 1] if i + 1 < len(nodes) else None
                temp_nodes.append(MerkleNode(left=left, right=right))
            nodes = temp_nodes

        self._root = nodes[0]
        self._root_hash = self._root.hash
        logger.debug(f"[Audit] New Root Hash: {self._root_hash}")

    def verify_integrity(self, entries: list[str], expected_root: str) -> bool:
        """Verify if a list of entries matches a known root hash"""
        # Reconstruct tree mechanism (simplified for this class)
        temp_log = ImmutableAuditLog()
        temp_log._entries = entries
        temp_log._rebuild_tree()
        return temp_log._root_hash == expected_root

    def get_latest_hash(self) -> str:
        return self._root_hash


# Singleton
immutable_audit = ImmutableAuditLog()
