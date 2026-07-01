from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    app_name: str = "SPGCR API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(alias="DATABASE_URL")
    secret_key: str = Field(alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(720, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    backend_cors_origins: str = Field("http://localhost:5173", alias="BACKEND_CORS_ORIGINS")
    default_admin_email: str = Field(alias="DEFAULT_ADMIN_EMAIL")
    default_admin_login: str = Field("admin", alias="DEFAULT_ADMIN_LOGIN")
    default_admin_password: str = Field(alias="DEFAULT_ADMIN_PASSWORD")
    default_admin_first_name: str = Field("Admin", alias="DEFAULT_ADMIN_FIRST_NAME")
    default_admin_last_name: str = Field("SPGCR", alias="DEFAULT_ADMIN_LAST_NAME")

    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", BACKEND_DIR / ".env"),
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
