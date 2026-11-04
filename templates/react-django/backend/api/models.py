from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()


class Profile(models.Model):
    """Application role for a user.

    This is separate from Django's ``is_staff`` / ``is_superuser`` flags,
    which only gate the Django admin site. The API role gates API
    endpoints through :class:`api.permissions.IsAdminRole`.

    A profile is created automatically for every new user (see the signal
    below), always starting with role ``user``. Promoting a user to
    ``admin`` is an out-of-band operation, for example from the shell::

        user = User.objects.get(email="someone@example.com")
        user.profile.role = Profile.Role.ADMIN
        user.profile.save()
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        USER = "user", "User"

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    role = models.CharField(
        max_length=10, choices=Role.choices, default=Role.USER
    )

    def __str__(self):
        return f"{self.user.email} ({self.role})"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
