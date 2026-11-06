"""Auth endpoints: register, login, refresh, logout, me, admin-only.

Contract mirrors path 2 (Django) endpoint for endpoint, including
the status codes: register returns the user, not tokens; login
returns ``access`` and ``refresh`` and also sets the refresh token as
an httpOnly cookie; refresh and logout read the token from the body
or, when absent, from the cookie.
"""

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..cookies import (
    clear_refresh_cookie,
    refresh_token_from_cookie,
    set_refresh_cookie,
)
from ..database import get_db
from ..deps import get_current_user, require_admin
from ..models import Profile, RevokedRefreshToken, User
from ..schemas import (
    AccessResponse,
    DetailResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
    UserOut,
)
from ..security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

MIN_PASSWORD_LENGTH = 8


def _password_strength_error(password: str) -> str | None:
    """Django-style strength policy (path 2 uses Django's validators):
    at least 8 characters and not entirely numeric. Returns the error
    message or None when the password is acceptable."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return "Password must be at least 8 characters long."
    if password.isdigit():
        return "Password cannot be entirely numeric."
    return None


def _user_out(user: User) -> UserOut:
    role = user.profile.role if user.profile else Profile.ROLE_USER
    return UserOut(id=user.id, name=user.name, email=user.email, role=role)


def _access_token_for(user: User) -> str:
    role = user.profile.role if user.profile else Profile.ROLE_USER
    return create_access_token(user.id, user.name, user.email, role)


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user with role user. Returns the user, not tokens.",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Clients obtain tokens from the login endpoint afterwards."""
    email = payload.email.strip().lower()
    strength_error = _password_strength_error(payload.password)
    if strength_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=strength_error
        )
    existing = (
        db.query(User).filter(func.lower(User.email) == email).first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    user = User(
        username=email,
        email=email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        # Race with a concurrent register for the same email: the
        # username unique constraint is the backstop.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    db.add(Profile(user_id=user.id, role=Profile.ROLE_USER))
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.post(
    "/login",
    response_model=TokenPairResponse,
    summary="Email + password login. Returns access and refresh tokens.",
)
def login(
    payload: LoginRequest, response: Response, db: Session = Depends(get_db)
):
    """The refresh token is additionally set as an httpOnly cookie (see
    :mod:`app.cookies`): the Angular frontend uses the cookie path and
    ignores the JSON field. The JSON field stays for backwards
    compatibility with non-browser clients."""
    email = payload.email.strip().lower()
    users = db.query(User).filter(func.lower(User.email) == email).all()
    if len(users) != 1:
        # Unknown email, or several accounts sharing one email (an
        # out-of-band insert bypasses the register endpoint's
        # unique-email check): answer 401, never crash with a 500.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active account found with the given credentials.",
        )
    user = users[0]
    if not user.is_active or not verify_password(
        payload.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active account found with the given credentials.",
        )
    access = _access_token_for(user)
    refresh, _jti = create_refresh_token(user.id)
    set_refresh_cookie(response, refresh)
    return TokenPairResponse(access=access, refresh=refresh)


@router.post(
    "/refresh",
    response_model=AccessResponse,
    summary="Refresh the access token from the cookie when no body is given.",
)
def refresh(
    payload: RefreshRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """The JSON ``refresh`` field still works exactly as before; when
    it is absent, the refresh token is read from the httpOnly cookie
    instead. An invalid, expired or blacklisted refresh token is 401."""
    token = payload.refresh or refresh_token_from_cookie(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A refresh token is required.",
        )
    try:
        claims = decode_token(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )
    if claims.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )
    jti = claims.get("jti")
    if not jti or db.get(RevokedRefreshToken, jti) is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )
    try:
        user_id = int(claims.get("sub", ""))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )
    return AccessResponse(access=_access_token_for(user))


@router.post(
    "/logout",
    response_model=DetailResponse,
    summary="Blacklist the refresh token, so it can no longer be refreshed.",
)
def logout(
    payload: LogoutRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Requires a valid access token (proves the session) plus the
    refresh token, taken from the body or, when absent, from the
    httpOnly cookie. The cookie is cleared on the response either way.
    A missing refresh token is 400; an invalid or already-blacklisted
    one is 400 as well — logout is idempotent in effect, and the
    refresh endpoint is the one that answers 401."""
    token = payload.refresh or refresh_token_from_cookie(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A refresh token is required.",
        )
    try:
        claims = decode_token(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is invalid or expired.",
        )
    if claims.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is invalid or expired.",
        )
    jti = claims.get("jti")
    if not jti:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is invalid or expired.",
        )
    if db.get(RevokedRefreshToken, jti) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is invalid or expired.",
        )
    try:
        user_id = int(claims.get("sub", ""))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is invalid or expired.",
        )
    from datetime import datetime, timezone

    db.add(
        RevokedRefreshToken(
            jti=jti,
            user_id=user_id,
            expires_at=datetime.fromtimestamp(claims["exp"], tz=timezone.utc),
        )
    )
    db.commit()
    clear_refresh_cookie(response)
    return DetailResponse(detail="Logged out.")


@router.get(
    "/me",
    response_model=UserOut,
    summary="The authenticated user's id, name, email and role.",
)
def me(current_user: User = Depends(get_current_user)):
    return _user_out(current_user)


@router.get(
    "/admin-only",
    response_model=DetailResponse,
    summary="Example admin-only endpoint demonstrating the role guard.",
)
def admin_only(_admin: User = Depends(require_admin)):
    return DetailResponse(detail="admin access granted")
