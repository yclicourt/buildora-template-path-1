"""httpOnly refresh-token cookie helpers.

Design (SPA adaptation of the path-1 BFF pattern):

- The access token lives in frontend memory only. The refresh token lives
  in this cookie, which JavaScript can never read.
- Cookie scope is ``/api/auth/``, not just the refresh endpoint: logout
  also needs the refresh token (to blacklist it), and the frontend must
  never hold the token itself to send it in a body. Scoping to the auth
  namespace keeps the cookie off every non-auth endpoint while letting
  both ``/api/auth/refresh/`` and ``/api/auth/logout/`` read it.
- ``SameSite=Lax`` blocks the cookie on cross-site POSTs (the main CSRF
  vector for a cookie that a plain HTML form could otherwise trigger);
  DRF views are ``csrf_exempt`` by design, so no CSRF token is needed
  for the fetch calls the frontend makes.
- ``secure`` is environment-driven (``REFRESH_COOKIE_SECURE=1`` in
  production). Local development serves over plain HTTP, so the default
  is off — a ``secure`` cookie would never be sent over ``http://`` and
  login would silently lose the refresh token.

The JSON ``refresh`` field is still returned by login and still accepted
by refresh/logout: existing clients (and the older tests) keep working.
The frontend ignores the JSON field and uses the cookie path only.
"""

import os

from django.conf import settings

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/auth/"


def _cookie_secure() -> bool:
    return os.environ.get("REFRESH_COOKIE_SECURE", "0") == "1"


def _refresh_max_age() -> int:
    lifetime = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
    return int(lifetime.total_seconds())


def set_refresh_cookie(response, refresh_token: str) -> None:
    """Attach the refresh token as an httpOnly cookie to ``response``."""
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=_refresh_max_age(),
        path=REFRESH_COOKIE_PATH,
        secure=_cookie_secure(),
        httponly=True,
        samesite="Lax",
    )


def clear_refresh_cookie(response) -> None:
    """Expire the refresh cookie (same path it was set with)."""
    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


def refresh_token_from_cookie(request) -> str | None:
    """Read the refresh token from the cookie, if the browser sent it."""
    return request.COOKIES.get(REFRESH_COOKIE_NAME)
