"""User, profile (role) and revoked refresh-token models.

The email doubles as the username, exactly like path 2 (Django):
registration stores the email lowercased in both ``username`` and
``email``. ``username`` is unique (the database-level duplicate guard);
``email`` is intentionally NOT unique at the database level — the
register endpoint enforces uniqueness case-insensitively, and the
login endpoint must answer 401 (never 500) when two rows share an
email, because out-of-band creation (for example a manual insert, or
the promote script run against a stale copy) can produce duplicates.
See :func:`app.routers.auth.login` and the duplicate-email test.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # The email, lowercased, at registration time. Unique: the
    # duplicate guard for the register endpoint.
    username: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(254), index=True)
    name: Mapped[str] = mapped_column(String(150), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    profile: Mapped["Profile"] = relationship(
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Profile(Base):
    """Application role for a user.

    This is separate from any framework staff/superuser flag: the API
    role gates API endpoints through :func:`app.deps.require_admin`.

    A profile is created automatically for every new user (see the
    register endpoint), always starting with role ``user``. Promoting
    a user to ``admin`` is an out-of-band operation, for example with
    the promote command (see ``python -m app.promote --help``), which
    looks the user up by USERNAME, never by email.
    """

    ROLE_ADMIN = "admin"
    ROLE_USER = "user"

    __tablename__ = "profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_profiles_user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE")
    )
    role: Mapped[str] = mapped_column(String(10), default=ROLE_USER)

    user: Mapped[User] = relationship("User", back_populates="profile")


class RevokedRefreshToken(Base):
    """Blacklisted refresh-token JTIs (logout).

    A refresh token is valid for 7 days or until its JTI lands here.
    Rows are append-only: logout inserts, refresh checks membership.
    Expired rows are harmless (their tokens are dead anyway) and can
    be pruned by a maintenance job; the reference app does not prune.
    """

    __tablename__ = "revoked_refresh_tokens"

    jti: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
