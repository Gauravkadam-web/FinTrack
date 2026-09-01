import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    async def create(self, session: AsyncSession, refresh_token: RefreshToken) -> RefreshToken:
        """Store a new hashed refresh token."""
        session.add(refresh_token)
        await session.flush()
        await session.refresh(refresh_token)
        return refresh_token

    async def get_by_token_hash(self, session: AsyncSession, token_hash: str) -> Optional[RefreshToken]:
        """Look up a refresh token record by its SHA-256 hash."""
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke(
        self,
        session: AsyncSession,
        refresh_token: RefreshToken,
        replaced_by: Optional[uuid.UUID] = None,
    ) -> None:
        """Mark a single refresh token as revoked, optionally linking to its replacement."""
        refresh_token.revoked_at = datetime.now(timezone.utc)
        if replaced_by:
            refresh_token.replaced_by = replaced_by
        await session.flush()

    async def revoke_all_for_user(self, session: AsyncSession, user_id: uuid.UUID) -> int:
        """Revoke all active refresh tokens for a user (logout all devices)."""
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
        result = await session.execute(stmt)
        await session.flush()
        return result.rowcount

    async def cleanup_expired(self, session: AsyncSession) -> int:
        """Delete refresh tokens that have expired and been revoked."""
        now = datetime.now(timezone.utc)
        stmt = delete(RefreshToken).where(
            (RefreshToken.expires_at < now) | (RefreshToken.revoked_at.is_not(None))
        )
        result = await session.execute(stmt)
        await session.flush()
        return result.rowcount
