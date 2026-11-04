from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Creates a user. The email doubles as the username.

    Email is stored lowercased and must be unique (case-insensitive).
    The password goes through Django's configured validators, the same
    policy the Django admin enforces.
    """

    name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            first_name=validated_data["name"],
            password=validated_data["password"],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Public shape of a user, including the application role."""

    name = serializers.CharField(source="first_name", read_only=True)
    role = serializers.CharField(source="profile.role", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "role"]


class LoginSerializer(TokenObtainPairSerializer):
    """Login with email + password; returns access + refresh tokens.

    SimpleJWT authenticates by ``username``, and registration stores the
    email as the username, so this serializer resolves the email to the
    user first and then delegates to the standard pair flow. The tokens
    also carry ``name``, ``email`` and ``role`` claims so clients can
    render the session without an extra round-trip.
    """

    # SimpleJWT's username_field stays "username": registration stores the
    # email as the username, and validate() below maps email -> username.
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(max_length=128, write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # TokenObtainPairSerializer declares a ``username`` field; login
        # takes ``email`` instead, so drop it.
        self.fields.pop("username", None)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["name"] = user.first_name
        token["email"] = user.email
        profile = getattr(user, "profile", None)
        token["role"] = profile.role if profile else "user"
        return token

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed(
                "No active account found with the given credentials."
            )
        except User.MultipleObjectsReturned:
            # createsuperuser bypasses the register endpoint's
            # unique-email check, so duplicates are possible in real
            # data. Answer 401, never crash the login with a 500.
            raise AuthenticationFailed(
                "Multiple accounts use this email address; "
                "contact an administrator."
            )
        attrs["username"] = user.username
        return super().validate(attrs)
