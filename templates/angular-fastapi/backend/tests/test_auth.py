"""Auth endpoint tests: register / login / refresh / logout / me /
admin-only, the httpOnly refresh-cookie path, and the reload-restore
flow (401 -> refresh -> 200) the Angular frontend relies on.

Mirrors path 2's Django test suite case for case, adapted to
FastAPI's TestClient (which keeps a cookie jar, like a browser).
"""

import pytest
from fastapi.testclient import TestClient

from app.database import Base
from app.main import app
from app.models import Profile, User
from app.security import hash_password

STRONG_PASSWORD = "Str0ng-passphrase!"

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
REFRESH_URL = "/api/auth/refresh"
LOGOUT_URL = "/api/auth/logout"
ME_URL = "/api/auth/me"
ADMIN_ONLY_URL = "/api/auth/admin-only"


def register(client, email="user@example.com", password=STRONG_PASSWORD):
    return client.post(
        REGISTER_URL,
        json={"name": "Test User", "email": email, "password": password},
    )


def login(client, email="user@example.com", password=STRONG_PASSWORD):
    return client.post(LOGIN_URL, json={"email": email, "password": password})


def make_admin(db, email="admin@example.com"):
    user = User(
        username=email,
        email=email,
        name="Admin",
        password_hash=hash_password(STRONG_PASSWORD),
    )
    db.add(user)
    db.flush()
    db.add(Profile(user_id=user.id, role=Profile.ROLE_ADMIN))
    db.commit()
    return user


