"""FastAPI application: Angular + FastAPI backend.

Auth endpoints live under ``/api/auth/`` (register, login, refresh,
logout, me, admin-only); the health endpoint at ``/api/health``.
OpenAPI docs are served by FastAPI itself at ``/api/docs`` (Swagger
UI), ``/api/redoc`` (ReDoc) and ``/api/schema`` (OpenAPI JSON).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import auth, health

app = FastAPI(
    title="{{PROJECT_TITLE}} API",
    description=(
        "API: Angular + FastAPI, con JWT y cookie "
        "httpOnly. Access 15 minutos, refresh 7 días."
    ),
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/schema",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
