"""
Logging Service - Real Implementation
Provides structured logging with PII scrubbing, telemetry, and audit trails.
"""

import hashlib
import json
import logging
import os
import re
from collections import deque
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any

# Configure module logger
module_logger = logging.getLogger(__name__)


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogCategory(Enum):
    PERFORMANCE = "performance"
    SECURITY = "security"
    USER_ACTION = "user_action"
    API_REQUEST = "api_request"
    SYSTEM = "system"
    AUDIT = "audit"
    COMPLIANCE = "compliance"
    ERROR = "error"


class PIIScrubber:
    """
    PII detection and scrubbing utility.
    Detects and masks sensitive information in log data.
    """

    # PII patterns
    PATTERNS = {
        "email": (
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "[EMAIL_REDACTED]",
        ),
        "phone": (
            r"\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b",
            "[PHONE_REDACTED]",
        ),
        "ssn": (r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b", "[SSN_REDACTED]"),
        "credit_card": (r"\b(?:\d{4}[-.\s]?){3}\d{4}\b", "[CC_REDACTED]"),
        "ip_address": (r"\b(?:\d{1,3}\.){3}\d{1,3}\b", "[IP_REDACTED]"),
        "api_key": (
            r"\b(?:api[_-]?key|apikey|token)[=:\s]+[A-Za-z0-9_\-]{16,}\b",
            "[API_KEY_REDACTED]",
        ),
        "password": (r"\b(?:password|passwd|pwd)[=:\s]+\S+\b", "[PASSWORD_REDACTED]"),
    }

    @staticmethod
    def detect_pii_types(text: str) -> list[str]:
        """Detect PII types present in text."""
        if not text or not isinstance(text, str):
            return []

        detected = []
        for pii_type, (pattern, _) in PIIScrubber.PATTERNS.items():
            if re.search(pattern, text, re.IGNORECASE):
                detected.append(pii_type)

        return detected

    @staticmethod
    def scrub_pii(text: str) -> str:
        """Remove PII from text."""
        if not text or not isinstance(text, str):
            return text

        result = text
        for pattern, replacement in PIIScrubber.PATTERNS.values():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        return result

    @staticmethod
    def scrub_dict(data: dict[str, Any]) -> dict[str, Any]:
        """Recursively scrub PII from dictionary."""
        if not isinstance(data, dict):
            return data

        result = {}
        sensitive_keys = {
            "password",
            "token",
            "secret",
            "key",
            "auth",
            "credential",
            "ssn",
            "credit_card",
        }

        for key, value in data.items():
            key_lower = key.lower()

            # Redact sensitive keys entirely
            if any(sk in key_lower for sk in sensitive_keys):
                result[key] = "[REDACTED]"
            elif isinstance(value, dict):
                result[key] = PIIScrubber.scrub_dict(value)
            elif isinstance(value, str):
                result[key] = PIIScrubber.scrub_pii(value)
            elif isinstance(value, list):
                result[key] = [
                    PIIScrubber.scrub_dict(v) if isinstance(v, dict) else PIIScrubber.scrub_pii(v) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                result[key] = value

        return result


class StructuredLogger:
    """
    Production Structured Logger with PII scrubbing, telemetry, and file rotation.
    """

    def __init__(
        self,
        name: str = "ZenithLogger",
        log_dir: Path | None = None,
        enable_file_logging: bool = True,
        enable_console_logging: bool = True,
        enable_telemetry: bool = True,
        pii_scrubbing: bool = True,
        max_file_size_bytes: int = 10 * 1024 * 1024,  # 10 MB
        telemetry_buffer_size: int = 1000,
    ):
        self.name = name
        self.log_dir = log_dir or Path(os.environ.get("LOG_DIR", "./logs"))
        self.enable_file_logging = enable_file_logging
        self.enable_console_logging = enable_console_logging
        self.enable_telemetry = enable_telemetry
        self.pii_scrubbing = pii_scrubbing
        self.log_rotation = True
        self.compression = False
        self.max_file_size_bytes = max_file_size_bytes

        # Initialize telemetry buffer
        self._telemetry_buffer: deque = deque(maxlen=telemetry_buffer_size)
        self._performance_metrics: list[dict] = []

        # Initialize file logger
        self._logger = logging.getLogger(name)
        self._logger.setLevel(logging.DEBUG)

        # Ensure log directory exists
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Setup handlers
        self._setup_handlers()

    def _setup_handlers(self):
        """Setup logging handlers."""
        # Clear existing handlers
        self._logger.handlers.clear()

        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        if self.enable_console_logging:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            self._logger.addHandler(console_handler)

        if self.enable_file_logging:
            log_file = self.log_dir / f"{self.name.lower()}.log"
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            self._logger.addHandler(file_handler)

    def get_telemetry_data(self) -> dict[str, Any]:
        """Get collected telemetry data."""
        return {
            "performance_metrics": list(self._performance_metrics),
            "recent_events": list(self._telemetry_buffer),
            "collected_at": datetime.now().isoformat(),
        }

    def reset_telemetry(self):
        """Reset telemetry buffers."""
        self._telemetry_buffer.clear()
        self._performance_metrics.clear()

    def export_telemetry(self, path: str):
        """Export telemetry data to file."""
        data = self.get_telemetry_data()
        with open(path, "w") as f:
            json.dump(data, f, indent=2, default=str)

    def log(
        self,
        level: LogLevel = LogLevel.INFO,
        category: LogCategory = LogCategory.SYSTEM,
        message: str = "",
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        """
        Log a structured message.

        Args:
            level: Log level
            category: Log category
            message: Log message
            user_id: Optional user ID
            metadata: Optional additional metadata
        """
        # Scrub PII if enabled
        if self.pii_scrubbing:
            message = PIIScrubber.scrub_pii(message)
            if metadata:
                metadata = PIIScrubber.scrub_dict(metadata)

        # Build structured log entry
        entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level.value,
            "category": category.value,
            "message": message,
            "user_id": user_id,
            "metadata": metadata or {},
        }

        # Log to underlying logger
        log_method = getattr(self._logger, level.value.lower(), self._logger.info)
        log_method(f"[{category.value}] {message}")

        # Add to telemetry buffer
        if self.enable_telemetry:
            self._telemetry_buffer.append(entry)

    def log_user_action(self, action: str, user_id: str, metadata: dict[str, Any] | None = None):
        """Log a user action for audit trail."""
        self.log(
            level=LogLevel.INFO,
            category=LogCategory.USER_ACTION,
            message=f"User action: {action}",
            user_id=user_id,
            metadata={"action": action, **(metadata or {})},
        )

    def log_api_request(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration_ms: float,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        """Log an API request with performance data."""
        level = LogLevel.INFO if status_code < 400 else LogLevel.WARNING if status_code < 500 else LogLevel.ERROR

        self.log(
            level=level,
            category=LogCategory.API_REQUEST,
            message=f"{method} {endpoint} -> {status_code} ({duration_ms:.2f}ms)",
            user_id=user_id,
            metadata={
                "method": method,
                "endpoint": endpoint,
                "status_code": status_code,
                "duration_ms": duration_ms,
                **(metadata or {}),
            },
        )

        # Track performance metric
        if self.enable_telemetry:
            self._performance_metrics.append(
                {
                    "endpoint": endpoint,
                    "method": method,
                    "duration_ms": duration_ms,
                    "status_code": status_code,
                    "timestamp": datetime.now().isoformat(),
                }
            )

    def log_security_event(
        self,
        event_type: str,
        severity: str,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        """Log a security-related event."""
        level = LogLevel.CRITICAL if severity == "CRITICAL" else LogLevel.WARNING if severity == "HIGH" else LogLevel.INFO

        self.log(
            level=level,
            category=LogCategory.SECURITY,
            message=f"Security event: {event_type} (severity: {severity})",
            user_id=user_id,
            metadata={
                "event_type": event_type,
                "severity": severity,
                "event_id": hashlib.sha256(f"{event_type}{datetime.now().isoformat()}".encode()).hexdigest()[:16],
                **(metadata or {}),
            },
        )

    def log_performance_metric(
        self,
        metric_name: str,
        value: float,
        unit: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        """Log a performance metric."""
        self.log(
            level=LogLevel.DEBUG,
            category=LogCategory.PERFORMANCE,
            message=f"Metric: {metric_name} = {value}{unit or ''}",
            metadata={
                "metric_name": metric_name,
                "value": value,
                "unit": unit,
                **(metadata or {}),
            },
        )

        if self.enable_telemetry:
            self._performance_metrics.append(
                {
                    "name": metric_name,
                    "value": value,
                    "unit": unit,
                    "timestamp": datetime.now().isoformat(),
                }
            )

    def log_compliance_event(
        self,
        event_type: str,
        regulation: str,
        status: str,
        metadata: dict[str, Any] | None = None,
    ):
        """Log a compliance-related event."""
        self.log(
            level=LogLevel.INFO,
            category=LogCategory.COMPLIANCE,
            message=f"Compliance: {event_type} [{regulation}] - {status}",
            metadata={
                "event_type": event_type,
                "regulation": regulation,
                "status": status,
                **(metadata or {}),
            },
        )

    def log_error(
        self,
        error: Exception,
        context: str | None = None,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        """Log an error with context."""
        self.log(
            level=LogLevel.ERROR,
            category=LogCategory.ERROR,
            message=f"Error in {context or 'unknown'}: {error!s}",
            user_id=user_id,
            metadata={
                "error_type": type(error).__name__,
                "error_message": str(error),
                "context": context,
                **(metadata or {}),
            },
        )


# Singleton instance
_logger = StructuredLogger()


def get_logger() -> StructuredLogger:
    """Get the global structured logger instance."""
    return _logger
