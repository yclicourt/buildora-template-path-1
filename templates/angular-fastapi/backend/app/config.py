"""Environment-driven settings for the reference application.

Every setting that varies by environment is read from the environment.
A ``.env`` file is loaded when present: ``backend/.env`` first, then the
repository-root ``.env`` (used by docker compose) fills any variable not
already set. ``load_dotenv`` never overrides variables already present
in the environment, so ``backend/.env`` wins over the root one.
"""

import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")


def _secret_key() -> str:
    """Return the JWT secret.

    SECURITY WARNING: never ship a real secret key in the repository.
    In development, when SECRET_KEY is unset, an ephemeral key is
    generated at startup. Set SECRET_KEY in production.
    """
    return os.environ.get("SECRET_KEY") or secrets.token_hex(32)


class Settings:
    """Plain settings object (no pydantic-settings: keeps the module
    importable without a settings schema, mirroring path 2)."""

    secret_key: str = _secret_key()
    debug: bool = os.environ.get("DEBUG", "1") == "1"

    postgres_db: str = os.environ.get("POSTGRES_DB", "{{POSTGRES_DB}}")
    postgres_user: str = os.environ.get("POSTGRES_USER", "{{POSTGRES_USER}}")
    postgres_password: str = os.environ.get("POSTGRES_PASSWORD", "")
    db_host: str = os.environ.get("DB_HOST", "localhost")
    db_port: str = os.environ.get("DB_PORT", "5432")
    # Local-test escape hatch only: DATABASE_ENGINE=sqlite runs the
    # test suite without a PostgreSQL server (used for verification in
    # environments without Docker). Production and CI always use
    # PostgreSQL.
    database_engine: str = os.environ.get("DATABASE_ENGINE", "postgres")

    cors_allowed_origins: list[str] = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ALLOWED_ORIGINS", "http://localhost:{{FRONTEND_PORT}}"
        ).split(",")
        if origin.strip()
    ]
    # Required for the httpOnly refresh cookie: the Angular dev server
    # (http://localhost:{{FRONTEND_PORT}}) is a different origin from the API
    # (http://localhost:{{BACKEND_PORT}}), and browsers only send cookies
    # cross-origin when the frontend fetches with credentials AND the
    # API answers with Access-Control-Allow-Credentials. The origin
    # list above stays the allowlist — credentials are never granted
    # to unlisted origins.
    cors_allow_credentials: bool = (
        os.environ.get("CORS_ALLOW_CREDENTIALS", "1") == "1"
    )
    refresh_cookie_secure: bool = (
        os.environ.get("REFRESH_COOKIE_SECURE", "0") == "1"
    )

    access_token_minutes: int = 15
    refresh_token_days: int = 7


settings = Settings()


def database_url() -> str:
    """SQLAlchemy URL for the configured engine."""
    if settings.database_engine == "sqlite":
        return f"sqlite:///{BASE_DIR / 'app.db'}"
    return (
        "postgresql+psycopg://"
        f"{settings.postgres_user}:{settings.postgres_password}"
        f"@{settings.db_host}:{settings.db_port}/{settings.postgres_db}"
    )
