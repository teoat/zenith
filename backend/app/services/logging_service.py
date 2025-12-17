
import logging
from enum import Enum
from pathlib import Path

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

class StructuredLogger:
    """Mock Structured Logger"""
    def __init__(self):
        self.name = "MockLogger"
        self.log_dir = Path("/tmp/logs")
        self.enable_file_logging = False
        self.enable_console_logging = True
        self.enable_telemetry = True
        self.pii_scrubbing = True
        self.log_rotation = True
        self.compression = False
        self.max_file_size_bytes = 1048576
    
    def get_telemetry_data(self):
        return {"performance_metrics": []}
    
    def reset_telemetry(self):
        pass
    
    def export_telemetry(self, path):
        pass
    
    def log(self, **kwargs):
        pass
    
    def log_user_action(self, action, user_id, metadata=None):
        pass
    
    def log_api_request(self, method, endpoint, status_code, duration_ms, user_id=None, metadata=None):
        pass
    
    def log_security_event(self, event_type, severity, user_id=None, metadata=None):
        pass
    
    def log_performance_metric(self, metric_name, value, unit=None, metadata=None):
        pass

_logger = StructuredLogger()
def get_logger():
    return _logger

class PIIScrubber:
    @staticmethod
    def detect_pii_types(text):
        return []
    
    @staticmethod
    def scrub_pii(text):
        return text
