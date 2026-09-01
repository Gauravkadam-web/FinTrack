import uuid
from datetime import date
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.budget import Budget


class BudgetRepository:
    async def get_all_for_month(
        self, session: AsyncSession, period_month: date, user_id: uuid.UUID
    ) -> List[Budget]:
        """Fetch all budgets (overall + category-specific) for a specific user and month."""
        stmt = (
            select(Budget)
            .options(selectinload(Budget.category))
            .where(
                Budget.period_month == period_month,
                Budget.user_id == user_id,
            )
            .order_by(Budget.category_id.is_(None).desc(), Budget.created_at.asc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_overall_for_month(
        self, session: AsyncSession, period_month: date, user_id: uuid.UUID
    ) -> Optional[Budget]:
        """Fetch user overall budget (category_id is NULL) for a month."""
        stmt = select(Budget).where(
            Budget.period_month == period_month,
            Budget.category_id.is_(None),
            Budget.user_id == user_id,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_category_and_month(
        self,
        session: AsyncSession,
        category_id: Optional[uuid.UUID],
        period_month: date,
        user_id: uuid.UUID,
    ) -> Optional[Budget]:
        """Fetch user budget by category and month."""
        stmt = select(Budget).where(
            Budget.period_month == period_month,
            Budget.user_id == user_id,
        )
        if category_id is None:
            stmt = stmt.where(Budget.category_id.is_(None))
        else:
            stmt = stmt.where(Budget.category_id == category_id)

        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(
        self, session: AsyncSession, budget_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Budget]:
        """Fetch user budget by ID."""
        stmt = (
            select(Budget)
            .options(selectinload(Budget.category))
            .where(
                Budget.id == budget_id,
                Budget.user_id == user_id,
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, session: AsyncSession, budget: Budget) -> Budget:
        """Create a new budget."""
        session.add(budget)
        await session.flush()
        await session.refresh(budget, ["category"])
        return budget

    async def update(self, session: AsyncSession, budget: Budget) -> Budget:
        """Update an existing budget limit."""
        await session.flush()
        await session.refresh(budget, ["category"])
        return budget

    async def delete(self, session: AsyncSession, budget: Budget) -> None:
        """Delete a budget."""
        await session.delete(budget)
        await session.flush()
