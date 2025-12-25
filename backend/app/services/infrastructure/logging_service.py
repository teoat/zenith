# services/structured_logging.py
import gzip
import hashlib
import json
import logging
import os
import re
import threading
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogCategory(Enum):
    SYSTEM = "system"
    SECURITY = "security"
    PERFORMANCE = "performance"
    USER_ACTION = "user_action"
    FRAUD_DETECTION = "fraud_detection"
    API_REQUEST = "api_request"
    DATABASE = "database"
    ERROR = "error"


@dataclass
class LogEntry:
    """Structured log entry with PII protection"""

    timestamp: str
    level: LogLevel
    category: LogCategory
    message: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Dict[str, Any] = None
    stack_trace: Optional[str] = None
    duration_ms: Optional[float] = None
    error_code: Optional[str] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class PIIScrubber:
    """PII detection and scrubbing utilities"""

    # PII patterns
    EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
    PHONE_PATTERN = re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b")
    SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
    CREDIT_CARD_PATTERN = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b")
    IP_ADDRESS_PATTERN = re.compile(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b")

    # Additional patterns for sensitive data
    BANK_ACCOUNT_PATTERN = re.compile(r"\b\d{8,17}\b")
    PASSPORT_PATTERN = re.compile(r"\b[A-Z]{1,2}\d{7,8}\b")
    DRIVER_LICENSE_PATTERN = re.compile(r"\b[A-Z]{1,2}\d{6,8}\b")

    @staticmethod
    def scrub_pii(text: str, mask_char: str = "***") -> str:
        """Scrub PII from text using patterns"""
        if not text:
            return text

        scrubbed_text = text

        # Apply all PII patterns
        patterns = [
            (PIIScrubber.EMAIL_PATTERN, f"{mask_char}@{mask_char}.com"),
            (PIIScrubber.PHONE_PATTERN, f"{mask_char}-{mask_char}-{mask_char}"),
            (PIIScrubber.SSN_PATTERN, f"{mask_char}-{mask_char}-{mask_char}"),
            (
                PIIScrubber.CREDIT_CARD_PATTERN,
                f"{mask_char}-{mask_char}-{mask_char}-{mask_char}",
            ),
            (
                PIIScrubber.IP_ADDRESS_PATTERN,
                f"{mask_char}.{mask_char}.{mask_char}.{mask_char}",
            ),
            (PIIScrubber.BANK_ACCOUNT_PATTERN, mask_char * 8),
            (PIIScrubber.PASSPORT_PATTERN, f"{mask_char}{mask_char}"),
            (PIIScrubber.DRIVER_LICENSE_PATTERN, f"{mask_char}{mask_char}"),
        ]

        for pattern, replacement in patterns:
            scrubbed_text = pattern.sub(replacement, scrubbed_text)

        return scrubbed_text

    @staticmethod
    def detect_pii_types(text: str) -> List[str]:
        """Detect types of PII present in text"""
        detected_types = []

        if PIIScrubber.EMAIL_PATTERN.search(text):
            detected_types.append("email")
        if PIIScrubber.PHONE_PATTERN.search(text):
            detected_types.append("phone")
        if PIIScrubber.SSN_PATTERN.search(text):
            detected_types.append("ssn")
        if PIIScrubber.CREDIT_CARD_PATTERN.search(text):
            detected_types.append("credit_card")
        if PIIScrubber.IP_ADDRESS_PATTERN.search(text):
            detected_types.append("ip_address")
        if PIIScrubber.BANK_ACCOUNT_PATTERN.search(text):
            detected_types.append("bank_account")
        if PIIScrubber.PASSPORT_PATTERN.search(text):
            detected_types.append("passport")
        if PIIScrubber.DRIVER_LICENSE_PATTERN.search(text):
            detected_types.append("driver_license")

        return detected_types

    @staticmethod
    def hash_pii(text: str) -> str:
        """Hash PII data for privacy while maintaining uniqueness"""
        return hashlib.sha256(text.encode()).hexdigest()[:16]


class StructuredLogger:
    """Enhanced structured logger with PII protection and telemetry"""

    def __init__(
        self,
        name: str,
        log_dir: str = "logs",
        enable_file_logging: bool = True,
        enable_console_logging: bool = True,
        enable_telemetry: bool = True,
        pii_scrubbing: bool = True,
        log_rotation: bool = True,
        max_file_size_mb: int = 100,
        compression: bool = True,
    ):

        self.name = name
        self.log_dir = Path(log_dir)
        self.enable_file_logging = enable_file_logging
        self.enable_console_logging = enable_console_logging
        self.enable_telemetry = enable_telemetry
        self.pii_scrubbing = pii_scrubbing
        self.log_rotation = log_rotation
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
        self.compression = compression

        # Create log directory
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Initialize Python logger
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)

        # Setup handlers
        self._setup_handlers()

        # Telemetry data
        self.telemetry_data = {
            "start_time": datetime.now(timezone.utc).isoformat(),
            "log_counts": {level.value: 0 for level in LogLevel},
            "error_counts": {},
            "performance_metrics": [],
            "user_actions": [],
            "security_events": [],
        }

        # Thread safety
        self._lock = threading.Lock()

        # Session tracking
        self.current_session_id = str(uuid.uuid4())

    def _setup_handlers(self):
        """Setup logging handlers"""
        # Clear existing handlers
        self.logger.handlers.clear()

        # Console handler
        if self.enable_console_logging:
            console_handler = logging.StreamHandler()
            console_formatter = self._create_console_formatter()
            console_handler.setFormatter(console_formatter)
            self.logger.addHandler(console_handler)

        # File handler
        if self.enable_file_logging:
            file_handler = self._create_file_handler()
            file_formatter = self._create_file_formatter()
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)

    def _create_file_handler(self) -> logging.Handler:
        """Create rotating file handler"""
        from logging.handlers import RotatingFileHandler

        log_file = self.log_dir / f"{self.name}.log"

        if self.compression:
            # Use custom handler that compresses old logs
            handler = self._create_compressed_rotating_handler(log_file)
        else:
            handler = RotatingFileHandler(
                filename=log_file,
                maxBytes=self.max_file_size_bytes,
                backupCount=5,
                encoding="utf-8",
            )

        return handler

    def _create_compressed_rotating_handler(self, log_file: Path) -> logging.Handler:
        """Create custom rotating handler with compression"""
        from logging.handlers import BaseRotatingHandler

        class CompressedRotatingHandler(BaseRotatingHandler):
            def __init__(self, filename, maxBytes, backupCount):
                super().__init__(filename, "a", encoding="utf-8")
                self.maxBytes = maxBytes
                self.backupCount = backupCount

            def doRollover(self):
                """Compress old log file on rollover"""
                if self.stream:
                    self.stream.close()
                    self.stream = None

                # Compress existing log
                if self.baseFilename.exists():
                    compressed_file = self.baseFilename.with_suffix(".log.gz")
                    with open(self.baseFilename, "rb") as f_in:
                        with gzip.open(compressed_file, "wb") as f_out:
                            f_out.writelines(f_in)

                    # Remove original
                    self.baseFilename.unlink()

                self.stream = self._open()

            def shouldRollover(self, record):
                """Check if rollover is needed"""
                if self.stream is None:
                    return False
                if self.maxBytes > 0:
                    pos = self.stream.tell()
                    if pos >= self.maxBytes:
                        return True
                return False

        return CompressedRotatingHandler(
            filename=log_file, maxBytes=self.max_file_size_bytes, backupCount=5
        )

    def _create_console_formatter(self) -> logging.Formatter:
        """Create console log formatter"""
        return logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    def _create_file_formatter(self) -> logging.Formatter:
        """Create structured JSON file formatter"""

        class StructuredFormatter(logging.Formatter):
            def format(self, record):
                # Extract structured data from record
                log_data = {
                    "timestamp": datetime.fromtimestamp(
                        record.created, timezone.utc
                    ).isoformat(),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno,
                }

                # Add custom attributes if present
                for attr in [
                    "user_id",
                    "session_id",
                    "request_id",
                    "category",
                    "metadata",
                ]:
                    if hasattr(record, attr):
                        log_data[attr] = getattr(record, attr)

                return json.dumps(log_data, default=str)

        return StructuredFormatter()

    def _scrub_log_entry(self, log_entry: LogEntry) -> LogEntry:
        """Scrub PII from log entry"""
        if not self.pii_scrubbing:
            return log_entry

        # Scrub message
        scrubbed_message = PIIScrubber.scrub_pii(log_entry.message)

        # Scrub metadata fields
        scrubbed_metadata = log_entry.metadata.copy() if log_entry.metadata else {}

        pii_fields_to_scrub = [
            "email",
            "phone",
            "ssn",
            "credit_card",
            "address",
            "name",
        ]
        for field in pii_fields_to_scrub:
            if field in scrubbed_metadata:
                if isinstance(scrubbed_metadata[field], str):
                    scrubbed_metadata[field] = PIIScrubber.scrub_pii(
                        scrubbed_metadata[field]
                    )

        # Scrub user agent and IP
        scrubbed_user_agent = (
            PIIScrubber.scrub_pii(log_entry.user_agent)
            if log_entry.user_agent
            else None
        )
        scrubbed_ip = (
            PIIScrubber.hash_pii(log_entry.ip_address) if log_entry.ip_address else None
        )

        return LogEntry(
            timestamp=log_entry.timestamp,
            level=log_entry.level,
            category=log_entry.category,
            message=scrubbed_message,
            user_id=log_entry.user_id,
            session_id=log_entry.session_id,
            request_id=log_entry.request_id,
            ip_address=scrubbed_ip,
            user_agent=scrubbed_user_agent,
            metadata=scrubbed_metadata,
            stack_trace=log_entry.stack_trace,
            duration_ms=log_entry.duration_ms,
            error_code=log_entry.error_code,
        )

    def log(self, level: LogLevel, category: LogCategory, message: str, **kwargs):
        """Main logging method with structured data"""
        # Create log entry
        log_entry = LogEntry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            level=level,
            category=category,
            message=message,
            user_id=kwargs.get("user_id"),
            session_id=kwargs.get("session_id", self.current_session_id),
            request_id=kwargs.get("request_id"),
            ip_address=kwargs.get("ip_address"),
            user_agent=kwargs.get("user_agent"),
            metadata=kwargs.get("metadata", {}),
            stack_trace=kwargs.get("stack_trace"),
            duration_ms=kwargs.get("duration_ms"),
            error_code=kwargs.get("error_code"),
        )

        # Scrub PII
        if self.pii_scrubbing:
            log_entry = self._scrub_log_entry(log_entry)

        # Update telemetry
        if self.enable_telemetry:
            self._update_telemetry(log_entry)

        # Log to Python logger
        log_level = getattr(logging, level.value)
        extra_data = {
            "category": category.value,
            "user_id": log_entry.user_id,
            "session_id": log_entry.session_id,
            "request_id": log_entry.request_id,
            "metadata": log_entry.metadata,
        }

        self.logger.log(log_level, log_entry.message, extra=extra_data)

    def debug(self, message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
        """Log debug message"""
        self.log(LogLevel.DEBUG, category, message, **kwargs)

    def info(self, message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
        """Log info message"""
        self.log(LogLevel.INFO, category, message, **kwargs)

    def warning(
        self, message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs
    ):
        """Log warning message"""
        self.log(LogLevel.WARNING, category, message, **kwargs)

    def error(self, message: str, category: LogCategory = LogCategory.ERROR, **kwargs):
        """Log error message"""
        self.log(LogLevel.ERROR, category, message, **kwargs)

    def critical(
        self, message: str, category: LogCategory = LogCategory.ERROR, **kwargs
    ):
        """Log critical message"""
        self.log(LogLevel.CRITICAL, category, message, **kwargs)

    def log_user_action(self, action: str, user_id: str, **kwargs):
        """Log user action for telemetry"""
        self.info(
            f"User action: {action}",
            category=LogCategory.USER_ACTION,
            user_id=user_id,
            metadata={
                "action": action,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **kwargs.get("metadata", {}),
            },
        )

    def log_api_request(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration_ms: float,
        user_id: str = None,
        **kwargs,
    ):
        """Log API request for performance monitoring"""
        self.info(
            f"API {method} {endpoint} - {status_code}",
            category=LogCategory.API_REQUEST,
            user_id=user_id,
            duration_ms=duration_ms,
            metadata={
                "method": method,
                "endpoint": endpoint,
                "status_code": status_code,
                "duration_ms": duration_ms,
                **kwargs.get("metadata", {}),
            },
        )

    def log_security_event(
        self, event_type: str, severity: str, user_id: str = None, **kwargs
    ):
        """Log security event"""
        self.warning(
            f"Security event: {event_type}",
            category=LogCategory.SECURITY,
            user_id=user_id,
            metadata={
                "event_type": event_type,
                "severity": severity,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **kwargs.get("metadata", {}),
            },
        )

    def log_performance_metric(
        self, metric_name: str, value: float, unit: str = None, **kwargs
    ):
        """Log performance metric"""
        self.info(
            f"Performance metric: {metric_name} = {value}",
            category=LogCategory.PERFORMANCE,
            metadata={
                "metric_name": metric_name,
                "value": value,
                "unit": unit,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **kwargs.get("metadata", {}),
            },
        )

    def _update_telemetry(self, log_entry: LogEntry):
        """Update telemetry data"""
        with self._lock:
            # Update log counts
            self.telemetry_data["log_counts"][log_entry.level.value] += 1

            # Update error counts
            if log_entry.level in [LogLevel.ERROR, LogLevel.CRITICAL]:
                error_key = log_entry.error_code or "unknown"
                self.telemetry_data["error_counts"][error_key] = (
                    self.telemetry_data["error_counts"].get(error_key, 0) + 1
                )

            # Update performance metrics
            if log_entry.category == LogCategory.PERFORMANCE and log_entry.duration_ms:
                self.telemetry_data["performance_metrics"].append(
                    {
                        "timestamp": log_entry.timestamp,
                        "metric": log_entry.metadata.get(
                            "metric_name", "response_time"
                        ),
                        "value": log_entry.duration_ms,
                        "unit": "ms",
                    }
                )

            # Update user actions
            if log_entry.category == LogCategory.USER_ACTION:
                self.telemetry_data["user_actions"].append(
                    {
                        "timestamp": log_entry.timestamp,
                        "user_id": log_entry.user_id,
                        "action": log_entry.metadata.get("action"),
                        "metadata": log_entry.metadata,
                    }
                )

            # Update security events
            if log_entry.category == LogCategory.SECURITY:
                self.telemetry_data["security_events"].append(
                    {
                        "timestamp": log_entry.timestamp,
                        "event_type": log_entry.metadata.get("event_type"),
                        "severity": log_entry.metadata.get("severity"),
                        "user_id": log_entry.user_id,
                    }
                )

    def get_telemetry_data(self) -> Dict[str, Any]:
        """Get current telemetry data"""
        with self._lock:
            return {
                **self.telemetry_data,
                "current_time": datetime.now(timezone.utc).isoformat(),
                "uptime_hours": (
                    datetime.now(timezone.utc)
                    - datetime.fromisoformat(self.telemetry_data["start_time"])
                ).total_seconds()
                / 3600,
            }

    def reset_telemetry(self):
        """Reset telemetry data"""
        with self._lock:
            self.telemetry_data = {
                "start_time": datetime.now(timezone.utc).isoformat(),
                "log_counts": {level.value: 0 for level in LogLevel},
                "error_counts": {},
                "performance_metrics": [],
                "user_actions": [],
                "security_events": [],
            }

    def export_telemetry(self, file_path: str):
        """Export telemetry data to file"""
        telemetry_data = self.get_telemetry_data()

        with open(file_path, "w") as f:
            json.dump(telemetry_data, f, indent=2, default=str)

    def set_session_id(self, session_id: str):
        """Set current session ID"""
        self.current_session_id = session_id


# Global logger instance
structured_logger = StructuredLogger("fraud_detection_app")


# Convenience functions
def get_logger() -> StructuredLogger:
    """Get the global structured logger"""
    return structured_logger


def log_debug(message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
    """Log debug message"""
    structured_logger.debug(message, category, **kwargs)


def log_info(message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
    """Log info message"""
    structured_logger.info(message, category, **kwargs)


def log_warning(message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
    """Log warning message"""
    structured_logger.warning(message, category, **kwargs)


def log_error(message: str, category: LogCategory = LogCategory.ERROR, **kwargs):
    """Log error message"""
    structured_logger.error(message, category, **kwargs)


def log_critical(message: str, category: LogCategory = LogCategory.ERROR, **kwargs):
    """Log critical message"""
    structured_logger.critical(message, category, **kwargs)


def log_user_action(action: str, user_id: str, **kwargs):
    """Log user action"""
    structured_logger.log_user_action(action, user_id, **kwargs)


def log_api_request(
    method: str,
    endpoint: str,
    status_code: int,
    duration_ms: float,
    user_id: str = None,
    **kwargs,
):
    """Log API request"""
    structured_logger.log_api_request(
        method, endpoint, status_code, duration_ms, user_id, **kwargs
    )


def log_security_event(event_type: str, severity: str, user_id: str = None, **kwargs):
    """Log security event"""
    structured_logger.log_security_event(event_type, severity, user_id, **kwargs)


def log_performance_metric(metric_name: str, value: float, unit: str = None, **kwargs):
    """Log performance metric"""
    structured_logger.log_performance_metric(metric_name, value, unit, **kwargs)
