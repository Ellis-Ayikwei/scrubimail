from apps.User.models import User
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import IntegrityError
from django.db.models import Q
import logging
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    # first_name = serializers.CharField(required=True)
    # last_name = serializers.CharField(required=True)
    # phone_number = serializers.CharField(required=False, allow_blank=True)
    # user_type = serializers.ChoiceField(
    #     choices=User.USER_TYPE_CHOICES,
    #     default='customer'
    # )

    class Meta:
        model = User
        fields = ("email", "password", "password2")

    def validate(self, attrs):
        # Check if passwords match
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )

        # Check if user with email already exists
        email = attrs.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "User with this email already exists."}
            )

        # Check if user with phone number already exists (if provided)
        phone_number = attrs.get("phone_number")
        if phone_number and User.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError(
                {"phone_number": "User with this phone number already exists."}
            )

        return attrs

    def create(self, validated_data):
        try:
            # Remove confirmation field
            validated_data.pop("password2", None)

            # Create user with all provided fields
            user = User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
                # first_name=validated_data.get('first_name', ''),
                # last_name=validated_data.get('last_name', ''),
                # phone_number=validated_data.get('phone_number', ''),
                # user_type=validated_data.get('user_type', 'customer')
            )

            # Additional setup steps can be added here
            # For example, creating default profiles, settings, etc.

            return user
        except IntegrityError as e:
            # Handle case where a race condition might occur
            # (e.g., two users registering with the same email simultaneously)
            if "unique constraint" in str(e).lower() and "email" in str(e).lower():
                raise serializers.ValidationError(
                    {"email": "User with this email already exists."}
                )
            elif (
                "unique constraint" in str(e).lower()
                and "phone_number" in str(e).lower()
            ):
                raise serializers.ValidationError(
                    {"phone_number": "User with this phone number already exists."}
                )
            raise serializers.ValidationError(
                {"detail": "Registration failed due to database constraint."}
            )
        except Exception as e:
            # Log the exception for debugging
            logger.exception("Error creating user")

            # Return a generic error message to the user
            raise serializers.ValidationError(
                {"detail": "Registration failed. Please try again later."}
            )


# accounts/serializers.py (add these)
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        style={"input_type": "password"}, trim_whitespace=False
    )
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    def validate(self, data):
        user = authenticate(email=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        refresh = RefreshToken.for_user(user)
        return {
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class PasswordRecoverySerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    token = serializers.CharField(write_only=True, required=True)
    uidb64 = serializers.CharField(write_only=True, required=True)


class PasswordChangeSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, validators=[validate_password])


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone_number",
            "profile_picture",
            "account_status",
            "user_type",
            "stripe_customer_id",
            "notification_preferences",
            "last_active",
            "device_tokens",
        )
