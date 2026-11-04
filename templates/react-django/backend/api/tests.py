from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from .models import Profile

User = get_user_model()

STRONG_PASSWORD = "Str0ng-passphrase!"


class HealthEndpointTests(SimpleTestCase):
    """The health endpoint needs no database, so SimpleTestCase is enough."""

    def test_health_returns_ok(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})


class AuthEndpointTests(TestCase):
    """Register / login / refresh / logout plus the role guard."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.refresh_url = "/api/auth/refresh/"
        self.logout_url = "/api/auth/logout/"
        self.me_url = "/api/auth/me/"
        self.admin_only_url = "/api/auth/admin-only/"

    def register(self, email="user@example.com", password=STRONG_PASSWORD):
        return self.client.post(
            self.register_url,
            {"name": "Test User", "email": email, "password": password},
            format="json",
        )

    def login(self, email="user@example.com", password=STRONG_PASSWORD):
        return self.client.post(
            self.login_url, {"email": email, "password": password}, format="json"
        )

    def make_admin(self, email="admin@example.com"):
        user = User.objects.create_user(
            username=email, email=email, first_name="Admin", password=STRONG_PASSWORD
        )
        user.profile.role = Profile.Role.ADMIN
        user.profile.save()
        return user

    # -- register ------------------------------------------------------

    def test_register_creates_user_with_user_role(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email"], "user@example.com")
        self.assertEqual(response.json()["role"], "user")
        user = User.objects.get(email="user@example.com")
        self.assertEqual(user.profile.role, Profile.Role.USER)

    def test_register_duplicate_email_is_400(self):
        self.assertEqual(self.register().status_code, 201)
        response = self.register()
        self.assertEqual(response.status_code, 400)

    def test_register_weak_password_is_400(self):
        response = self.register(password="123")
        self.assertEqual(response.status_code, 400)

    # -- login / refresh / logout --------------------------------------

    def test_login_returns_access_and_refresh(self):
        self.register()
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())
        self.assertIn("refresh", response.json())

    def test_login_wrong_password_is_401(self):
        self.register()
        response = self.login(password="Wrong-passphrase!")
        self.assertEqual(response.status_code, 401)

    def test_login_unknown_email_is_401(self):
        response = self.login(email="nobody@example.com")
        self.assertEqual(response.status_code, 401)

    def test_login_duplicate_email_is_401_not_500(self):
        # createsuperuser bypasses the register endpoint's unique-email
        # check, so two users can share an email. Login must answer
        # 401, never crash with a 500 (MultipleObjectsReturned).
        User.objects.create_user(
            username="first@example.com",
            email="dup@example.com",
            first_name="First",
            password=STRONG_PASSWORD,
        )
        User.objects.create_user(
            username="second@example.com",
            email="dup@example.com",
            first_name="Second",
            password=STRONG_PASSWORD,
        )
        response = self.login(email="dup@example.com")
        self.assertEqual(response.status_code, 401)

    def test_refresh_returns_new_access(self):
        self.register()
        refresh = self.login().json()["refresh"]
        response = self.client.post(
            self.refresh_url, {"refresh": refresh}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

    def test_refresh_invalid_token_is_401(self):
        response = self.client.post(
            self.refresh_url, {"refresh": "not-a-token"}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_logout_blacklists_refresh_token(self):
        self.register()
        tokens = self.login().json()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = self.client.post(
            self.logout_url, {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.client.credentials()  # clear the access token
        response = self.client.post(
            self.refresh_url, {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    # -- me / role guard ------------------------------------------------

    def test_me_requires_auth_and_returns_role(self):
        self.assertEqual(self.client.get(self.me_url).status_code, 401)
        self.register()
        access = self.login().json()["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "user")

    def test_admin_only_endpoint(self):
        # Anonymous -> 401, regular user -> 403, admin -> 200.
        self.assertEqual(self.client.get(self.admin_only_url).status_code, 401)
        self.register()
        access = self.login().json()["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(self.client.get(self.admin_only_url).status_code, 403)
        self.make_admin()
        admin_access = self.login(
            email="admin@example.com", password=STRONG_PASSWORD
        ).json()["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_access}")
        response = self.client.get(self.admin_only_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["detail"], "admin access granted")


class CookieAuthTests(TestCase):
    """The httpOnly refresh-cookie path the SPA frontend uses.

    Login sets the cookie; refresh reads it when no body is given;
    logout reads it, blacklists it and clears it. The JSON ``refresh``
    field keeps working alongside (covered by AuthEndpointTests).
    """

    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.refresh_url = "/api/auth/refresh/"
        self.logout_url = "/api/auth/logout/"

    def register_and_login(self):
        self.client.post(
            self.register_url,
            {
                "name": "Test User",
                "email": "user@example.com",
                "password": STRONG_PASSWORD,
            },
            format="json",
        )
        return self.client.post(
            self.login_url,
            {"email": "user@example.com", "password": STRONG_PASSWORD},
            format="json",
        )

    def test_login_sets_httponly_refresh_cookie(self):
        response = self.register_and_login()
        self.assertEqual(response.status_code, 200)
        cookie = response.cookies["refresh_token"]
        self.assertEqual(cookie.value, response.json()["refresh"])
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["path"], "/api/auth/")
        self.assertEqual(cookie["samesite"], "Lax")

    def test_refresh_with_cookie_only_returns_new_access(self):
        self.register_and_login()
        # No body at all: the cookie the test client stored at login is
        # sent automatically, exactly like the browser does.
        response = self.client.post(self.refresh_url, {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

    def test_logout_with_cookie_only_blacklists_and_clears_cookie(self):
        tokens = self.register_and_login().json()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = self.client.post(self.logout_url, {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.cookies["refresh_token"].value, "")
        # The token is blacklisted: refreshing with it in the body now
        # fails, even though the body path still exists.
        self.client.credentials()
        response = self.client.post(
            self.refresh_url, {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, 401)
