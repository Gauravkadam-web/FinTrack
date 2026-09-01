import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedException, ValidationException

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password using BCrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored BCrypt hash."""
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: Union[str, uuid.UUID],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a short-lived JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        token_type = payload.get("type")
        if token_type != "access":
            raise UnauthorizedException("Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Missing token subject claim")
        return payload
    except JWTError as e:
        raise UnauthorizedException(f"Invalid or expired token: {str(e)}")


def generate_refresh_token() -> str:
    """Generate a cryptographically secure random opaque refresh token string."""
    return secrets.token_urlsafe(64)


def hash_token(raw_token: str) -> str:
    """Hash an opaque token using SHA-256 for secure database persistence."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_email_token(
    user_id: Union[str, uuid.UUID],
    purpose: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed, single-purpose JWT token for email verification or password reset."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=1)

    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "purpose": purpose,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_email_token(token: str, expected_purpose: str) -> Dict[str, Any]:
    """Decode and validate a signed email action token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("purpose") != expected_purpose:
            raise ValidationException(f"Invalid token purpose: expected '{expected_purpose}'")
        user_id = payload.get("sub")
        if not user_id:
            raise ValidationException("Missing token subject")
        return payload
    except JWTError as e:
        raise ValidationException(f"Invalid or expired action link: {str(e)}")
