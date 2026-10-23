"""
LearnLens AI – Backend Configuration
Reads settings from environment variables / .env file.
API keys are never logged.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Gemini / Gemma ────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemma_model: str = "gemma-4-26b-a4b-it"

    # ── Server ────────────────────────────────────────────────────────────────
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"

    # ── App ───────────────────────────────────────────────────────────────────
    app_name: str = "LearnLens AI"
    app_version: str = "0.1.0"
    debug: bool = False

    def safe_repr(self) -> dict:
        """Return settings dict with the API key masked – safe to log."""
        d = self.model_dump()
        if d.get("gemini_api_key"):
            d["gemini_api_key"] = "***REDACTED***"
        return d


@lru_cache
def get_settings() -> Settings:
    return Settings()
