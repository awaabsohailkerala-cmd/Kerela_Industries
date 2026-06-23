from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .selectors import get_user_by_email


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def generate_tokens_for_user(user: User) -> dict:
    """
    Generate a JWT refresh + access token pair for the given user.
    Returns a dict ready to merge into any response payload.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ---------------------------------------------------------------------------
# Auth services
# ---------------------------------------------------------------------------

def logout_user(refresh_token: str) -> None:
    """
    Blacklist the supplied refresh token, effectively logging the user out.
    Raises TokenError if the token is invalid or already blacklisted.
    """
    token = RefreshToken(refresh_token)
    token.blacklist()


# ---------------------------------------------------------------------------
# User creation
# ---------------------------------------------------------------------------

def create_user(*, email: str, first_name: str, last_name: str, password: str, role: str) -> User:
    """
    Create a new User.  Only 'user' and 'admin' roles are accepted here;
    superusers are created exclusively via the Django shell (manage.py createsuperuser).

    role='user'  → is_staff=False, is_superuser=False
    role='admin' → is_staff=True,  is_superuser=False
    """
    is_staff = role == "admin"

    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_staff=is_staff,
        is_superuser=False,  # superusers are only created via shell
    )
    return user


# ---------------------------------------------------------------------------
# Profile update
# ---------------------------------------------------------------------------

def update_profile(*, user: User, first_name: str = None, last_name: str = None) -> User:
    """
    Update mutable profile fields (first_name, last_name) for a user.
    Skips None values so partial updates work correctly.
    """
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    user.save(update_fields=["first_name", "last_name"])
    return user


# ---------------------------------------------------------------------------
# Password management
# ---------------------------------------------------------------------------

def change_password(*, user: User, new_password: str) -> None:
    """
    Set a new password for the given user and save.
    Centralises password-change logic to avoid duplication across views.
    """
    user.set_password(new_password)
    user.save(update_fields=["password"])


def superuser_change_password(*, target_email: str, new_password: str) -> None:
    """
    Allow a superuser to change any user's password by email.
    Delegates to change_password to keep logic DRY.
    """
    target_user = get_user_by_email(target_email)
    change_password(user=target_user, new_password=new_password)


# ---------------------------------------------------------------------------
# User deletion
# ---------------------------------------------------------------------------

def delete_user(*, target_email: str, requesting_user: User) -> None:
    """
    Hard-delete a user by email.
    Business rules enforced here (not in the view):
      - A superuser cannot delete themselves.
    """
    if requesting_user.email == target_email:
        raise ValueError("You cannot delete your own account.")
    target = get_user_by_email(target_email)
    target.delete()