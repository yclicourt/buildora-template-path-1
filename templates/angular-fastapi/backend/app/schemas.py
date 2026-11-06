"""Pydantic v2 request/response schemas for the auth API.

Validation errors on these schemas answer 422 (FastAPI default).
Password *strength* is checked in the register endpoint instead and
answers 400, mirroring path 2 (Django validators raise 400 there):
the frontend treats 400 as "fix the form" either way.
"""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)


class TokenPairResponse(BaseModel):
    access: str
    refresh: str


class AccessResponse(BaseModel):
    access: str


class RefreshRequest(BaseModel):
    refresh: str | None = None


class LogoutRequest(BaseModel):
    refresh: str | None = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str


class DetailResponse(BaseModel):
    detail: str


class HealthResponse(BaseModel):
    status: str
