import logging
from typing import AsyncGenerator
from urllib.parse import urlparse, urlunparse

import asyncpg
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def create_database_if_not_exists() -> None:
    """Ensure the target PostgreSQL database exists.
    Connects to the default 'postgres' database and creates the target DB if missing.
    Skips automatically if the target database is already 'postgres' (e.g. Supabase).
    """
    raw_url = settings.DATABASE_URL
    clean_url = raw_url.replace("postgresql+asyncpg://", "postgresql://")
    parsed = urlparse(clean_url)

    target_db = parsed.path.lstrip("/")
    if not target_db or target_db == "postgres":
        return

    # Maintenance database connection (default to 'postgres')
    maintenance_url = urlunparse(parsed._replace(path="/postgres"))

    try:
        conn = await asyncpg.connect(maintenance_url)
        try:
            exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1",
                target_db,
            )
            if not exists:
                logger.info(
                    f"Database '{target_db}' does not exist. Creating automatically..."
                )
                safe_db_name = target_db.replace('"', '""')
                await conn.execute(f'CREATE DATABASE "{safe_db_name}"')
                logger.info(f"Database '{target_db}' created successfully.")
            else:
                logger.info(f"Database '{target_db}' already exists.")
        finally:
            await conn.close()
    except Exception as e:
        logger.warning(
            f"Automatic database existence check skipped or failed: {e}. "
            "Proceeding with existing connection settings."
        )


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development"),
    future=True,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
