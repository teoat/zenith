import json
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)

        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "ip_address"):
            log_entry["ip_address"] = record.ip_address

        return json.dumps(log_entry, default=str)


def setup_logging(
    level: str = "INFO",
    format_type: str = "json",
    log_file: Optional[str] = None,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
    enable_console: bool = True,
    enable_file: bool = True
) -> logging.Logger:
    """Enhanced logging setup with better configuration options"""

    # Convert string level to numeric
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    # Get or create logger
    logger = logging.getLogger("zenith")
    logger.setLevel(numeric_level)

    # Clear existing handlers
    for h in list(logger.handlers):
        logger.removeHandler(h)

    # Create formatter
    if format_type.lower() == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(lineno)d - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    # Console handler
    if enable_console:
        console = logging.StreamHandler(sys.stdout)
        console.setLevel(numeric_level)
        console.setFormatter(formatter)
        logger.addHandler(console)

    # File handler with rotation
    if enable_file and log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        from logging.handlers import RotatingFileHandler
        fh = RotatingFileHandler(
            log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        fh.setLevel(numeric_level)
        fh.setFormatter(formatter)
        logger.addHandler(fh)

    logger.propagate = False
    return logger


# Environment-based logging configuration
logger = setup_logging(
    level=os.getenv("LOG_LEVEL", "WARNING"),  # Default to WARNING for production
    format_type=os.getenv("LOG_FORMAT", "json"),
    log_file=os.getenv("LOG_FILE", "logs/fraud_detection.log"),
    max_file_size=int(os.getenv("LOG_MAX_SIZE_MB", "10")) * 1024 * 1024,
    backup_count=int(os.getenv("LOG_BACKUP_COUNT", "5")),
    enable_console=os.getenv("LOG_CONSOLE", "true").lower() == "true",
    enable_file=os.getenv("LOG_FILE_ENABLED", "true").lower() == "true"
)


def log_request(
    request_id: str,
    method: str,
    path: str,
    status_code: int,
    duration: float,
    user_id: Optional[str] = None,
):
    """Log HTTP request details (single call to module logger)."""
    extra_fields = {
        "request_id": request_id,
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration * 1000, 2),
    }
    if user_id:
        extra_fields["user_id"] = user_id

    # Prefer calling the attribute on the imported module object so tests
    # that patch `core.logging.logger` are observed reliably.
    try:
        core_mod = sys.modules.get("core.logging")
        if core_mod and hasattr(core_mod, "logger"):
            try:
                core_mod.logger.info("HTTP request", extra=extra_fields)
                return
            except Exception:
                pass
    except Exception:
        pass

    try:
        logger.info("HTTP request", extra=extra_fields)
    except Exception:
        try:
            logging.getLogger("Zenith").info("HTTP request", extra=extra_fields)
        except Exception:
            pass


def log_error(
    error_type: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
):
    """Log application errors."""
    extra_fields = {"error_type": error_type, "details": details or {}}
    if user_id:
        extra_fields["user_id"] = user_id

    try:
        core_mod = sys.modules.get("core.logging")
        if core_mod and hasattr(core_mod, "logger"):
            try:
                core_mod.logger.error(message, extra=extra_fields)
                return
            except Exception:
                pass
    except Exception:
        pass

    try:
        logger.error(message, extra=extra_fields)
    except Exception:
        try:
            logging.getLogger("Zenith").error(message, extra=extra_fields)
        except Exception:
            pass


def log_security_event(
    event_type: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
):
    """Log security-related events."""
    extra_fields = {
        "event_type": event_type,
        "security_event": True,
        "details": details or {},
    }
    if user_id:
        extra_fields["user_id"] = user_id
    if ip_address:
        extra_fields["ip_address"] = ip_address

    try:
        core_mod = sys.modules.get("core.logging")
        if core_mod and hasattr(core_mod, "logger"):
            try:
                core_mod.logger.warning("Security event", extra=extra_fields)
                return
            except Exception:
                pass
    except Exception:
        pass

    try:
        logger.warning("Security event", extra=extra_fields)
    except Exception:
        try:
            logging.getLogger("Zenith").warning("Security event", extra=extra_fields)
        except Exception:
            pass


def log_performance(
    metric_name: str, value: float, tags: Optional[Dict[str, Any]] = None
):
    """Log performance metrics."""
    extra_fields = {
        "metric_name": metric_name,
        "metric_value": value,
        "performance_metric": True,
        "tags": tags or {},
    }
    try:
        core_mod = sys.modules.get("core.logging")
        if core_mod and hasattr(core_mod, "logger"):
            try:
                core_mod.logger.info("Performance metric", extra=extra_fields)
                return
            except Exception:
                pass
    except Exception:
        pass

    try:
        logger.info("Performance metric", extra=extra_fields)
    except Exception:
        try:
            logging.getLogger("Zenith").info("Performance metric", extra=extra_fields)
        except Exception:
            pass


def configure_environment_logging():
    """Configure logging based on environment (development vs production)"""
    env = os.getenv("ENVIRONMENT", "development").lower()

    if env == "development":
        # Development: more verbose, console only, human-readable
        setup_logging(
            level="DEBUG",
            format_type="text",
            enable_console=True,
            enable_file=False
        )
    elif env == "testing":
        # Testing: capture all logs, minimal output, structured
        setup_logging(
            level="DEBUG",
            format_type="json",
            log_file="logs/test.log",
            enable_console=False,
            enable_file=True
        )
    elif env == "staging":
        # Staging: balanced logging, both console and file
        setup_logging(
            level="INFO",
            format_type="json",
            log_file="logs/staging.log",
            enable_console=True,
            enable_file=True
        )
    else:  # production
        # Production: minimal, structured logging, file only
        setup_logging(
            level="WARNING",
            format_type="json",
            log_file="logs/production.log",
            enable_console=False,
            enable_file=True
        )


# Initialize with environment-based configuration
configure_environment_logging()
