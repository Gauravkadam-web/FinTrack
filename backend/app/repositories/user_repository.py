import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    async def get_by_id(self, session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        """Fetch user by UUID."""
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, session: AsyncSession, email: str) -> Optional[User]:
        """Fetch user by email (case-insensitive)."""
        stmt = select(User).where(func.lower(User.email) == func.lower(email.strip()))
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_google_id(self, session: AsyncSession, google_id: str) -> Optional[User]:
        """Fetch user by Google account ID."""
        stmt = select(User).where(User.google_id == google_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, session: AsyncSession, user: User) -> User:
        """Persist a new user."""
        session.add(user)
        await session.flush()
        await session.refresh(user)
        return user

    async def update(self, session: AsyncSession, user: User) -> User:
        """Update existing user."""
        await session.flush()
        await session.refresh(user)
        return user
