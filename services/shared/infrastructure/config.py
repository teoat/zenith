"""
Shared Configuration Module
Provides centralized configuration management for all microservices
"""

import os
from dataclasses import dataclass, field
from typing import Any

try:
    from pydantic import BaseModel, Field

    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    BaseModel = object


@dataclass
class DatabaseConfig:
    """Database configuration"""

    url: str = ""
    pool_url: str = ""
    pool_min_size: int = 5
    pool_max_size: int = 20
    pool_timeout: int = 30

    @property
    def effective_url(self) -> str:
        """Get effective database URL (prefer pool URL if available)"""
        return self.pool_url or self.url

    def get_url_without_credentials(self) -> str:
        """Get URL without credentials for logging"""
        if "@" in self.url:
            return self.url.split("@")[0] + "@..."
        return self.url


@dataclass
class RedisConfig:
    """Redis configuration"""

    url: str = "redis://localhost:6379/0"
    max_connections: int = 50
    cache_ttl: int = 300
    key_prefix: str = "zenith"

    def get_prefixed_key(self, key: str) -> str:
        """Get key with prefix"""
        return f"{self.key_prefix}:{key}"


@dataclass
class ServiceConfig:
    """Service endpoint configuration"""

    name: str
    url: str
    port: int = 8000
    health_path: str = "/health"
    timeout: float = 30.0
    retry_attempts: int = 3


@dataclass
class LoggingConfig:
    """Logging configuration"""

    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    json_format: bool = True


@dataclass
class MetricsConfig:
    """Metrics configuration"""

    enabled: bool = True
    port: int = 9090
    path: str = "/metrics"
    prefix: str = "zenith"


@dataclass
class TracingConfig:
    """Distributed tracing configuration"""

    enabled: bool = False
    service_name: str = "zenith"
    exporter: str = "console"
    sample_rate: float = 1.0


@dataclass
class SecurityConfig:
    """Security configuration"""

    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    encryption_key: str = ""
    cors_origins: list[str] = field(default_factory=list)
    rate_limit_requests: int = 100
    rate_limit_window: int = 60


class Settings(BaseModel if HAS_PYDANTIC else object):
    """
    Centralized settings for all microservices
    Loads from environment variables with sensible defaults
    """

    # Environment
    ENVIRONMENT: str = Field(
        default="development",
        description="Environment: development, staging, production",
    )
    SERVICE_NAME: str = Field(
        default="zenith-service", description="Name of the service"
    )
    SERVICE_PORT: int = Field(default=8000, description="Port the service listens on")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    # Database
    POSTGRES_URL: str = Field(default="", description="PostgreSQL connection URL")
    POSTGRES_POOL_URL: str = Field(
        default="", description="PostgreSQL connection URL via PGBouncer"
    )
    POSTGRES_POOL_MIN: int = Field(default=5, description="Min pool size")
    POSTGRES_POOL_MAX: int = Field(default=20, description="Max pool size")
    POSTGRES_POOL_TIMEOUT: int = Field(default=30, description="Pool timeout seconds")

    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0", description="Redis connection URL"
    )
    REDIS_MAX_CONN: int = Field(default=50, description="Max Redis connections")
    CACHE_TTL: int = Field(default=300, description="Cache TTL in seconds")
    REDIS_KEY_PREFIX: str = Field(default="zenith", description="Redis key prefix")

    # Service URLs
    AUTH_SERVICE_URL: str = Field(default="", description="Auth service URL")
    CASE_SERVICE_URL: str = Field(default="", description="Case service URL")
    AI_SERVICE_URL: str = Field(default="", description="AI/ML service URL")
    FRAUD_SERVICE_URL: str = Field(
        default="", description="Fraud detection service URL"
    )
    WORKFLOW_SERVICE_URL: str = Field(default="", description="Workflow service URL")

    # Circuit Breaker
    CIRCUIT_FAILURE_THRESHOLD: int = Field(default=5, description="Failure threshold")
    CIRCUIT_RECOVERY_TIMEOUT: float = Field(
        default=60.0, description="Recovery timeout seconds"
    )
    CIRCUIT_SUCCESS_THRESHOLD: int = Field(
        default=3, description="Success threshold in half-open state"
    )

    # Retry
    RETRY_MAX_ATTEMPTS: int = Field(default=3, description="Max retry attempts")
    RETRY_BASE_DELAY: float = Field(default=1.0, description="Base delay for retries")
    RETRY_MAX_DELAY: float = Field(default=60.0, description="Max delay for retries")

    # Security
    JWT_SECRET: str = Field(default="", description="JWT secret key")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    JWT_EXPIRATION_MINUTES: int = Field(default=60, description="JWT expiration")
    ENCRYPTION_KEY: str = Field(default="", description="Encryption key")
    CORS_ORIGINS: list[str] = Field(default_factory=list, description="CORS origins")
    RATE_LIMIT_REQUESTS: int = Field(
        default=100, description="Rate limit requests per window"
    )
    RATE_LIMIT_WINDOW: int = Field(
        default=60, description="Rate limit window in seconds"
    )

    # Metrics & Tracing
    METRICS_ENABLED: bool = Field(default=True, description="Enable metrics")
    METRICS_PORT: int = Field(default=9090, description="Metrics port")
    TRACING_ENABLED: bool = Field(default=False, description="Enable tracing")
    TRACING_SAMPLE_RATE: float = Field(default=1.0, description="Tracing sample rate")

    # GPU (for AI service)
    GPU_ENABLED: bool = Field(default=False, description="Enable GPU")
    MODEL_CACHE_DIR: str = Field(
        default="/app/models", description="Model cache directory"
    )

    class Config:
        env_prefix = "ZENITH_"
        case_insensitive = True


