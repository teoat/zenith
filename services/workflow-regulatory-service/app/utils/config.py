"""
Configuration for Workflow + Regulatory Service
"""

import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    VERSION: str = "1.0.0"

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # Celery
    CELERY_BROKER_URL: str = os.getenv("REDIS_URL", "")
    CELERY_RESULT_BACKEND: str = os.getenv("REDIS_URL", "")

    # Timeouts
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "30"))

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
