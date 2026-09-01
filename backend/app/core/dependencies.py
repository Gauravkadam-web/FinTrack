import uuid
from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

http_bearer = HTTPBearer(auto_error=False)
user_repo = UserRepository()


async def get_current_user(
    auth_creds: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT access token from Authorization header and return the authenticated User model."""
    if not auth_creds or not auth_creds.credentials:
        raise UnauthorizedException("Authentication required. Please provide a valid Bearer token.")

    token = auth_creds.credentials
    payload = decode_access_token(token)
    user_id_str = payload.get("sub")

    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise UnauthorizedException("Invalid token user identifier")

    user = await user_repo.get_by_id(session, user_id)
    if not user:
        raise UnauthorizedException("User account not found")

    if not user.is_active:
        raise UnauthorizedException("User account has been deactivated")

    return user