def load_settings() -> Settings:
    """Load settings from environment with defaults"""
    if HAS_PYDANTIC:
        return Settings()
    else:
        settings_dict = {
            "ENVIRONMENT": os.getenv("ENVIRONMENT", "development"),
            "SERVICE_NAME": os.getenv("SERVICE_NAME", "zenith-service"),
            "SERVICE_PORT": int(os.getenv("PORT", "8000")),
            "LOG_LEVEL": os.getenv("LOG_LEVEL", "INFO"),
            "POSTGRES_URL": os.getenv("POSTGRES_URL", ""),
            "POSTGRES_POOL_URL": os.getenv("POSTGRES_POOL_URL", ""),
            "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            "CACHE_TTL": int(os.getenv("CACHE_TTL", "300")),
            "JWT_SECRET": os.getenv("JWT_SECRET", ""),
            "ENCRYPTION_KEY": os.getenv("ENCRYPTION_KEY", ""),
        }
        return Settings(**settings_dict)


# Global settings instance
settings = load_settings()


def get_database_config() -> DatabaseConfig:
    """Get database configuration"""
    return DatabaseConfig(
        url=settings.POSTGRES_URL,
        pool_url=settings.POSTGRES_POOL_URL,
        pool_min_size=settings.POSTGRES_POOL_MIN,
        pool_max_size=settings.POSTGRES_POOL_MAX,
        pool_timeout=settings.POSTGRES_POOL_TIMEOUT,
    )


def get_redis_config() -> RedisConfig:
    """Get Redis configuration"""
    return RedisConfig(
        url=settings.REDIS_URL,
        max_connections=settings.REDIS_MAX_CONN,
        cache_ttl=settings.CACHE_TTL,
        key_prefix=settings.REDIS_KEY_PREFIX,
    )


def get_security_config() -> SecurityConfig:
    """Get security configuration"""
    return SecurityConfig(
        jwt_secret=settings.JWT_SECRET,
        jwt_algorithm=settings.JWT_ALGORITHM,
        jwt_expiration_minutes=settings.JWT_EXPIRATION_MINUTES,
        encryption_key=settings.ENCRYPTION_KEY,
        cors_origins=settings.CORS_ORIGINS,
        rate_limit_requests=settings.RATE_LIMIT_REQUESTS,
        rate_limit_window=settings.RATE_LIMIT_WINDOW,
    )


def get_logging_config() -> LoggingConfig:
    """Get logging configuration"""
    return LoggingConfig(
        level=settings.LOG_LEVEL,
    )


def get_service_config(name: str) -> ServiceConfig | None:
    """Get service configuration by name"""
    url_map = {
        "auth": settings.AUTH_SERVICE_URL,
        "case": settings.CASE_SERVICE_URL,
        "ai": settings.AI_SERVICE_URL,
        "fraud": settings.FRAUD_SERVICE_URL,
        "workflow": settings.WORKFLOW_SERVICE_URL,
    }

    url = url_map.get(name)
    if url:
        return ServiceConfig(
            name=name,
            url=url,
        )
    return None


def is_production() -> bool:
    """Check if running in production"""
    return settings.ENVIRONMENT == "production"


def is_development() -> bool:
    """Check if running in development"""
    return settings.ENVIRONMENT == "development"


def is_gpu_enabled() -> bool:
    """Check if GPU is enabled"""
    return settings.GPU_ENABLED
