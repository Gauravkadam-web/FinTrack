import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.core.security import (
    create_access_token,
    create_email_token,
    decode_email_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.category import Category
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)
settings = get_settings()

STARTER_CATEGORIES = [
    {"name": "Uncategorized", "is_system": True},
    {"name": "Food", "is_system": False},
    {"name": "Transport", "is_system": False},
    {"name": "Rent", "is_system": False},
    {"name": "Utilities", "is_system": False},
    {"name": "Entertainment", "is_system": False},
    {"name": "Shopping", "is_system": False},
    {"name": "Healthcare", "is_system": False},
    {"name": "Other", "is_system": False},
]


class AuthService:
    def __init__(
        self,
        user_repo: Optional[UserRepository] = None,
        refresh_token_repo: Optional[RefreshTokenRepository] = None,
        email_service: Optional[EmailService] = None,
    ):
        self.user_repo = user_repo or UserRepository()
        self.refresh_token_repo = refresh_token_repo or RefreshTokenRepository()
        self.email_service = email_service or EmailService()

    def _user_to_response(self, user: User) -> UserResponse:
        auth_provider = "google" if (user.google_id and not user.password_hash) else "local"
        return UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            email_verified=user.email_verified,
            auth_provider=auth_provider,
            created_at=user.created_at,
        )

    async def _seed_starter_categories(self, session: AsyncSession, user_id: uuid.UUID) -> None:
        """Seed Uncategorized and the 8 starter categories for a new user."""
        for item in STARTER_CATEGORIES:
            stmt = select(Category).where(
                Category.user_id == user_id,
                Category.name == item["name"],
            )
            existing = await session.execute(stmt)
            if not existing.scalar_one_or_none():
                cat = Category(
                    user_id=user_id,
                    name=item["name"],
                    is_system=item["is_system"],
                )
                session.add(cat)
        await session.flush()

    async def _issue_token_pair(
        self,
        session: AsyncSession,
        user: User,
        device_info: Optional[str] = None,
    ) -> Tuple[TokenResponse, str]:
        """Issue an access token and a hashed refresh token pair."""
        access_token = create_access_token(user.id)
        raw_refresh_token = generate_refresh_token()
        token_hash_val = hash_token(raw_refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        refresh_token_model = RefreshToken(
            user_id=user.id,
            token_hash=token_hash_val,
            device_info=device_info,
            expires_at=expires_at,
        )
        await self.refresh_token_repo.create(session, refresh_token_model)

        token_response = TokenResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=self._user_to_response(user),
        )
        return token_response, raw_refresh_token

    async def register(
        self,
        session: AsyncSession,
        data: RegisterRequest,
        device_info: Optional[str] = None,
    ) -> Tuple[TokenResponse, str]:
        """Register a new user, seed categories, send verification email, and issue tokens."""
        existing = await self.user_repo.get_by_email(session, data.email)
        if existing:
            raise ConflictException(message="An account with this email already exists", field="email")

        hashed_pw = hash_password(data.password)
        user = User(
            email=data.email,
            password_hash=hashed_pw,
            display_name=data.display_name,
            email_verified=False,
            is_active=True,
        )
        created_user = await self.user_repo.create(session, user)

        # Seed categories for new user
        await self._seed_starter_categories(session, created_user.id)

        # Send verification email asynchronously
        verify_token = create_email_token(created_user.id, purpose="email_verify")
        await self.email_service.send_verification_email(
            to_email=created_user.email,
            token=verify_token,
            display_name=created_user.display_name,
        )

        token_response, raw_refresh = await self._issue_token_pair(session, created_user, device_info)
        await session.commit()
        return token_response, raw_refresh

    async def login(
        self,
        session: AsyncSession,
        data: LoginRequest,
        device_info: Optional[str] = None,
    ) -> Tuple[TokenResponse, str]:
        """Authenticate user with email and password."""
        user = await self.user_repo.get_by_email(session, data.email)
        if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Your account has been deactivated")

        token_response, raw_refresh = await self._issue_token_pair(session, user, device_info)
        await session.commit()
        return token_response, raw_refresh

    async def google_auth(
        self,
        session: AsyncSession,
        data: GoogleAuthRequest,
        device_info: Optional[str] = None,
    ) -> Tuple[TokenResponse, str]:
        """Validate Google ID token, find or create account with linking, and issue tokens."""
        try:
            req = google_requests.Request()
            # If client ID is configured, pass audience check; otherwise verify payload
            audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
            id_info = google_id_token.verify_oauth2_token(data.id_token, req, audience=audience)
        except Exception as e:
            logger.warning(f"Google token verification failed: {e}")
            raise UnauthorizedException(f"Invalid Google ID token: {str(e)}")

        google_id = id_info.get("sub")
        email = id_info.get("email")
        name = id_info.get("name") or (email.split("@")[0] if email else "Google User")
        email_verified = id_info.get("email_verified", True)

        if not email or not google_id:
            raise UnauthorizedException("Google token missing email or subject claim")

        # 1. Look up by google_id
        user = await self.user_repo.get_by_google_id(session, google_id)

        # 2. If not found by google_id, check email for safe linking
        if not user:
            user = await self.user_repo.get_by_email(session, email)
            if user:
                # Link account
                user.google_id = google_id
                if email_verified:
                    user.email_verified = True
                await self.user_repo.update(session, user)
            else:
                # Create brand new user
                user = User(
                    email=email,
                    display_name=name,
                    google_id=google_id,
                    password_hash=None,
                    email_verified=email_verified,
                    is_active=True,
                )
                user = await self.user_repo.create(session, user)
                await self._seed_starter_categories(session, user.id)

        if not user.is_active:
            raise UnauthorizedException("Your account has been deactivated")

        token_response, raw_refresh = await self._issue_token_pair(session, user, device_info)
        await session.commit()
        return token_response, raw_refresh

    async def refresh_tokens(
        self,
        session: AsyncSession,
        raw_refresh_token: str,
        device_info: Optional[str] = None,
    ) -> Tuple[TokenResponse, str]:
        """Rotate refresh token: validate, revoke old, issue new pair. Detect token reuse."""
        if not raw_refresh_token:
            raise UnauthorizedException("Refresh token missing")

        token_hash_val = hash_token(raw_refresh_token)
        record = await self.refresh_token_repo.get_by_token_hash(session, token_hash_val)

        if not record:
            raise UnauthorizedException("Invalid refresh token")

        # Reuse detection: Token has already been revoked!
        if record.revoked_at is not None:
            logger.warning(f"Security Alert: Reused refresh token detected for user {record.user_id}!")
            # Revoke all sessions for this user as a security measure
            await self.refresh_token_repo.revoke_all_for_user(session, record.user_id)
            await session.commit()
            raise UnauthorizedException("Session invalidated due to suspicious activity. Please log in again.")

        # Check expiration
        now = datetime.now(timezone.utc)
        if record.expires_at < now:
            raise UnauthorizedException("Refresh token expired. Please log in again.")

        user = await self.user_repo.get_by_id(session, record.user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        # Rotate: Generate new refresh token and link
        new_raw_refresh = generate_refresh_token()
        new_hash = hash_token(new_raw_refresh)
        new_expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        new_record = RefreshToken(
            user_id=user.id,
            token_hash=new_hash,
            device_info=device_info or record.device_info,
            expires_at=new_expires_at,
        )
        await self.refresh_token_repo.create(session, new_record)

        # Mark previous token as revoked with replacement pointer
        await self.refresh_token_repo.revoke(session, record, replaced_by=new_record.id)

        access_token = create_access_token(user.id)
        token_response = TokenResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=self._user_to_response(user),
        )

        await session.commit()
        return token_response, new_raw_refresh

    async def logout(self, session: AsyncSession, raw_refresh_token: Optional[str]) -> None:
        """Revoke current refresh token."""
        if raw_refresh_token:
            token_hash_val = hash_token(raw_refresh_token)
            record = await self.refresh_token_repo.get_by_token_hash(session, token_hash_val)
            if record and record.revoked_at is None:
                await self.refresh_token_repo.revoke(session, record)
                await session.commit()

    async def logout_all(self, session: AsyncSession, user_id: uuid.UUID) -> int:
        """Revoke all active refresh tokens for the user."""
        count = await self.refresh_token_repo.revoke_all_for_user(session, user_id)
        await session.commit()
        return count

    async def forgot_password(self, session: AsyncSession, email: str) -> None:
        """Initiate password reset email if account exists."""
        user = await self.user_repo.get_by_email(session, email)
        if user and user.password_hash:
            token = create_email_token(user.id, purpose="password_reset")
            await self.email_service.send_password_reset_email(
                to_email=user.email,
                token=token,
                display_name=user.display_name,
            )

    async def reset_password(self, session: AsyncSession, data: ResetPasswordRequest) -> None:
        """Reset user password using verified email action token."""
        payload = decode_email_token(data.token, expected_purpose="password_reset")
        user_id_str = payload.get("sub")
        try:
            user_id = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise ValidationException("Invalid token user identifier")

        user = await self.user_repo.get_by_id(session, user_id)
        if not user:
            raise NotFoundException("User not found")

        user.password_hash = hash_password(data.new_password)
        await self.user_repo.update(session, user)

        # Revoke all existing sessions for security
        await self.refresh_token_repo.revoke_all_for_user(session, user.id)
        await session.commit()

    async def change_password(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: ChangePasswordRequest,
    ) -> None:
        """Change password for an authenticated user."""
        user = await self.user_repo.get_by_id(session, user_id)
        if not user:
            raise NotFoundException("User not found")

        if not user.password_hash:
            raise ForbiddenException("Google-authenticated accounts do not have a password set.")

        if not verify_password(data.current_password, user.password_hash):
            raise UnauthorizedException("Current password is incorrect")

        user.password_hash = hash_password(data.new_password)
        await self.user_repo.update(session, user)
        await session.commit()

    async def verify_email(self, session: AsyncSession, token: str) -> None:
        """Verify user email from action token."""
        payload = decode_email_token(token, expected_purpose="email_verify")
        user_id_str = payload.get("sub")
        try:
            user_id = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise ValidationException("Invalid token user identifier")

        user = await self.user_repo.get_by_id(session, user_id)
        if not user:
            raise NotFoundException("User not found")

        user.email_verified = True
        await self.user_repo.update(session, user)
        await session.commit()

    async def get_me(self, session: AsyncSession, user_id: uuid.UUID) -> UserResponse:
        """Return profile information for current authenticated user."""
        user = await self.user_repo.get_by_id(session, user_id)
        if not user:
            raise NotFoundException("User not found")
        return self._user_to_response(user)
