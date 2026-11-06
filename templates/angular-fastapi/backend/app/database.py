"""SQLAlchemy 2.0 engine, session factory and declarative base.

PostgreSQL is the default engine; ``DATABASE_ENGINE=sqlite`` is the
local-test escape hatch only (see ``app/config.py``).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import database_url, settings


class Base(DeclarativeBase):
    pass


def _connect_args() -> dict:
    if settings.database_engine == "sqlite":
        # One shared connection per thread for the file database; the
        # test suite uses its own engine, so this only affects dev.
        return {"check_same_thread": False}
    return {}


engine = create_engine(database_url(), connect_args=_connect_args())

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    """FastAPI dependency: one session per request, closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables (dev / test convenience).

    Production uses Alembic migrations; this is only for local runs
    and the test suite, which build the schema from the models.
    """
    # Import here so the models register on Base before create_all.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
