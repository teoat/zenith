import hashlib
import json
import logging
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class AuditService:
    """Comprehensive audit trail and compliance logging service"""

    def __init__(
        self, db_path: str = "data/audit.db", retention_days: int = 2555
    ):  # 7 years
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.retention_days = retention_days
        self._init_db()

        # Start cleanup thread
        self.cleanup_thread = threading.Thread(target=self._cleanup_worker, daemon=True)
        self.cleanup_thread.start()

    def _init_db(self):
        """Initialize audit database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    user_id TEXT,
                    session_id TEXT,
                    action TEXT NOT NULL,
                    resource_type TEXT NOT NULL,
                    resource_id TEXT,
                    method TEXT,
                    endpoint TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    status_code INTEGER,
                    response_size INTEGER,
                    processing_time REAL,
                    details TEXT,  -- JSON details
                    checksum TEXT, -- For integrity
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """
            )

            # Indexes for performance
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_timestamp ON audit_log(timestamp)"
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_user_id ON audit_log(user_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_action ON audit_log(action)")
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_resource ON audit_log(resource_type, resource_id)"
            )

            # Compliance events table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS compliance_events (
                    id INTEGER PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    description TEXT NOT NULL,
                    user_id TEXT,
                    resource_id TEXT,
                    details TEXT,  -- JSON
                    resolved BOOLEAN DEFAULT FALSE,
                    resolved_at TEXT,
                    resolved_by TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """
            )

    def log_request(
        self,
        user_id: Optional[str],
        session_id: Optional[str],
        method: str,
        endpoint: str,
        status_code: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        response_size: Optional[int] = None,
        processing_time: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log an API request for audit purposes"""

        audit_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "session_id": session_id,
            "action": "api_request",
            "resource_type": "api_endpoint",
            "resource_id": endpoint,
            "method": method,
            "endpoint": endpoint,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "status_code": status_code,
            "response_size": response_size,
            "processing_time": processing_time,
            "details": json.dumps(details) if details else None,
        }

        # Calculate checksum for integrity
        audit_entry["checksum"] = self._calculate_checksum(audit_entry)

        self._insert_audit_log(audit_entry)

        # Check for suspicious activity
        self._check_for_suspicious_activity(audit_entry)

    def log_user_action(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """Log a user action"""

        audit_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "ip_address": ip_address,
            "details": json.dumps(details) if details else None,
        }

        audit_entry["checksum"] = self._calculate_checksum(audit_entry)
        self._insert_audit_log(audit_entry)

    def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        user_id: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log a security event"""

        # Also log as audit entry
        audit_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "action": f"security_{event_type}",
            "resource_type": "security",
            "resource_id": resource_id,
            "details": json.dumps(
                {
                    "event_type": event_type,
                    "severity": severity,
                    "description": description,
                    **(details or {}),
                }
            ),
        }

        audit_entry["checksum"] = self._calculate_checksum(audit_entry)
        self._insert_audit_log(audit_entry)

        # Log as compliance event
        compliance_event = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "severity": severity,
            "description": description,
            "user_id": user_id,
            "resource_id": resource_id,
            "details": json.dumps(details) if details else None,
        }

        self._insert_compliance_event(compliance_event)

        # Log based on severity
        if severity == "critical":
            logger.critical(f"Security event: {description}")
        elif severity == "high":
            logger.error(f"Security event: {description}")
        elif severity == "medium":
            logger.warning(f"Security event: {description}")
        else:
            logger.info(f"Security event: {description}")

    def _insert_audit_log(self, entry: Dict[str, Any]) -> None:
        """Insert audit log entry"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO audit_log (
                        timestamp, user_id, session_id, action, resource_type, resource_id,
                        method, endpoint, ip_address, user_agent, status_code,
                        response_size, processing_time, details, checksum
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        entry.get("timestamp"),
                        entry.get("user_id"),
                        entry.get("session_id"),
                        entry.get("action"),
                        entry.get("resource_type"),
                        entry.get("resource_id"),
                        entry.get("method"),
                        entry.get("endpoint"),
                        entry.get("ip_address"),
                        entry.get("user_agent"),
                        entry.get("status_code"),
                        entry.get("response_size"),
                        entry.get("processing_time"),
                        entry.get("details"),
                        entry.get("checksum"),
                    ),
                )
        except Exception as e:
            logger.error(f"Failed to insert audit log: {e}")

    def _insert_compliance_event(self, event: Dict[str, Any]) -> None:
        """Insert compliance event"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO compliance_events (
                        timestamp, event_type, severity, description,
                        user_id, resource_id, details
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        event.get("timestamp"),
                        event.get("event_type"),
                        event.get("severity"),
                        event.get("description"),
                        event.get("user_id"),
                        event.get("resource_id"),
                        event.get("details"),
                    ),
                )
        except Exception as e:
            logger.error(f"Failed to insert compliance event: {e}")

    def _calculate_checksum(self, data: Dict[str, Any]) -> str:
        """Calculate checksum for audit integrity"""
        # Remove checksum field if present
        data_copy = {k: v for k, v in data.items() if k != "checksum"}
        data_str = json.dumps(data_copy, sort_keys=True, default=str)
        return hashlib.sha256(data_str.encode()).hexdigest()

    def _check_for_suspicious_activity(self, audit_entry: Dict[str, Any]) -> None:
        """Check for suspicious activity patterns"""
        user_id = audit_entry.get("user_id")
        status_code = audit_entry.get("status_code", 200)
        endpoint = audit_entry.get("endpoint", "")

        # Failed authentication attempts
        if status_code == 401 and "auth" in endpoint.lower():
            self._check_failed_auth_attempts(user_id)

        # Unusual access patterns
        if status_code == 403:
            self.log_security_event(
                "unauthorized_access",
                "medium",
                f"Unauthorized access attempt to {endpoint}",
                user_id=user_id,
                resource_id=endpoint,
            )

        # Suspicious API usage
        if self._is_suspicious_endpoint(endpoint):
            self.log_security_event(
                "suspicious_api_usage",
                "low",
                f"Access to sensitive endpoint: {endpoint}",
                user_id=user_id,
                resource_id=endpoint,
            )

    def _check_failed_auth_attempts(self, user_id: Optional[str]) -> None:
        """Check for multiple failed authentication attempts"""
        if not user_id:
            return

        try:
            with sqlite3.connect(self.db_path) as conn:
                # Count failed auth attempts in last hour
                cursor = conn.execute(
                    """
                    SELECT COUNT(*) FROM audit_log
                    WHERE user_id = ?
                    AND action = 'api_request'
                    AND endpoint LIKE '%auth%'
                    AND status_code = 401
                    AND timestamp > datetime('now', '-1 hour')
                """,
                    (user_id,),
                )

                failed_count = cursor.fetchone()[0]

                if failed_count >= 5:
                    self.log_security_event(
                        "brute_force_attempt",
                        "high",
                        f"Multiple failed authentication attempts: {failed_count}",
                        user_id=user_id,
                    )

        except Exception as e:
            logger.error(f"Failed to check auth attempts: {e}")

    def _is_suspicious_endpoint(self, endpoint: str) -> bool:
        """Check if endpoint is considered sensitive"""
        sensitive_patterns = ["/admin", "/config", "/system", "/backup", "/audit"]
        return any(pattern in endpoint.lower() for pattern in sensitive_patterns)

    def _cleanup_worker(self):
        """Background cleanup of old audit logs"""
        import time

        while True:
            try:
                self._cleanup_old_logs()
                time.sleep(86400)  # Clean up once per day
            except Exception as e:
                logger.error(f"Audit cleanup error: {e}")
                time.sleep(3600)  # Retry in 1 hour

    def _cleanup_old_logs(self):
        """Clean up audit logs older than retention period"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Delete old audit logs
                conn.execute(
                    """
                    DELETE FROM audit_log
                    WHERE timestamp < datetime('now', '-{} days')
                """.format(
                        self.retention_days
                    )
                )

                # Delete old compliance events (keep longer for compliance)
                conn.execute(
                    """
                    DELETE FROM compliance_events
                    WHERE timestamp < datetime('now', '-{} days')
                """.format(
                        self.retention_days * 2
                    )
                )  # Keep compliance events longer

                deleted_count = conn.total_changes
                if deleted_count > 0:
                    logger.info(f"Cleaned up {deleted_count} old audit log entries")

        except Exception as e:
            logger.error(f"Failed to cleanup audit logs: {e}")

    def get_audit_trail(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        limit: int = 100,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get audit trail with filtering"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                query = "SELECT id, action, user_id, timestamp, checksum, details FROM audit_log WHERE 1=1"
                params = []

                if user_id:
                    query += " AND user_id = ?"
                    params.append(user_id)

                if action:
                    query += " AND action = ?"
                    params.append(action)

                if resource_type:
                    query += " AND resource_type = ?"
                    params.append(resource_type)

                if start_date:
                    query += " AND timestamp >= ?"
                    params.append(start_date)

                if end_date:
                    query += " AND timestamp <= ?"
                    params.append(end_date)

                query += " ORDER BY timestamp DESC LIMIT ?"
                params.append(limit)

                cursor = conn.execute(query, params)
                columns = [desc[0] for desc in cursor.description]

                results = []
                for row in cursor:
                    result = dict(zip(columns, row))
                    # Parse JSON details
                    if result.get("details"):
                        try:
                            result["details"] = json.loads(result["details"])
                        except:
                            pass
                    results.append(result)

                return results

        except Exception as e:
            logger.error(f"Failed to get audit trail: {e}")
            return []

    def get_compliance_report(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate compliance report"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Date filter
                date_filter = ""
                params = []
                if start_date:
                    date_filter += " AND timestamp >= ?"
                    params.append(start_date)
                if end_date:
                    date_filter += " AND timestamp <= ?"
                    params.append(end_date)

                # Get compliance events
                cursor = conn.execute(
                    f"""
                    SELECT event_type, severity, COUNT(*) as count
                    FROM compliance_events
                    WHERE 1=1 {date_filter}
                    GROUP BY event_type, severity
                    ORDER BY count DESC
                """,
                    params,
                )

                events_by_type = {}
                for row in cursor:
                    event_type, severity, count = row
                    if event_type not in events_by_type:
                        events_by_type[event_type] = {}
                    events_by_type[event_type][severity] = count

                # Get audit statistics
                cursor = conn.execute(
                    f"""
                    SELECT
                        COUNT(*) as total_events,
                        COUNT(DISTINCT user_id) as unique_users,
                        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
                        AVG(processing_time) as avg_response_time
                    FROM audit_log
                    WHERE 1=1 {date_filter}
                """,
                    params,
                )

                stats_row = cursor.fetchone()
                stats = {
                    "total_events": stats_row[0],
                    "unique_users": stats_row[1],
                    "error_count": stats_row[2],
                    "avg_response_time": stats_row[3],
                }

                return {
                    "report_period": {
                        "start_date": start_date,
                        "end_date": end_date or datetime.now().isoformat(),
                    },
                    "compliance_events": events_by_type,
                    "audit_statistics": stats,
                    "generated_at": datetime.now().isoformat(),
                }

        except Exception as e:
            logger.error(f"Failed to generate compliance report: {e}")
            return {"error": str(e)}

    def verify_audit_integrity(self) -> Dict[str, Any]:
        """Verify audit log integrity by checking checksums"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    "SELECT id, checksum, timestamp, user_id, action, resource_type, resource_id, method, endpoint, ip_address, user_agent, status_code, response_size, processing_time, details FROM audit_log"
                )

                total_entries = 0
                valid_entries = 0
                invalid_entries = []

                for row in cursor:
                    total_entries += 1
                    entry_id = row[0]
                    stored_checksum = row[1]

                    # Recalculate checksum
                    entry_data = {
                        "timestamp": row[2],
                        "user_id": row[3],
                        "action": row[4],
                        "resource_type": row[5],
                        "resource_id": row[6],
                        "method": row[7],
                        "endpoint": row[8],
                        "ip_address": row[9],
                        "user_agent": row[10],
                        "status_code": row[11],
                        "response_size": row[12],
                        "processing_time": row[13],
                        "details": row[14],
                    }

                    calculated_checksum = self._calculate_checksum(entry_data)

                    if stored_checksum == calculated_checksum:
                        valid_entries += 1
                    else:
                        invalid_entries.append(entry_id)

                return {
                    "total_entries": total_entries,
                    "valid_entries": valid_entries,
                    "invalid_entries": len(invalid_entries),
                    "integrity_percentage": (
                        (valid_entries / total_entries * 100)
                        if total_entries > 0
                        else 100
                    ),
                    "invalid_entry_ids": invalid_entries[:10],  # First 10 for brevity
                    "verified_at": datetime.now().isoformat(),
                }

        except Exception as e:
            logger.error(f"Failed to verify audit integrity: {e}")
            return {"error": str(e)}


# Global audit service instance
audit_service = AuditService()
