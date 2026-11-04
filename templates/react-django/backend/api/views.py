from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .cookies import (
    clear_refresh_cookie,
    refresh_token_from_cookie,
    set_refresh_cookie,
)
from .permissions import IsAdminRole
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class HealthView(APIView):
    """Liveness endpoint. It touches no database and requires no auth."""

    @extend_schema(
        tags=["health"],
        responses=inline_serializer(
            name="HealthResponse",
            fields={"status": serializers.CharField()},
        ),
    )
    def get(self, request):
        return Response({"status": "ok"})


@extend_schema(responses={201: UserSerializer})
class RegisterView(CreateAPIView):
    """Creates a user with role ``user``. Returns the user, not tokens.

    Clients obtain tokens from the login endpoint afterwards.
    """

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@extend_schema(
    responses=inline_serializer(
        name="TokenPairResponse",
        fields={
            "access": serializers.CharField(),
            "refresh": serializers.CharField(),
        },
    ),
)
class LoginView(TokenObtainPairView):
    """Email + password login. Returns ``access`` and ``refresh`` tokens.

    The refresh token is additionally set as an httpOnly cookie (see
    :mod:`api.cookies`): the SPA frontend uses the cookie path and
    ignores the JSON field. The JSON field stays for backwards
    compatibility with non-browser clients.
    """

    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        refresh = response.data.get("refresh") if response.data else None
        if refresh:
            set_refresh_cookie(response, refresh)
        return response


class RefreshView(TokenRefreshView):
    """Refreshes the access token from the cookie when no body is given.

    The JSON ``refresh`` field still works exactly as before; when it is
    absent, the refresh token is read from the httpOnly cookie instead.
    When neither is present the standard validation error applies.
    """

    def post(self, request, *args, **kwargs):
        if not request.data.get("refresh"):
            cookie_token = refresh_token_from_cookie(request)
            if cookie_token:
                data = request.data.copy()
                data["refresh"] = cookie_token
                # DRF's TokenRefreshView reads request.data through the
                # serializer; swapping in the cookie value keeps the
                # standard flow (including blacklist checks) untouched.
                request._full_data = data
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """Blacklists the refresh token, so it can no longer be refreshed.

    Requires a valid access token (proves the session) plus the refresh
    token, taken from the body or, when absent, from the httpOnly
    cookie. The cookie is cleared on the response either way. A missing
    refresh token is 400; an invalid or already-blacklisted one is 400
    as well — logout is idempotent in effect, and the refresh endpoint
    is the one that answers 401.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=inline_serializer(
            name="LogoutRequest",
            fields={"refresh": serializers.CharField(required=False)},
        ),
        responses=inline_serializer(
            name="LogoutResponse",
            fields={"detail": serializers.CharField()},
        ),
    )
    def post(self, request):
        refresh = request.data.get("refresh") or refresh_token_from_cookie(
            request
        )
        if not refresh:
            return Response(
                {"detail": "A refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        response = Response({"detail": "Logged out."})
        clear_refresh_cookie(response)
        return response


class MeView(APIView):
    """The authenticated user's id, name, email and role."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AdminOnlyView(APIView):
    """Example admin-only endpoint demonstrating the role guard."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    @extend_schema(
        responses=inline_serializer(
            name="AdminOnlyResponse",
            fields={"detail": serializers.CharField()},
        ),
    )
    def get(self, request):
        return Response({"detail": "admin access granted"})
