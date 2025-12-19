import os
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "378x492 Fraud Detection"
    API_V1_STR: str = "/api/v1"

    # Database - Use SQLite by default for development/testing
    DATABASE_URL: str = "sqlite:///./test_fraud_detection.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    # Provide safe defaults for development/test environments. Override in production via env.
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "CHANGE_THIS_SECRET_KEY_IN_DEVELOPMENT")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "CHANGE_THIS_JWT_SECRET_IN_DEVELOPMENT")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FIELD_ENCRYPTION_KEY: str = os.environ.get(
        "FIELD_ENCRYPTION_KEY", 
        os.environ.get("ENCRYPTION_KEY", "cw_0x689RpI-jtRR7oFt8p98l8UIghx0spL_SXQky-0=")
    )

    # Optional external service configurations
    github_token: Optional[str] = None
    postgres_url: Optional[str] = None
    prometheus_url: Optional[str] = None
    mcp_profile: str = "development"

    # AI Configuration
    AI_MODEL_PATH: str = "models/isolation_forest.pkl"
    AI_TRAINING_INTERVAL_HOURS: int = 24
    AI_MIN_TRAINING_SAMPLES: int = 1000

    # Security - Certificate Pinning
    TRUSTED_PUBLIC_KEY_HASHES: list[str] = [
        "dummy_hash_for_development"
    ]  # Replace with actual hashes in production

    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    DEFAULT_MAX_PROCESS_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: str = "pdf,doc,docx,txt,jpg,jpeg,png,tiff,mp3,wav,mp4,mov"

    # Fraud Score Thresholds
    FRAUD_SCORE_CRITICAL: float = 90.0
    FRAUD_SCORE_HIGH: float = 75.0
    FRAUD_SCORE_MEDIUM: float = 50.0

    # Plugin System
    PLUGIN_CACHE_TTL: int = 3600

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


# Validate required settings
settings = Settings()

# DATABASE_URL validation removed - system uses get_database_url() for SQLite path

# SECRET_KEY now has default value
