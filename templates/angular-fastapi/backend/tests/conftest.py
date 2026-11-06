"""Test fixtures: an isolated database per test session.

The application code is unchanged: ``DATABASE_ENGINE=sqlite`` is the
same escape hatch the backend documents for local verification. The
tests build the schema from the models (``create_all``), not from
Alembic migrations — migrations are verified separately by running
``alembic upgrade head`` against PostgreSQL.

Set ``DATABASE_ENGINE=postgres`` (with the usual POSTGRES_* variables
pointing at a throwaway database) to run the same suite against real
PostgreSQL; the default is SQLite.
"""

import os
import sys
from pathlib import Path

# Fixed secret for tests, set before the app is imported. The engine
# defaults to SQLite; an outer DATABASE_ENGINE=postgres is respected.
os.environ["SECRET_KEY"] = "test-secret-key-do-not-use-in-production"
os.environ.setdefault("DATABASE_ENGINE", "sqlite")

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import database_url, settings
from app.database import Base, get_db
from app.main import app


@pytest.fixture(scope="session")
def engine(tmp_path_factory):
    """One database for the whole session.

    SQLite: a temp file (in-memory would need a StaticPool; a file
    keeps the default pooling honest). PostgreSQL: the database from
    the environment, dropped and recreated from the models.
    """
    if settings.database_engine == "postgres":
        engine = create_engine(database_url())
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        return engine
    db_file = tmp_path_factory.mktemp("data") / "test.db"
    engine = create_engine(
        f"sqlite:///{db_file}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture()
def db(engine):
    """A fresh session per test, with tables truncated first so tests
    never see each other's rows."""
    connection = engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection)
    session = session_factory()
    for table in reversed(Base.metadata.sorted_tables):
        connection.execute(table.delete())
    transaction.commit()
    try:
        yield session
    finally:
        session.close()
        connection.close()


@pytest.fixture()
def client(db):
    """TestClient with the ``get_db`` dependency overridden to the
    test session. The client keeps a cookie jar, like a browser:
    cookies set by login are sent automatically on later calls."""

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
