"""
Centralized Constants and Configuration
Eliminates magic numbers and hardcoding throughout the codebase
"""

# ============================================================================
# SYSTEM CONSTANTS
# ============================================================================

# File and Data Limits
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
DEFAULT_MAX_PROCESS_SIZE = 50 * 1024 * 1024  # 50MB
MAX_FILE_NAME_LENGTH = 255
MAX_TEXT_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB for text processing

# Performance Thresholds
DEFAULT_TIMEOUT_SECONDS = 30
API_REQUEST_TIMEOUT = 10
DATABASE_CONNECTION_TIMEOUT = 5
FILE_PROCESSING_TIMEOUT = 60

# Caching Configuration
PLUGIN_CACHE_TTL = 3600  # 1 hour
SESSION_CACHE_TTL = 1800  # 30 minutes
DATA_CACHE_TTL = 300  # 5 minutes
RESULT_CACHE_TTL = 600  # 10 minutes

# ============================================================================
# FRAUD DETECTION CONSTANTS
# ============================================================================

# Risk Scoring (0-100 scale)
RISK_SCORE_LOW = 25
RISK_SCORE_MEDIUM = 50
RISK_SCORE_HIGH = 75
RISK_SCORE_CRITICAL = 90

# Structuring Detection
STRUCTURING_THRESHOLD = 10000  # $10,000 USD
STRUCTURING_WINDOW_HOURS = 24
STRUCTURING_MIN_TRANSACTIONS = 2

# Velocity Analysis
VELOCITY_MAX_TRANSACTIONS = 10
VELOCITY_WINDOW_MINUTES = 60
VELOCITY_RISK_MULTIPLIER = 5

# Geographic Risk
HIGH_RISK_COUNTRIES = [
    "IR",
    "KP",
    "CU",
    "SY",
    "VE",
    "AF",
    "IQ",
    "LY",
    "SD",
    "YE",
    "SO",
    "MM",
]

# ============================================================================
# AI/ML CONSTANTS
# ============================================================================

# Model Confidence Thresholds
MIN_CONFIDENCE_THRESHOLD = 0.5
HIGH_CONFIDENCE_THRESHOLD = 0.8
CRITICAL_CONFIDENCE_THRESHOLD = 0.95

# Processing Limits
MAX_AI_PROCESSING_TIME = 300  # 5 minutes
MAX_BATCH_SIZE = 100
MAX_CONCURRENT_AI_REQUESTS = 5

# Quality Scores
OCR_QUALITY_THRESHOLD = 0.7
FORGERY_DETECTION_THRESHOLD = 0.85
FACE_RECOGNITION_THRESHOLD = 0.8

# ============================================================================
# EVIDENCE PROCESSING CONSTANTS
# ============================================================================

# File Type Categories
SUPPORTED_IMAGE_TYPES = ["jpg", "jpeg", "png", "bmp", "tiff", "webp"]
SUPPORTED_VIDEO_TYPES = ["mp4", "avi", "mov", "mkv", "webm"]
SUPPORTED_DOCUMENT_TYPES = ["pdf", "doc", "docx", "txt", "rtf"]
SUPPORTED_AUDIO_TYPES = ["mp3", "wav", "flac", "aac", "ogg"]

# Processing Quality Thresholds
MIN_IMAGE_RESOLUTION = 100  # pixels
MIN_VIDEO_DURATION = 1  # second
MAX_FILE_SIZE_FOR_OCR = 10 * 1024 * 1024  # 10MB
MAX_TEXT_EXTRACTION_LENGTH = 100000  # characters

# Forensic Analysis
ELA_THRESHOLD = 15  # Error Level Analysis threshold
MANIPULATION_THRESHOLD = 10  # Image manipulation detection
COMPRESSION_ARTIFACT_THRESHOLD = 50
BLUR_DETECTION_THRESHOLD = 100

# ============================================================================
# API AND NETWORKING CONSTANTS
# ============================================================================

# HTTP Status Codes (for reference)
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_BAD_REQUEST = 400
HTTP_UNAUTHORIZED = 401
HTTP_FORBIDDEN = 403
HTTP_NOT_FOUND = 404
HTTP_CONFLICT = 409
HTTP_UNPROCESSABLE_ENTITY = 422
HTTP_TOO_MANY_REQUESTS = 429
HTTP_INTERNAL_SERVER_ERROR = 500
HTTP_SERVICE_UNAVAILABLE = 503

# Rate Limiting
DEFAULT_RATE_LIMIT_REQUESTS = 100
DEFAULT_RATE_LIMIT_WINDOW = 60  # seconds
API_RATE_LIMIT_REQUESTS = 1000
API_RATE_LIMIT_WINDOW = 60

# Pagination
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 1000
MIN_PAGE_SIZE = 10

