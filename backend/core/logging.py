# core/logging.py
import logging
import json
import sys
from datetime import datetime, timezone
from typing import Dict, Any
import os


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


def setup_logging(level: str = "INFO", format_type: str = "json", log_file: Optional[str] = None) -> logging.Logger:
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logger = logging.getLogger("378x492")
    logger.setLevel(numeric_level)

    for h in list(logger.handlers):
        logger.removeHandler(h)

    if format_type == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    console = logging.StreamHandler(sys.stdout)
    console.setLevel(numeric_level)
    console.setFormatter(formatter)
    logger.addHandler(console)

    if log_file:
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        fh = logging.FileHandler(log_file)
        fh.setLevel(numeric_level)
        fh.setFormatter(formatter)
        logger.addHandler(fh)

    logger.propagate = False
    return logger


logger = setup_logging(level=os.getenv("LOG_LEVEL", "INFO"), format_type=os.getenv("LOG_FORMAT", "json"), log_file=os.getenv("LOG_FILE"))


def log_request(request_id: str, method: str, path: str, status_code: int, duration: float, user_id: str | None = None):
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
        core_mod = sys.modules.get('core.logging')
        if core_mod and hasattr(core_mod, 'logger'):
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
            logging.getLogger("378x492").info("HTTP request", extra=extra_fields)
        except Exception:
            pass


def log_error(error_type: str, message: str, details: Dict[str, Any] | None = None, user_id: str | None = None):
    """Log application errors."""
    extra_fields = {"error_type": error_type, "details": details or {}}
    if user_id:
        extra_fields["user_id"] = user_id

    try:
        core_mod = sys.modules.get('core.logging')
        if core_mod and hasattr(core_mod, 'logger'):
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
            logging.getLogger("378x492").error(message, extra=extra_fields)
        except Exception:
            pass


def log_security_event(event_type: str, user_id: str | None = None, ip_address: str | None = None, details: Dict[str, Any] | None = None):
    """Log security-related events."""
    extra_fields = {"event_type": event_type, "security_event": True, "details": details or {}}
    if user_id:
        extra_fields["user_id"] = user_id
    if ip_address:
        extra_fields["ip_address"] = ip_address

    try:
        core_mod = sys.modules.get('core.logging')
        if core_mod and hasattr(core_mod, 'logger'):
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
            logging.getLogger("378x492").warning("Security event", extra=extra_fields)
        except Exception:
            pass


def log_performance(metric_name: str, value: float, tags: Dict[str, Any] | None = None):
    """Log performance metrics."""
    extra_fields = {"metric_name": metric_name, "metric_value": value, "performance_metric": True, "tags": tags or {}}
    try:
        core_mod = sys.modules.get('core.logging')
        if core_mod and hasattr(core_mod, 'logger'):
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
            logging.getLogger("378x492").info("Performance metric", extra=extra_fields)
        except Exception:
            pass
