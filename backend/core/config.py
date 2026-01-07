import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(dotenv_path=Path(__file__).parent.parent / "config" / ".env.development")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Zenith Fraud Detection"
    API_V1_STR: str = "/api/v1"

    # Database - Use SQLite by default for development/testing
    DATABASE_URL: str = "sqlite:///./test_fraud_detection.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    # Secrets must be provided via environment variables - defaults for testing
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "5HgPxilcgUjkOZTfS8xyBw-VZGEQdsSBTAyjFG48Ok4=")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-for-testing")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FIELD_ENCRYPTION_KEY: str | None = None

    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://localhost:3000",
    ).split(",")

    # Optional external service configurations
    github_token: str | None = None
    postgres_url: str | None = None
    prometheus_url: str | None = None
    mcp_profile: str = "development"

    # AI Configuration
    AI_MODEL_PATH: str = "models/isolation_forest.pkl"
    AI_TRAINING_INTERVAL_HOURS: int = 24
    AI_MIN_TRAINING_SAMPLES: int = 1000

    # Security - Certificate Pinning
    TRUSTED_PUBLIC_KEY_HASHES: list[str] = ["dummy_hash_for_development"]  # Replace with actual hashes in production

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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


# Validate required settings
settings = Settings()


# Manual validation for encryption key to ensure secure startup
def get_encryption_key() -> str:
    """Retrieves the encryption key from environment variables, raising an error if not found."""
    key = os.environ.get("FIELD_ENCRYPTION_KEY") or os.environ.get("ENCRYPTION_KEY") or os.environ.get("SECRET_KEY")
    if not key:
        raise ValueError("Security risk: No encryption key found. Set FIELD_ENCRYPTION_KEY, ENCRYPTION_KEY, or SECRET_KEY.")
    return key


settings.FIELD_ENCRYPTION_KEY = get_encryption_key()


# DATABASE_URL validation removed - system uses get_database_url() for SQLite path

# SECRET_KEY now has default value