# ============================================================================
# SECURITY CONSTANTS
# ============================================================================

# Password Requirements
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
PASSWORD_COMPLEXITY_REQUIREMENTS = {
    "uppercase": True,
    "lowercase": True,
    "digits": True,
    "special_chars": True,
}

# JWT Configuration
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 15
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 30
JWT_SECRET_KEY_MIN_LENGTH = 32

# Encryption
AES_KEY_SIZE = 32  # 256-bit
RSA_KEY_SIZE = 2048
HASH_ROUNDS = 100000  # For password hashing

# ============================================================================
# BUSINESS LOGIC CONSTANTS
# ============================================================================

# Case Management
CASE_PRIORITY_LEVELS = ["low", "medium", "high", "critical"]
CASE_STATUS_TRANSITIONS = {
    "draft": ["open"],
    "open": ["in_progress", "closed", "cancelled"],
    "in_progress": ["open", "closed", "cancelled"],
    "closed": ["reopened"],
    "cancelled": ["reopened"],
}

# Alert Management
ALERT_SEVERITY_LEVELS = ["info", "low", "medium", "high", "critical"]
ALERT_AUTO_RESOLVE_HOURS = 24
ALERT_ESCALATION_THRESHOLDS = {
    "high": 5,  # Escalate after 5 high alerts
    "critical": 1,  # Escalate immediately on critical
}

# Compliance
SAR_FILING_DEADLINE_DAYS = 30
CTR_REPORTING_THRESHOLD = 10000  # $10,000 USD
SAR_RISK_THRESHOLDS = {"low": 25, "medium": 50, "high": 75, "critical": 90}

# ============================================================================
# MONITORING AND LOGGING CONSTANTS
# ============================================================================

# Log Levels
LOG_LEVEL_DEBUG = "DEBUG"
LOG_LEVEL_INFO = "INFO"
LOG_LEVEL_WARNING = "WARNING"
LOG_LEVEL_ERROR = "ERROR"
LOG_LEVEL_CRITICAL = "CRITICAL"

# Metrics Collection
METRICS_COLLECTION_INTERVAL = 60  # seconds
METRICS_RETENTION_DAYS = 30
PERFORMANCE_ALERT_THRESHOLD = 2000  # ms for API responses

# Health Checks
HEALTH_CHECK_INTERVAL = 30  # seconds
HEALTH_CHECK_TIMEOUT = 10  # seconds
HEALTH_CHECK_RETRIES = 3

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================


def get_risk_level(score: float) -> str:
    """Convert risk score to risk level"""
    if score >= RISK_SCORE_CRITICAL:
        return "critical"
    elif score >= RISK_SCORE_HIGH:
        return "high"
    elif score >= RISK_SCORE_MEDIUM:
        return "medium"
    else:
        return "low"


def get_priority_level(severity: str) -> str:
    """Convert severity to priority"""
    severity_map = {
        "critical": "high",
        "high": "high",
        "medium": "medium",
        "low": "medium",
        "info": "low",
    }
    return severity_map.get(severity, "medium")


def is_high_risk_country(country_code: str) -> bool:
    """Check if country is in high-risk list"""
    return country_code.upper() in HIGH_RISK_COUNTRIES


