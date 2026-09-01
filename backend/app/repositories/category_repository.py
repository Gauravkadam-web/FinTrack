import uuid
from typing import List, Optional, Tuple

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.expense import Expense


class CategoryRepository:
    async def get_all_with_counts(
        self, session: AsyncSession, user_id: uuid.UUID
    ) -> List[Tuple[Category, int]]:
        """Get all categories for a user with their associated expense count (FR-9)."""
        stmt = (
            select(Category, func.count(Expense.id).label("expense_count"))
            .outerjoin(
                Expense,
                and_(
                    Expense.category_id == Category.id,
                    Expense.user_id == user_id,
                ),
            )
            .where(Category.user_id == user_id)
            .group_by(Category.id)
            .order_by(Category.is_system.desc(), Category.name.asc())
        )
        result = await session.execute(stmt)
        return [(row[0], int(row[1])) for row in result.all()]

    async def get_by_id(
        self, session: AsyncSession, category_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Category]:
        """Fetch user-specific category by UUID."""
        stmt = select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name(
        self, session: AsyncSession, name: str, user_id: uuid.UUID
    ) -> Optional[Category]:
        """Fetch user category by exact case-insensitive name."""
        stmt = select(Category).where(
            func.lower(Category.name) == func.lower(name.strip()),
            Category.user_id == user_id,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, session: AsyncSession, category: Category) -> Category:
        """Add new category."""
        session.add(category)
        await session.flush()
        await session.refresh(category)
        return category

    async def update(self, session: AsyncSession, category: Category) -> Category:
        """Update existing category."""
        await session.flush()
        await session.refresh(category)
        return category

    async def delete(self, session: AsyncSession, category: Category) -> None:
        """Delete category row."""
        await session.delete(category)
        await session.flush()

    async def count_expenses(
        self, session: AsyncSession, category_id: uuid.UUID, user_id: uuid.UUID
    ) -> int:
        """Get count of expenses linked to a user's category."""
        stmt = select(func.count(Expense.id)).where(
            Expense.category_id == category_id,
            Expense.user_id == user_id,
        )
        result = await session.execute(stmt)
        return int(result.scalar_one() or 0)
