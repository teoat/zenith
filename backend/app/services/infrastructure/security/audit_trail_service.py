"""
Audit Trail Enhancement Service
Ensures comprehensive audit logging coverage across all system operations.
"""

import hashlib
import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class AuditEventType(Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    CONFIGURATION_CHANGE = "configuration_change"
    SECURITY_EVENT = "security_event"
    API_ACCESS = "api_access"
    FILE_OPERATION = "file_operation"
    ADMIN_OPERATION = "admin_operation"


class AuditSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    event_id: str
    event_type: AuditEventType
    severity: AuditSeverity
    timestamp: datetime
    user_id: str | None
    session_id: str | None
    ip_address: str | None
    user_agent: str | None
    resource: str  # What was accessed/modified
    action: str  # What action was performed
    details: dict[str, Any]
    success: bool
    error_message: str | None = None
    checksum: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        data = asdict(self)
        data["event_type"] = self.event_type.value
        data["severity"] = self.severity.value
        data["timestamp"] = self.timestamp.isoformat()
        return data

    def calculate_checksum(self) -> str:
        """Calculate checksum for integrity verification."""
        # Create a canonical representation for hashing
        canonical_data = {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "resource": self.resource,
            "action": self.action,
            "details": json.dumps(self.details, sort_keys=True),
            "success": self.success,
        }

        data_str = json.dumps(canonical_data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()


class AuditTrailService:
    """
    Comprehensive audit trail service ensuring complete logging coverage
    and integrity verification.
    """

    def __init__(self):
        self.audit_events: list[AuditEvent] = []
        self.coverage_rules = self._initialize_coverage_rules()
        self.integrity_checks_enabled = True
        # Load audit events from persistent storage
        self._load_audit_events_from_persistent_store()

    def _load_audit_events_from_persistent_store(self):
        """Load audit events from the persistent audit database."""
        try:
            from app.services.core.audit_service import AuditService

            audit_db = AuditService()

            # Get recent audit logs (last 90 days to avoid loading too much)
            logs = audit_db.get_audit_trail(limit=1000)  # Get last 1000 entries

            for log in logs:
                # Convert to AuditEvent format
                event_type_map = {
                    "login": AuditEventType.USER_LOGIN,
                    "logout": AuditEventType.USER_LOGOUT,
                    "access": AuditEventType.DATA_ACCESS,
                    "modify": AuditEventType.DATA_MODIFICATION,
                    "admin": AuditEventType.ADMIN_OPERATION,
                    "security": AuditEventType.SECURITY_EVENT,
                    "api": AuditEventType.API_ACCESS,
                    "file": AuditEventType.FILE_OPERATION,
                }

                action = log.get("action", "access")
                event_type = event_type_map.get(action, AuditEventType.DATA_ACCESS)

                # Determine severity based on action
                severity_map = {
                    "login": AuditSeverity.LOW,
                    "logout": AuditSeverity.LOW,
                    "access": AuditSeverity.LOW,
                    "modify": AuditSeverity.MEDIUM,
                    "admin": AuditSeverity.HIGH,
                    "security": AuditSeverity.CRITICAL,
                    "api": AuditSeverity.MEDIUM,
                    "file": AuditSeverity.MEDIUM,
                }
                severity = severity_map.get(action, AuditSeverity.MEDIUM)

                # Parse details field for additional info
                details_str = log.get("details", "{}")
                if isinstance(details_str, str):
                    try:
                        details = json.loads(details_str)
                    except json.JSONDecodeError:
                        details = {"raw_details": details_str}
                else:
                    details = details_str or {}

                # Add log fields to details
                details.update(
                    {
                        "resource_type": log.get("resource_type"),
                        "resource_id": log.get("resource_id"),
                        "method": log.get("method"),
                        "endpoint": log.get("endpoint"),
                        "status_code": log.get("status_code"),
                        "processing_time": log.get("processing_time"),
                    }
                )

                event = AuditEvent(
                    event_id=str(log.get("id", "")),
                    event_type=event_type,
                    severity=severity,
                    timestamp=datetime.fromisoformat(
                        log.get("timestamp", datetime.now().isoformat())
                    ),
                    user_id=log.get("user_id"),
                    session_id=log.get("session_id"),
                    ip_address=log.get("ip_address"),
                    user_agent=log.get("user_agent"),
                    resource=log.get("resource_type", ""),
                    action=action,
                    details=details,
                    success=log.get("status_code", 200)
                    < 400,  # Success if status < 400
                    checksum=log.get("checksum"),
                )
                self.audit_events.append(event)

            logger.info(
                f"Loaded {len(self.audit_events)} audit events from persistent storage"
            )

        except Exception as e:
            logger.error(f"Failed to load audit events from persistent storage: {e}")

    def _initialize_coverage_rules(self) -> dict[str, dict[str, Any]]:
        """
        Define rules for what operations should be audited.
        """
        return {
            "authentication": {
                "required": True,
                "severity": AuditSeverity.MEDIUM,
                "retention_days": 365,
            },
            "data_modification": {
                "required": True,
                "severity": AuditSeverity.HIGH,
                "retention_days": 2555,  # 7 years
            },
            "admin_operations": {
                "required": True,
                "severity": AuditSeverity.HIGH,
                "retention_days": 2555,
            },
            "api_access": {
                "required": True,
                "severity": AuditSeverity.LOW,
                "retention_days": 90,
            },
            "file_operations": {
                "required": True,
                "severity": AuditSeverity.MEDIUM,
                "retention_days": 365,
            },
            "security_events": {
                "required": True,
                "severity": AuditSeverity.CRITICAL,
                "retention_days": 2555,
            },
        }

    async def log_event(
        self,
        event_type: AuditEventType,
        user_id: str | None,
        resource: str,
        action: str,
        details: dict[str, Any],
        success: bool = True,
        error_message: str | None = None,
        session_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> str:
        """
        Log an audit event with full context.
        """
        # Determine severity based on event type and rules
        severity = self._determine_severity(event_type, resource, action)

        # Generate unique event ID
        event_id = f"{event_type.value}_{int(datetime.now().timestamp() * 1000000)}"

        # Create audit event
        event = AuditEvent(
            event_id=event_id,
            event_type=event_type,
            severity=severity,
            timestamp=datetime.now(),
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource=resource,
            action=action,
            details=details,
            success=success,
            error_message=error_message,
        )

        # Calculate checksum for integrity
        if self.integrity_checks_enabled:
            event.checksum = event.calculate_checksum()

        # Store event
        self.audit_events.append(event)

        # Log to system logger as well
        log_level = self._severity_to_log_level(severity)
        logger.log(
            log_level,
            f"AUDIT: {event_id} - {user_id or 'system'} {action} on {resource}",
        )

        # In a real implementation, this would also persist to database
        await self._persist_event(event)

        return event_id

    def _determine_severity(
        self, event_type: AuditEventType, resource: str, action: str
    ) -> AuditSeverity:
        """
        Determine the severity of an audit event.
        """
        # Check coverage rules
        rule_key = self._get_rule_key(event_type)
        if rule_key in self.coverage_rules:
            return self.coverage_rules[rule_key]["severity"]

        # Default severity based on event type
        severity_map = {
            AuditEventType.SECURITY_EVENT: AuditSeverity.CRITICAL,
            AuditEventType.DATA_MODIFICATION: AuditSeverity.HIGH,
            AuditEventType.ADMIN_OPERATION: AuditSeverity.HIGH,
            AuditEventType.USER_LOGIN: AuditSeverity.MEDIUM,
            AuditEventType.USER_LOGOUT: AuditSeverity.LOW,
            AuditEventType.DATA_ACCESS: AuditSeverity.MEDIUM,
            AuditEventType.API_ACCESS: AuditSeverity.LOW,
            AuditEventType.FILE_OPERATION: AuditSeverity.MEDIUM,
            AuditEventType.CONFIGURATION_CHANGE: AuditSeverity.HIGH,
        }

        return severity_map.get(event_type, AuditSeverity.MEDIUM)

    def _get_rule_key(self, event_type: AuditEventType) -> str:
        """Get the rule key for an event type."""
        mapping = {
            AuditEventType.USER_LOGIN: "authentication",
            AuditEventType.USER_LOGOUT: "authentication",
            AuditEventType.DATA_ACCESS: "data_modification",
            AuditEventType.DATA_MODIFICATION: "data_modification",
            AuditEventType.CONFIGURATION_CHANGE: "admin_operations",
            AuditEventType.ADMIN_OPERATION: "admin_operations",
            AuditEventType.API_ACCESS: "api_access",
            AuditEventType.FILE_OPERATION: "file_operations",
            AuditEventType.SECURITY_EVENT: "security_events",
        }
        return mapping.get(event_type, "general")

    def _severity_to_log_level(self, severity: AuditSeverity) -> int:
        """Convert audit severity to logging level."""
        mapping = {
            AuditSeverity.CRITICAL: logging.CRITICAL,
            AuditSeverity.HIGH: logging.ERROR,
            AuditSeverity.MEDIUM: logging.WARNING,
            AuditSeverity.LOW: logging.INFO,
        }
        return mapping.get(severity, logging.INFO)

    async def _persist_event(self, event: AuditEvent):
        """
        Persist audit event to storage (database/file).
        In a real implementation, this would save to audit database.
        """
        # For now, just keep in memory
        # In production, this would:
        # 1. Save to dedicated audit database
        # 2. Write to tamper-proof log files
        # 3. Send to centralized logging system

    async def get_audit_trail(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        user_id: str | None = None,
        event_type: AuditEventType | None = None,
        resource: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Retrieve audit trail entries with filtering.
        """
        events = self.audit_events

        # Apply filters
        if start_date:
            events = [e for e in events if e.timestamp >= start_date]
        if end_date:
            events = [e for e in events if e.timestamp <= end_date]
        if user_id:
            events = [e for e in events if e.user_id == user_id]
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        if resource:
            events = [e for e in events if resource.lower() in e.resource.lower()]

        # Sort by timestamp (most recent first)
        events_sorted = sorted(events, key=lambda x: x.timestamp, reverse=True)

        # Apply limit
        events_limited = events_sorted[:limit]

        return [event.to_dict() for event in events_limited]

    async def verify_audit_integrity(self) -> dict[str, Any]:
        """
        Verify the integrity of audit logs.
        """
        if not self.integrity_checks_enabled:
            return {"integrity_check_enabled": False}

        total_events = len(self.audit_events)
        verified_events = 0
        corrupted_events = []

        for event in self.audit_events:
            if event.checksum:
                calculated_checksum = event.calculate_checksum()
                if calculated_checksum == event.checksum:
                    verified_events += 1
                else:
                    corrupted_events.append(event.event_id)

        integrity_score = verified_events / total_events if total_events > 0 else 1.0

        return {
            "total_events": total_events,
            "verified_events": verified_events,
            "corrupted_events": len(corrupted_events),
            "integrity_score": integrity_score,
            "corrupted_event_ids": corrupted_events[:10],  # First 10 for reporting
        }

    async def get_audit_coverage_report(self) -> dict[str, Any]:
        """
        Generate report on audit coverage completeness.
        """
        total_events = len(self.audit_events)
        if total_events == 0:
            return {
                "coverage_score": 0.0,
                "missing_coverage": list(self.coverage_rules.keys()),
                "recommendations": ["Implement comprehensive audit logging"],
            }

        # Analyze coverage by event type
        event_type_counts = {}
        for event in self.audit_events:
            event_key = self._get_rule_key(event.event_type)
            event_type_counts[event_key] = event_type_counts.get(event_key, 0) + 1

        # Calculate coverage score
        covered_rules = 0
        total_rules = len(self.coverage_rules)
        missing_coverage = []

        for rule_name in self.coverage_rules:
            if event_type_counts.get(rule_name, 0) > 0:
                covered_rules += 1
            else:
                missing_coverage.append(rule_name)

        coverage_score = covered_rules / total_rules if total_rules > 0 else 0.0

        return {
            "coverage_score": coverage_score,
            "total_rules": total_rules,
            "covered_rules": covered_rules,
            "missing_coverage": missing_coverage,
            "event_distribution": event_type_counts,
            "recommendations": self._generate_coverage_recommendations(
                missing_coverage
            ),
        }

    def _generate_coverage_recommendations(
        self, missing_coverage: list[str]
    ) -> list[str]:
        """Generate recommendations for missing audit coverage."""
        recommendations = []

        coverage_recommendations = {
            "authentication": "Implement comprehensive authentication event logging",
            "data_modification": "Add audit logging for all data modification operations",
            "admin_operations": "Log all administrative and configuration changes",
            "api_access": "Implement API access logging with request/response details",
            "file_operations": "Add logging for file upload/download operations",
            "security_events": "Implement security event detection and logging",
        }

        for missing in missing_coverage:
            if missing in coverage_recommendations:
                recommendations.append(coverage_recommendations[missing])

        if not recommendations:
            recommendations.append("Audit coverage appears complete")

        return recommendations

    async def get_compliance_report(self) -> dict[str, Any]:
        """
        Generate compliance-focused audit report.
        """
        # Get events from last 90 days (typical compliance period)
        ninety_days_ago = datetime.now() - timedelta(days=90)
        recent_events = await self.get_audit_trail(start_date=ninety_days_ago)

        compliance_metrics = {
            "total_audit_events": len(recent_events),
            "data_modification_events": len(
                [
                    e
                    for e in recent_events
                    if e["event_type"] in ["data_access", "data_modification"]
                ]
            ),
            "security_events": len(
                [e for e in recent_events if e["event_type"] == "security_event"]
            ),
            "admin_operations": len(
                [
                    e
                    for e in recent_events
                    if e["event_type"] in ["admin_operation", "configuration_change"]
                ]
            ),
            "failed_operations": len(
                [e for e in recent_events if not e.get("success", True)]
            ),
        }

        # Calculate compliance score based on coverage
        required_coverage = [
            "authentication",
            "data_modification",
            "security_events",
            "admin_operations",
        ]
        coverage_scores = []

        for required in required_coverage:
            if required in ["authentication"]:
                # Check login/logout events
                auth_events = len(
                    [
                        e
                        for e in recent_events
                        if e["event_type"] in ["user_login", "user_logout"]
                    ]
                )
                coverage_scores.append(
                    min(1.0, auth_events / 100)
                )  # Expect at least 100 auth events in 90 days
            elif required == "data_modification":
                coverage_scores.append(
                    min(1.0, compliance_metrics["data_modification_events"] / 1000)
                )
            elif required == "security_events":
                coverage_scores.append(
                    min(1.0, compliance_metrics["security_events"] / 10)
                )
            elif required == "admin_operations":
                coverage_scores.append(
                    min(1.0, compliance_metrics["admin_operations"] / 50)
                )

        compliance_score = (
            sum(coverage_scores) / len(coverage_scores) if coverage_scores else 0.0
        )

        return {
            "compliance_score": compliance_score,
            "metrics": compliance_metrics,
            "assessment_period_days": 90,
            "regulatory_requirements": {
                "gdpr_compliance": compliance_score >= 0.9,
                "sox_compliance": compliance_score >= 0.95,
                "pci_compliance": compliance_score >= 0.9,
            },
            "recommendations": self._generate_compliance_recommendations(
                compliance_score, compliance_metrics
            ),
        }

    def _generate_compliance_recommendations(
        self, compliance_score: float, metrics: dict[str, Any]
    ) -> list[str]:
        """Generate compliance-focused recommendations."""
        recommendations = []

        if compliance_score < 0.9:
            recommendations.append(
                "URGENT: Improve audit logging coverage to meet regulatory requirements"
            )

        if metrics["failed_operations"] > metrics["total_audit_events"] * 0.05:
            recommendations.append(
                "Investigate high rate of failed operations in audit logs"
            )

        if metrics["security_events"] < 10:
            recommendations.append(
                "Implement additional security event detection and logging"
            )

        if metrics["admin_operations"] < 25:
            recommendations.append(
                "Ensure all administrative actions are properly logged"
            )

        return (
            recommendations
            if recommendations
            else ["Audit compliance requirements appear to be met"]
        )


# Global instance
audit_service = AuditTrailService()
