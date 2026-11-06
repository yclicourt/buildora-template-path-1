"""Request dependencies: database session, current user, admin role."""

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import Profile, User
from .security import decode_token


def _unauthorized(detail: str = "Not authenticated.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> User:
    """Load the user from the Bearer access token.

    Anonymous requests are 401; so are expired, malformed, wrong-type
    or orphaned tokens (user deleted or deactivated after issue).
    """
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _unauthorized()
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise _unauthorized()
    if payload.get("type") != "access":
        raise _unauthorized()
    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError):
        raise _unauthorized()
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _unauthorized()
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Grants access only to authenticated users whose profile role is
    admin. Unauthenticated requests are denied by ``get_current_user``
    (401) before this runs; authenticated non-admin users get 403."""
    profile = current_user.profile
    if profile is None or profile.role != Profile.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires the admin role.",
        )
    return current_user