class TestHealth:
    """The health endpoint needs no database."""

    def test_health_returns_ok(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestRegister:
    def test_register_creates_user_with_user_role(self, client, db):
        response = register(client)
        assert response.status_code == 201
        assert response.json()["email"] == "user@example.com"
        assert response.json()["role"] == "user"
        assert "access" not in response.json()
        assert "refresh" not in response.json()
        user = db.query(User).filter_by(email="user@example.com").one()
        assert user.profile.role == Profile.ROLE_USER

    def test_register_duplicate_email_is_400(self, client):
        assert register(client).status_code == 201
        assert register(client).status_code == 400

    def test_register_duplicate_email_case_insensitive_is_400(self, client):
        assert register(client).status_code == 201
        assert register(client, email="USER@EXAMPLE.COM").status_code == 400

    def test_register_weak_password_is_400(self, client):
        assert register(client, password="123").status_code == 400

    def test_register_numeric_password_is_400(self, client):
        assert register(client, password="12345678").status_code == 400


class TestLoginRefreshLogout:
    def test_login_returns_access_and_refresh(self, client):
        register(client)
        response = login(client)
        assert response.status_code == 200
        assert "access" in response.json()
        assert "refresh" in response.json()

    def test_login_wrong_password_is_401(self, client):
        register(client)
        assert login(client, password="Wrong-passphrase!").status_code == 401

    def test_login_unknown_email_is_401(self, client):
        assert login(client, email="nobody@example.com").status_code == 401

    def test_login_duplicate_email_is_401_not_500(self, client, db):
        # An out-of-band insert bypasses the register endpoint's
        # unique-email check, so two users can share an email. Login
        # must answer 401, never crash with a 500.
        for username in ("first@example.com", "second@example.com"):
            db.add(
                User(
                    username=username,
                    email="dup@example.com",
                    name="Dup",
                    password_hash=hash_password(STRONG_PASSWORD),
                )
            )
        db.commit()
        assert login(client, email="dup@example.com").status_code == 401

    def test_refresh_returns_new_access(self, client):
        register(client)
        refresh = login(client).json()["refresh"]
        response = client.post(REFRESH_URL, json={"refresh": refresh})
        assert response.status_code == 200
        assert "access" in response.json()

    def test_refresh_invalid_token_is_401(self, client):
        response = client.post(REFRESH_URL, json={"refresh": "not-a-token"})
        assert response.status_code == 401

    def test_logout_blacklists_refresh_token(self, client):
        register(client)
        tokens = login(client).json()
        response = client.post(
            LOGOUT_URL,
            json={"refresh": tokens["refresh"]},
            headers={"Authorization": f"Bearer {tokens['access']}"},
        )
        assert response.status_code == 200
        response = client.post(
            REFRESH_URL, json={"refresh": tokens["refresh"]}
        )
        assert response.status_code == 401

    def test_logout_without_refresh_is_400(self, client):
        register(client)
        tokens = login(client).json()
        # Clear the cookie so neither body nor cookie carries a token.
        client.cookies.clear()
        response = client.post(
            LOGOUT_URL,
            json={},
            headers={"Authorization": f"Bearer {tokens['access']}"},
        )
        assert response.status_code == 400


class TestMeAndAdminOnly:
    def test_me_requires_auth_and_returns_role(self, client):
        assert client.get(ME_URL).status_code == 401
        register(client)
        access = login(client).json()["access"]
        response = client.get(
            ME_URL, headers={"Authorization": f"Bearer {access}"}
        )
        assert response.status_code == 200
        assert response.json()["role"] == "user"

    def test_admin_only_endpoint(self, client, db):
        # Anonymous -> 401, regular user -> 403, admin -> 200.
        assert client.get(ADMIN_ONLY_URL).status_code == 401
        register(client)
        access = login(client).json()["access"]
        response = client.get(
            ADMIN_ONLY_URL, headers={"Authorization": f"Bearer {access}"}
        )
        assert response.status_code == 403
        make_admin(db)
        admin_access = login(
            client, email="admin@example.com", password=STRONG_PASSWORD
        ).json()["access"]
        response = client.get(
            ADMIN_ONLY_URL,
            headers={"Authorization": f"Bearer {admin_access}"},
        )
        assert response.status_code == 200
        assert response.json()["detail"] == "admin access granted"


class TestCookieAuth:
    """The httpOnly refresh-cookie path the Angular frontend uses.

    Login sets the cookie; refresh reads it when no body is given;
    logout reads it, blacklists it and clears it. The JSON ``refresh``
    field keeps working alongside (covered above).
    """

    def test_login_sets_httponly_refresh_cookie(self, client):
        register(client)
        response = login(client)
        assert response.status_code == 200
        assert response.cookies["refresh_token"] == response.json()["refresh"]
        set_cookie = response.headers["set-cookie"].lower()
        assert "httponly" in set_cookie
        assert "path=/api/auth/" in set_cookie
        assert "samesite=lax" in set_cookie

    def test_refresh_with_cookie_only_returns_new_access(self, client):
        register(client)
        login(client)
        # No body at all: the cookie the test client stored at login
        # is sent automatically, exactly like the browser does.
        response = client.post(REFRESH_URL, json={})
        assert response.status_code == 200
        assert "access" in response.json()

    def test_logout_with_cookie_only_blacklists_and_clears_cookie(self, client):
        register(client)
        tokens = login(client).json()
        response = client.post(
            LOGOUT_URL,
            json={},
            headers={"Authorization": f"Bearer {tokens['access']}"},
        )
        assert response.status_code == 200
        assert response.cookies.get("refresh_token") in (None, "")
        # The token is blacklisted: refreshing with it in the body now
        # fails, even though the body path still exists.
        response = client.post(
            REFRESH_URL, json={"refresh": tokens["refresh"]}
        )
        assert response.status_code == 401


class TestReloadRestore:
    """Page reload: the access token is gone (memory only), but the
    httpOnly cookie survived. /me answers 401, /refresh mints a new
    access token from the cookie, and /me then succeeds."""

    def test_reload_restore_flow(self, client):
        register(client)
        login(client)
        refresh_cookie = client.cookies.get("refresh_token")
        assert refresh_cookie

        # A fresh browser: no Authorization header, only the cookie.
        # (Set it plainly in the jar: httpx does not send a cookie
        # manually stored with domain="testserver", a jar quirk — the
        # app itself reads the cookie fine when it is sent, as the
        # cookie tests above prove.)
        with TestClient(app) as fresh:
            fresh.cookies.set("refresh_token", refresh_cookie)
            assert fresh.get(ME_URL).status_code == 401
            refresh_response = fresh.post(REFRESH_URL, json={})
            assert refresh_response.status_code == 200
            access = refresh_response.json()["access"]
            me_response = fresh.get(
                ME_URL, headers={"Authorization": f"Bearer {access}"}
            )
            assert me_response.status_code == 200
            assert me_response.json()["email"] == "user@example.com"