def calculate_batch_size(total_items: int, max_batch_size: int = MAX_BATCH_SIZE) -> int:
    """Calculate optimal batch size for processing"""
    return min(max_batch_size, max(1, total_items // 10))


# ============================================================================
# CONFIGURATION OBJECTS
# ============================================================================

# Database Configuration
DATABASE_CONFIG = {
    "pool_size": 10,
    "max_overflow": 20,
    "pool_timeout": DATABASE_CONNECTION_TIMEOUT,
    "pool_recycle": 3600,  # 1 hour
    "echo": False,
}

# Redis Configuration
REDIS_CONFIG = {
    "max_connections": 20,
    "retry_on_timeout": True,
    "socket_timeout": 5,
    "socket_connect_timeout": 5,
    "socket_keepalive": True,
    "socket_keepalive_options": {1: 60},  # TCP_KEEPIDLE: 60 seconds
    "health_check_interval": 30,
}

# AI/ML Configuration
AI_CONFIG = {
    "max_concurrent_requests": MAX_CONCURRENT_AI_REQUESTS,
    "request_timeout": API_REQUEST_TIMEOUT,
    "batch_size": MAX_BATCH_SIZE,
    "cache_ttl": RESULT_CACHE_TTL,
    "retry_attempts": 3,
    "retry_delay": 1.0,
}

# Export all constants
__all__ = [
    "AES_KEY_SIZE",
    "AI_CONFIG",
    "ALERT_AUTO_RESOLVE_HOURS",
    "ALERT_ESCALATION_THRESHOLDS",
    "ALERT_SEVERITY_LEVELS",
    "API_RATE_LIMIT_REQUESTS",
    "API_RATE_LIMIT_WINDOW",
    "API_REQUEST_TIMEOUT",
    "BLUR_DETECTION_THRESHOLD",
    # Business Logic
    "CASE_PRIORITY_LEVELS",
    "CASE_STATUS_TRANSITIONS",
    "COMPRESSION_ARTIFACT_THRESHOLD",
    "CRITICAL_CONFIDENCE_THRESHOLD",
    "CTR_REPORTING_THRESHOLD",
    # Configuration Objects
    "DATABASE_CONFIG",
    "DATABASE_CONNECTION_TIMEOUT",
    "DATA_CACHE_TTL",
    "DEFAULT_MAX_PROCESS_SIZE",
    "DEFAULT_PAGE_SIZE",
    "DEFAULT_RATE_LIMIT_REQUESTS",
    "DEFAULT_RATE_LIMIT_WINDOW",
    "DEFAULT_TIMEOUT_SECONDS",
    "ELA_THRESHOLD",
    "FACE_RECOGNITION_THRESHOLD",
    "FORGERY_DETECTION_THRESHOLD",
    "HASH_ROUNDS",
    "HEALTH_CHECK_INTERVAL",
    "HEALTH_CHECK_RETRIES",
    "HEALTH_CHECK_TIMEOUT",
    "HIGH_CONFIDENCE_THRESHOLD",
    "HIGH_RISK_COUNTRIES",
    "HTTP_BAD_REQUEST",
    "HTTP_CONFLICT",
    "HTTP_CREATED",
    "HTTP_FORBIDDEN",
    "HTTP_INTERNAL_SERVER_ERROR",
    "HTTP_NOT_FOUND",
    # API & Networking
    "HTTP_OK",
    "HTTP_SERVICE_UNAVAILABLE",
    "HTTP_TOO_MANY_REQUESTS",
    "HTTP_UNAUTHORIZED",
    "HTTP_UNPROCESSABLE_ENTITY",
    "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    "JWT_REFRESH_TOKEN_EXPIRE_DAYS",
    "JWT_SECRET_KEY_MIN_LENGTH",
    "LOG_LEVEL_CRITICAL",
    # Monitoring
    "LOG_LEVEL_DEBUG",
    "LOG_LEVEL_ERROR",
    "LOG_LEVEL_INFO",
    "LOG_LEVEL_WARNING",
    "MANIPULATION_THRESHOLD",
    "MAX_AI_PROCESSING_TIME",
    "MAX_BATCH_SIZE",
    "MAX_CONCURRENT_AI_REQUESTS",
    "MAX_FILE_NAME_LENGTH",
    "MAX_FILE_SIZE_FOR_OCR",
    "MAX_PAGE_SIZE",
    "MAX_PASSWORD_LENGTH",
    "MAX_TEXT_EXTRACTION_LENGTH",
    # System Constants
    "MAX_UPLOAD_SIZE",
    "METRICS_COLLECTION_INTERVAL",
    "METRICS_RETENTION_DAYS",
    # AI/ML
    "MIN_CONFIDENCE_THRESHOLD",
    "MIN_IMAGE_RESOLUTION",
    "MIN_PAGE_SIZE",
    # Security
    "MIN_PASSWORD_LENGTH",
    "MIN_VIDEO_DURATION",
    "OCR_QUALITY_THRESHOLD",
    "PASSWORD_COMPLEXITY_REQUIREMENTS",
    "PERFORMANCE_ALERT_THRESHOLD",
    "PLUGIN_CACHE_TTL",
    "REDIS_CONFIG",
    "RESULT_CACHE_TTL",
    "RISK_SCORE_CRITICAL",
    "RISK_SCORE_HIGH",
    # Fraud Detection
    "RISK_SCORE_LOW",
    "RISK_SCORE_MEDIUM",
    "RSA_KEY_SIZE",
    "SAR_FILING_DEADLINE_DAYS",
    "SAR_RISK_THRESHOLDS",
    "SESSION_CACHE_TTL",
    "STRUCTURING_MIN_TRANSACTIONS",
    "STRUCTURING_THRESHOLD",
    "STRUCTURING_WINDOW_HOURS",
    "SUPPORTED_AUDIO_TYPES",
    "SUPPORTED_DOCUMENT_TYPES",
    # Evidence Processing
    "SUPPORTED_IMAGE_TYPES",
    "SUPPORTED_VIDEO_TYPES",
    "VELOCITY_MAX_TRANSACTIONS",
    "VELOCITY_RISK_MULTIPLIER",
    "VELOCITY_WINDOW_MINUTES",
    "calculate_batch_size",
    "get_priority_level",
    # Utility Functions
    "get_risk_level",
    "is_high_risk_country",
]
