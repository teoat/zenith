"""
Immutable Audit Chain Service

Extends the base AuditService with blockchain-style chain verification:
- Each record links to previous via previous_hash
- HMAC-SHA256 signatures using secret key
- Chain integrity verification for court-admissible evidence
"""

import logging
import hmac
import hashlib
import json
import os
import sqlite3
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)


class ImmutableAuditChainService:
    """
    Provides blockchain-style immutable audit chain with HMAC signatures.
    
    Each audit entry contains:
    - previous_hash: Links to previous record (blockchain-style)
    - hmac_signature: HMAC-SHA256 signature using secret key
    - data_hash: SHA-256 hash of the entry data
    """
    
    def __init__(
        self,
        db_path: str = "data/immutable_audit.db",
        hmac_secret: Optional[str] = None
    ):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        
        # HMAC secret from env or parameter
        self.hmac_secret = (
            hmac_secret or 
            os.environ.get('AUDIT_HMAC_SECRET') or 
            'default-dev-secret-change-in-production'
        ).encode()
        
        self._init_db()
    
    def _init_db(self):
        """Initialize immutable audit chain database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_chain (
                    id INTEGER PRIMARY KEY,
                    sequence_number INTEGER UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    entity_type TEXT,
                    entity_id TEXT,
                    user_id TEXT,
                    action TEXT NOT NULL,
                    data TEXT,  -- JSON payload
                    data_hash TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    hmac_signature TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_chain_sequence ON audit_chain(sequence_number)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_chain_timestamp ON audit_chain(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_chain_entity ON audit_chain(entity_type, entity_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_chain_user ON audit_chain(user_id)")
    
    def append_entry(
        self,
        event_type: str,
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Append a new entry to the immutable audit chain.
        
        Args:
            event_type: Type of event (e.g., 'case_update', 'evidence_added')
            action: Specific action taken
            entity_type: Type of entity affected
            entity_id: ID of entity affected
            user_id: User who performed the action
            data: Additional JSON data
            
        Returns:
            The created chain entry
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        data_json = json.dumps(data or {}, sort_keys=True, default=str)
        
        with sqlite3.connect(self.db_path) as conn:
            # Get previous hash and sequence number
            cursor = conn.execute(
                "SELECT sequence_number, data_hash FROM audit_chain ORDER BY sequence_number DESC LIMIT 1"
            )
            row = cursor.fetchone()
            
            if row:
                sequence_number = row[0] + 1
                previous_hash = row[1]
            else:
                sequence_number = 1
                previous_hash = "GENESIS"  # First entry in chain
            
            # Calculate data hash
            hash_input = f"{timestamp}|{event_type}|{action}|{entity_type}|{entity_id}|{user_id}|{data_json}|{previous_hash}"
            data_hash = hashlib.sha256(hash_input.encode()).hexdigest()
            
            # Calculate HMAC signature
            hmac_signature = hmac.new(
                self.hmac_secret,
                data_hash.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Insert entry
            conn.execute("""
                INSERT INTO audit_chain (
                    sequence_number, timestamp, event_type, entity_type, entity_id,
                    user_id, action, data, data_hash, previous_hash, hmac_signature
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sequence_number, timestamp, event_type, entity_type, entity_id,
                user_id, action, data_json, data_hash, previous_hash, hmac_signature
            ))
            
            entry = {
                "sequence_number": sequence_number,
                "timestamp": timestamp,
                "event_type": event_type,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "user_id": user_id,
                "action": action,
                "data": data,
                "data_hash": data_hash,
                "previous_hash": previous_hash,
                "hmac_signature": hmac_signature
            }
            
            logger.info(f"Appended audit chain entry #{sequence_number}: {event_type}/{action}")
            return entry
    
    def verify_chain_integrity(self) -> Dict[str, Any]:
        """
        Verify the integrity of the entire audit chain.
        
        Returns:
            Verification result with status, valid count, and any breaks
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT id, sequence_number, timestamp, event_type, entity_type, entity_id, user_id, action, data, data_hash, previous_hash, hmac_signature, created_at FROM audit_chain ORDER BY sequence_number ASC"
            )
            columns = [desc[0] for desc in cursor.description]
            
            total_entries = 0
            valid_entries = 0
            chain_breaks = []
            hmac_failures = []
            previous_hash = "GENESIS"
            
            for row in cursor:
                entry = dict(zip(columns, row))
                total_entries += 1
                
                # Verify chain linkage
                if entry['previous_hash'] != previous_hash:
                    chain_breaks.append({
                        "sequence_number": entry['sequence_number'],
                        "expected_previous": previous_hash,
                        "actual_previous": entry['previous_hash']
                    })
                
                # Recalculate data hash
                hash_input = (
                    f"{entry['timestamp']}|{entry['event_type']}|{entry['action']}|"
                    f"{entry['entity_type']}|{entry['entity_id']}|{entry['user_id']}|"
                    f"{entry['data']}|{entry['previous_hash']}"
                )
                calculated_hash = hashlib.sha256(hash_input.encode()).hexdigest()
                
                if calculated_hash != entry['data_hash']:
                    chain_breaks.append({
                        "sequence_number": entry['sequence_number'],
                        "issue": "data_hash_mismatch",
                        "stored": entry['data_hash'],
                        "calculated": calculated_hash
                    })
                
                # Verify HMAC signature
                calculated_hmac = hmac.new(
                    self.hmac_secret,
                    entry['data_hash'].encode(),
                    hashlib.sha256
                ).hexdigest()
                
                if calculated_hmac != entry['hmac_signature']:
                    hmac_failures.append({
                        "sequence_number": entry['sequence_number'],
                        "issue": "hmac_signature_invalid"
                    })
                else:
                    valid_entries += 1
                
                previous_hash = entry['data_hash']
            
            is_valid = len(chain_breaks) == 0 and len(hmac_failures) == 0
            
            return {
                "status": "valid" if is_valid else "compromised",
                "total_entries": total_entries,
                "valid_entries": valid_entries,
                "chain_breaks": chain_breaks[:10],  # Limit for response size
                "hmac_failures": hmac_failures[:10],
                "integrity_percentage": (valid_entries / total_entries * 100) if total_entries > 0 else 100,
                "verified_at": datetime.now(timezone.utc).isoformat()
            }
    
    def get_chain_proof(
        self,
        start_sequence: Optional[int] = None,
        end_sequence: Optional[int] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Export chain proof for court-admissible evidence.
        
        Args:
            start_sequence: Starting sequence number (optional)
            end_sequence: Ending sequence number (optional)
            entity_type: Filter by entity type (optional)
            entity_id: Filter by entity ID (optional)
            
        Returns:
            Chain proof document with entries and verification signature
        """
        with sqlite3.connect(self.db_path) as conn:
            query = "SELECT id, sequence_number, timestamp, event_type, entity_type, entity_id, user_id, action, data, data_hash, previous_hash, hmac_signature, created_at FROM audit_chain WHERE 1=1"
            params = []
            
            if start_sequence:
                query += " AND sequence_number >= ?"
                params.append(start_sequence)
            
            if end_sequence:
                query += " AND sequence_number <= ?"
                params.append(end_sequence)
            
            if entity_type:
                query += " AND entity_type = ?"
                params.append(entity_type)
            
            if entity_id:
                query += " AND entity_id = ?"
                params.append(entity_id)
            
            query += " ORDER BY sequence_number ASC"
            
            cursor = conn.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            
            entries = []
            for row in cursor:
                entry = dict(zip(columns, row))
                # Parse JSON data
                if entry.get('data'):
                    try:
                        entry['data'] = json.loads(entry['data'])
                    except:
                        pass
                entries.append(entry)
            
            # Calculate proof signature over entire export
            proof_data = json.dumps(entries, sort_keys=True, default=str)
            proof_signature = hmac.new(
                self.hmac_secret,
                proof_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return {
                "proof_document": {
                    "title": "Immutable Audit Chain Proof",
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "entry_count": len(entries),
                    "filters": {
                        "start_sequence": start_sequence,
                        "end_sequence": end_sequence,
                        "entity_type": entity_type,
                        "entity_id": entity_id
                    }
                },
                "entries": entries,
                "proof_signature": proof_signature,
                "verification_instructions": (
                    "To verify this proof: 1) Recalculate each entry's data_hash using the documented formula. "
                    "2) Verify each hmac_signature. 3) Verify chain linkage via previous_hash. "
                    "4) Verify proof_signature over the entire entries array."
                )
            }
    
    def get_entry(self, sequence_number: int) -> Optional[Dict[str, Any]]:
        """Get a specific chain entry by sequence number"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT id, sequence_number, timestamp, event_type, entity_type, entity_id, user_id, action, data, data_hash, previous_hash, hmac_signature, created_at FROM audit_chain WHERE sequence_number = ?",
                (sequence_number,)
            )
            columns = [desc[0] for desc in cursor.description]
            row = cursor.fetchone()
            
            if row:
                entry = dict(zip(columns, row))
                if entry.get('data'):
                    try:
                        entry['data'] = json.loads(entry['data'])
                    except:
                        pass
                return entry
            return None
    
    def get_recent_entries(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent chain entries"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT id, sequence_number, timestamp, event_type, entity_type, entity_id, user_id, action, data, data_hash, previous_hash, hmac_signature, created_at FROM audit_chain ORDER BY sequence_number DESC LIMIT ?",
                (limit,)
            )
            columns = [desc[0] for desc in cursor.description]
            
            entries = []
            for row in cursor:
                entry = dict(zip(columns, row))
                if entry.get('data'):
                    try:
                        entry['data'] = json.loads(entry['data'])
                    except:
                        pass
                entries.append(entry)
            
            return entries
    
    def get_chain_stats(self) -> Dict[str, Any]:
        """Get chain statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total_entries,
                    MIN(sequence_number) as first_sequence,
                    MAX(sequence_number) as last_sequence,
                    MIN(timestamp) as first_entry,
                    MAX(timestamp) as last_entry
                FROM audit_chain
            """)
            row = cursor.fetchone()
            
            # Event type distribution
            cursor = conn.execute("""
                SELECT event_type, COUNT(*) as count
                FROM audit_chain
                GROUP BY event_type
                ORDER BY count DESC
            """)
            event_types = {row[0]: row[1] for row in cursor}
            
            return {
                "total_entries": row[0] or 0,
                "first_sequence": row[1],
                "last_sequence": row[2],
                "first_entry": row[3],
                "last_entry": row[4],
                "event_type_distribution": event_types
            }


# Global instance
immutable_audit_chain = ImmutableAuditChainService()
