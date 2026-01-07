"""
Configuration management for API Gateway.
Loads environment variables from Railway and .env files.
"""

import os
from functools import lru_cache
from pydantic import BaseModel


class Settings(BaseModel):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
    CASE_SERVICE_URL: str = os.getenv("CASE_SERVICE_URL", "http://case-service:8002")
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://ai-service:8003")

    POSTGRES_URL: str = os.getenv("POSTGRES_URL", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
