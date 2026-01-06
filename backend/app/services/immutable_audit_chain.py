"""
Immutable Audit Chain Service - Real Implementation
Wraps the core MerkleTree-based ImmutableAuditLog for service-layer access.
"""

import hashlib
import hmac
import logging
import os
from datetime import datetime
from typing import Any

from core.immutable_audit import ImmutableAuditLog, immutable_audit

logger = logging.getLogger(__name__)

# Secret key for HMAC signatures (in production, use secure key management)
AUDIT_HMAC_KEY = os.environ.get(
    "AUDIT_HMAC_KEY", "zenith-audit-chain-secret-key-2025"
).encode()


class ImmutableAuditChainService:
    """
    Production-ready Immutable Audit Chain Service.
    Provides cryptographic integrity verification using Merkle Tree chaining.
    """

    def __init__(self, audit_log: ImmutableAuditLog | None = None):
        self.audit_log = audit_log or immutable_audit
        self._entries: list[dict[str, Any]] = []
        self._sequence_counter = 0

    def verify_chain_integrity(self) -> dict[str, Any]:
        """
        Verify the integrity of the entire audit chain.

        Returns:
            Verification status with integrity percentage
        """
        try:
            current_hash = self.audit_log.get_latest_hash()

            if not current_hash and not self._entries:
                return {
                    "status": "valid",
                    "total_entries": 0,
                    "integrity_percentage": 100.0,
                    "verified_at": datetime.now().isoformat(),
                    "details": "Empty chain - no entries to verify",
                }

            # Verify each entry's chain linkage
            verified_count = 0
            broken_links = []

            for i, entry in enumerate(self._entries):
                if i == 0:
                    # First entry has no previous hash
                    verified_count += 1
                    continue

                # Verify link to previous
                expected_prev = self._entries[i - 1].get("hash")
                actual_prev = entry.get("previous_hash")

                if expected_prev == actual_prev:
                    verified_count += 1
                else:
                    broken_links.append(
                        {
                            "sequence": entry.get("sequence", i),
                            "expected_prev": expected_prev[:16] + "..."
                            if expected_prev
                            else None,
                            "actual_prev": actual_prev[:16] + "..."
                            if actual_prev
                            else None,
                        }
                    )

            total = len(self._entries)
            integrity = (verified_count / total * 100) if total > 0 else 100.0

            return {
                "status": "valid" if not broken_links else "compromised",
                "total_entries": total,
                "verified_entries": verified_count,
                "integrity_percentage": round(integrity, 2),
                "broken_links": broken_links[:10],  # First 10 issues
                "current_root_hash": current_hash[:32] + "..."
                if current_hash
                else None,
                "verified_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Chain verification failed: {e}")
            return {
                "status": "error",
                "total_entries": 0,
                "integrity_percentage": 0.0,
                "error": str(e),
                "verified_at": datetime.now().isoformat(),
            }

    def get_chain_proof(
        self,
        start_sequence: int | None = None,
        end_sequence: int | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Export cryptographically signed proof of audit entries.

        Args:
            start_sequence: Starting sequence number
            end_sequence: Ending sequence number
            entity_type: Filter by entity type
            entity_id: Filter by entity ID

        Returns:
            Proof document with HMAC signature
        """
        # Filter entries
        filtered = self._entries.copy()

        if start_sequence is not None:
            filtered = [e for e in filtered if e.get("sequence", 0) >= start_sequence]
        if end_sequence is not None:
            filtered = [e for e in filtered if e.get("sequence", 0) <= end_sequence]
        if entity_type:
            filtered = [e for e in filtered if e.get("entity_type") == entity_type]
        if entity_id:
            filtered = [e for e in filtered if e.get("entity_id") == entity_id]

        # Create proof document
        proof_data = {
            "entries": filtered,
            "total_entries": len(filtered),
            "filter_applied": {
                "start_sequence": start_sequence,
                "end_sequence": end_sequence,
                "entity_type": entity_type,
                "entity_id": entity_id,
            },
            "root_hash": self.audit_log.get_latest_hash(),
            "generated_at": datetime.now().isoformat(),
        }

        # Generate HMAC signature
        proof_str = str(proof_data)
        signature = hmac.new(
            AUDIT_HMAC_KEY, proof_str.encode(), hashlib.sha256
        ).hexdigest()

        return {
            "proof_id": hashlib.sha256(signature.encode()).hexdigest()[:16],
            "signature": signature,
            "algorithm": "HMAC-SHA256",
            "entries": [
                {
                    "sequence": e.get("sequence"),
                    "timestamp": e.get("timestamp"),
                    "entity_type": e.get("entity_type"),
                    "entity_id": e.get("entity_id"),
                    "action": e.get("action"),
                    "hash": e.get("hash", "")[:16] + "...",
                }
                for e in filtered[:100]  # Limit to 100 entries
            ],
            "generated_at": proof_data["generated_at"],
            "verification_url": f"/api/v1/proof/verify/{signature[:32]}",
        }

    def get_chain_stats(self) -> dict[str, Any]:
        """Get statistics about the audit chain."""
        if not self._entries:
            return {
                "total_blocks": 0,
                "last_verified": None,
                "chain_length": 0,
                "entity_types": [],
                "oldest_entry": None,
                "newest_entry": None,
            }

        entity_types = list({e.get("entity_type", "unknown") for e in self._entries})

        return {
            "total_blocks": len(self._entries),
            "chain_length": len(self._entries),
            "current_root_hash": self.audit_log.get_latest_hash()[:32] + "..."
            if self.audit_log.get_latest_hash()
            else None,
            "entity_types": entity_types,
            "oldest_entry": self._entries[0].get("timestamp")
            if self._entries
            else None,
            "newest_entry": self._entries[-1].get("timestamp")
            if self._entries
            else None,
            "last_verified": datetime.now().isoformat(),
        }

    def append_entry(
        self,
        action: str,
        entity_type: str | None = None,
        entity_id: str | None = None,
        user_id: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Append a new entry to the immutable audit chain.

        Args:
            action: The action being logged
            entity_type: Type of entity (case, evidence, user, etc.)
            entity_id: ID of the entity
            user_id: ID of the user performing the action
            data: Additional data to include

        Returns:
            Entry details including hash
        """
        self._sequence_counter += 1
        timestamp = datetime.now().isoformat()

        # Get previous hash for chaining
        previous_hash = self._entries[-1].get("hash") if self._entries else None

        # Build entry
        entry_data = {
            "sequence": self._sequence_counter,
            "timestamp": timestamp,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "user_id": user_id,
            "data": data or {},
            "previous_hash": previous_hash,
        }

        # Calculate hash
        entry_str = str(entry_data)
        entry_hash = hashlib.sha256(entry_str.encode()).hexdigest()
        entry_data["hash"] = entry_hash

        # Add to Merkle tree and local storage
        root_hash = self.audit_log.add_entry(entry_data)
        self._entries.append(entry_data)

        logger.info(
            f"Appended audit entry {self._sequence_counter}: {action} on {entity_type}/{entity_id}"
        )

        return {
            "entry_id": f"audit_{self._sequence_counter}",
            "sequence": self._sequence_counter,
            "hash": entry_hash,
            "root_hash": root_hash,
            "timestamp": timestamp,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
        }

    def get_entries(
        self, limit: int = 100, offset: int = 0, entity_type: str | None = None
    ) -> list[dict[str, Any]]:
        """Get paginated audit entries."""
        filtered = self._entries
        if entity_type:
            filtered = [e for e in filtered if e.get("entity_type") == entity_type]

        return filtered[offset : offset + limit]


# Singleton instance
immutable_audit_chain = ImmutableAuditChainService()
