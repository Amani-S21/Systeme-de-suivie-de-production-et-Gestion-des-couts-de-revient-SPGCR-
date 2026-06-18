from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SPCR API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(alias="DATABASE_URL")
    secret_key: str = Field(alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(720, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    backend_cors_origins: str = Field("http://localhost:5173", alias="BACKEND_CORS_ORIGINS")
    default_admin_email: str = Field(alias="DEFAULT_ADMIN_EMAIL")
    default_admin_login: str = Field("admin", alias="DEFAULT_ADMIN_LOGIN")
    default_admin_password: str = Field(alias="DEFAULT_ADMIN_PASSWORD")
    default_admin_first_name: str = Field("Admin", alias="DEFAULT_ADMIN_FIRST_NAME")
    default_admin_last_name: str = Field("SPCR", alias="DEFAULT_ADMIN_LAST_NAME")

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
