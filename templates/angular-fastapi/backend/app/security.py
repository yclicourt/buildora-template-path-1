"""Password hashing and JWT helpers.

Password hashing uses pwdlib with argon2: passlib is unmaintained
since 2020, and pwdlib is its maintained successor with argon2 built
in (argon2id, the recommended default).
"""

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from .config import settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, password_hash_value: str) -> bool:
    return password_hash.verify(password, password_hash_value)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: int, name: str, email: str, role: str) -> str:
    """Short-lived access token (15 minutes).

    Carries ``name``, ``email`` and ``role`` claims so clients can
    render the session without an extra round-trip (same contract as
    path 2).
    """
    now = _now()
    payload = {
        "sub": str(user_id),
        "type": "access",
        "name": name,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def create_refresh_token(user_id: int) -> tuple[str, str]:
    """Long-lived refresh token (7 days). Returns (token, jti)."""
    now = _now()
    jti = uuid.uuid4().hex
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "iat": now,
        "exp": now + timedelta(days=settings.refresh_token_days),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256"), jti


def decode_token(token: str) -> dict:
    """Decode and verify a token. Raises jwt.PyJWTError on any failure
    (expired, bad signature, malformed)."""
    return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
