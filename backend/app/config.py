"""
Application settings using pydantic-settings.
Loads configuration from environment variables and .env file.
"""

from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment."""

    # Application
    APP_NAME: str = "YuBuBu Education Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/yububu_db"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 2048

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:19006,http://localhost:8081"

    # Rate Limiting
    AI_RATE_LIMIT: str = "20/minute"
    GLOBAL_RATE_LIMIT: str = "100/minute"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/yububu.log"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton settings instance
settings = Settings()
