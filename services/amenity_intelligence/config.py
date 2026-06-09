import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class AmenitySettings(BaseSettings):
    PROJECT_NAME: str = "Coimbatore Amenity Intelligence Service"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8002

    # PostgreSQL Database Configuration
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_secure_password_coimbatore"
    POSTGRES_DB: str = "realstate_db"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None

    # Redis Configuration
    REDIS_URL: str = "redis://redis:6379/0"

    # Coimbatore geospatial boundaries for validation
    COIMBATORE_MIN_LAT: float = 10.90
    COIMBATORE_MAX_LAT: float = 11.15
    COIMBATORE_MIN_LON: float = 76.80
    COIMBATORE_MAX_LON: float = 77.15

    @property
    def postgres_async_url(self) -> str:
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = AmenitySettings()
