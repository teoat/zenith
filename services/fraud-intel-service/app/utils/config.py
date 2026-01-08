"""
Configuration for Fraud + Intelligence Service
"""

import os
from typing import List
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

    # Service Limits
    MAX_GRAPH_NODES: int = int(os.getenv("MAX_GRAPH_NODES", "10000"))
    MAX_EVIDENCE_SIZE: int = int(os.getenv("MAX_EVIDENCE_SIZE", "10485760"))  # 10MB

    # Timeouts
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "30"))

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
