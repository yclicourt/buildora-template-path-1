"""Promote a user to the admin role, by USERNAME.

Usage (from the backend directory, venv active)::

    python -m app.promote <username>

The lookup is by ``username`` — never by email: two users can share
an email address (an out-of-band insert bypasses the register
endpoint's unique-email check), so email is not a safe identifier.
Registration stores the email lowercased as the username, so in
practice the username is usually the user's email.
"""

import argparse
import sys

from sqlalchemy import select

from .database import SessionLocal, init_db
from .models import Profile, User


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Promote a user to the admin role."
    )
    parser.add_argument("username", help="username of the user to promote")
    args = parser.parse_args(argv)

    init_db()
    db = SessionLocal()
    try:
        user = db.scalar(
            select(User).where(User.username == args.username.strip())
        )
        if user is None:
            print(f"No user with username {args.username!r}.", file=sys.stderr)
            return 1
        profile = user.profile
        if profile is None:
            profile = Profile(user_id=user.id, role=Profile.ROLE_USER)
            db.add(profile)
            db.flush()
        if profile.role == Profile.ROLE_ADMIN:
            print(f"{user.username} is already an admin.")
            return 0
        profile.role = Profile.ROLE_ADMIN
        db.commit()
        print(f"Promoted {user.username} ({user.email}) to admin.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
