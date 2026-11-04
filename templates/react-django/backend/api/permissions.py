from rest_framework.permissions import BasePermission

from .models import Profile


class IsAdminRole(BasePermission):
    """Grants access only to authenticated users whose profile role is admin.

    Unauthenticated requests are denied by the authentication step before
    this permission runs; authenticated non-admin users get 403.
    """

    message = "This endpoint requires the admin role."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        profile = getattr(user, "profile", None)
        return profile is not None and profile.role == Profile.Role.ADMIN
