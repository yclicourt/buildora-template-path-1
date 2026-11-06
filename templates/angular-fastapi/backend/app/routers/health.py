"""Liveness endpoint. It touches no database and requires no auth."""

from fastapi import APIRouter

from ..schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")
