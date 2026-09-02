from functools import lru_cache
from typing import List, Optional, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fintrack"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    # ── Authentication & JWT ──
    JWT_SECRET_KEY: str = "fintrack-dev-secret-key-change-in-production-32bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── Google OAuth 2.0 ──
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # ── Email / Resend / SMTP ──
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "onboarding@resend.dev"

    # ── Rate Limiting ──
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_FORGOT_PASSWORD: str = "3/minute"
    RATE_LIMIT_RESEND_VERIFICATION: str = "2/minute"

    # ── Cookie Configuration ──
    COOKIE_DOMAIN: Optional[str] = None
    COOKIE_SECURE: bool = False

    # ── Data Migration ──
    MIGRATION_OWNER_EMAIL: str = "owner@fintrack.local"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [v]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
