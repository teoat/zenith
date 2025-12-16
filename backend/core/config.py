from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "378x492 Fraud Detection"
    API_V1_STR: str = "/api/v1"

    # Database - Use SQLite by default for development/testing
    DATABASE_URL: str = "sqlite:///./test_fraud_detection.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    # Provide safe defaults for development/test environments. Override in production via env.
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY: str = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FIELD_ENCRYPTION_KEY: str = os.environ.get('FIELD_ENCRYPTION_KEY', 'dev-field-encryption-key')

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
    TRUSTED_PUBLIC_KEY_HASHES: list[str] = ["dummy_hash_for_development"] # Replace with actual hashes in production

    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: str = "pdf,doc,docx,txt,jpg,jpeg,png,tiff"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Validate required settings
settings = Settings()

# DATABASE_URL validation removed - system uses get_database_url() for SQLite path

# SECRET_KEY now has default value

