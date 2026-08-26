import uuid
from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.expense import Expense
from app.schemas.expense import ExpenseQueryParams


class ExpenseRepository:
    async def get_paginated(
        self, session: AsyncSession, params: ExpenseQueryParams
    ) -> Tuple[List[Expense], int]:
        """Fetch paginated expenses with dynamic filters, ILIKE search, and sorting."""
        base_query = select(Expense).options(selectinload(Expense.category))
        count_query = select(func.count(Expense.id))

        # Search filter on title OR notes (FR-11)
        if params.search:
            search_pattern = f"%{params.search.strip()}%"
            search_filter = or_(
                Expense.title.ilike(search_pattern),
                Expense.notes.ilike(search_pattern),
            )
            base_query = base_query.where(search_filter)
            count_query = count_query.where(search_filter)

        # Category filter (FR-13)
        if params.category_id:
            base_query = base_query.where(Expense.category_id == params.category_id)
            count_query = count_query.where(Expense.category_id == params.category_id)

        # Date range filter (FR-12)
        if params.date_from:
            base_query = base_query.where(Expense.expense_date >= params.date_from)
            count_query = count_query.where(Expense.expense_date >= params.date_from)
        if params.date_to:
            base_query = base_query.where(Expense.expense_date <= params.date_to)
            count_query = count_query.where(Expense.expense_date <= params.date_to)

        # Amount range filter (FR-14)
        if params.amount_min is not None:
            base_query = base_query.where(Expense.amount >= params.amount_min)
            count_query = count_query.where(Expense.amount >= params.amount_min)
        if params.amount_max is not None:
            base_query = base_query.where(Expense.amount <= params.amount_max)
            count_query = count_query.where(Expense.amount <= params.amount_max)

        # Payment mode filter (FR-15)
        if params.payment_mode:
            base_query = base_query.where(Expense.payment_mode == params.payment_mode)
            count_query = count_query.where(Expense.payment_mode == params.payment_mode)

        # Count total matches
        total_count_result = await session.execute(count_query)
        total_count = int(total_count_result.scalar_one() or 0)

        # Sorting (FR-16)
        sort_col = Expense.expense_date
        if params.sort_by == "amount":
            sort_col = Expense.amount
        elif params.sort_by == "category":
            base_query = base_query.join(Category, Expense.category_id == Category.id)
            sort_col = Category.name

        if params.sort_order == "asc":
            base_query = base_query.order_by(sort_col.asc(), Expense.created_at.asc())
        else:
            base_query = base_query.order_by(sort_col.desc(), Expense.created_at.desc())

        # Pagination
        offset = (params.page - 1) * params.limit
        paginated_query = base_query.offset(offset).limit(params.limit)

        result = await session.execute(paginated_query)
        items = list(result.scalars().all())
        return items, total_count

    async def get_by_id(
        self, session: AsyncSession, expense_id: uuid.UUID
    ) -> Optional[Expense]:
        """Get single expense with category relationship."""
        stmt = (
            select(Expense)
            .options(selectinload(Expense.category))
            .where(Expense.id == expense_id)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, session: AsyncSession, expense: Expense) -> Expense:
        """Create new expense."""
        session.add(expense)
        await session.flush()
        await session.refresh(expense, ["category"])
        return expense

    async def update(self, session: AsyncSession, expense: Expense) -> Expense:
        """Update existing expense."""
        await session.flush()
        await session.refresh(expense, ["category"])
        return expense

    async def delete(self, session: AsyncSession, expense: Expense) -> None:
        """Delete expense."""
        await session.delete(expense)
        await session.flush()

    async def reassign_category(
        self,
        session: AsyncSession,
        old_category_id: uuid.UUID,
        new_category_id: uuid.UUID,
    ) -> int:
        """Reassign all expenses from one category to another (FR-8)."""
        stmt = (
            update(Expense)
            .where(Expense.category_id == old_category_id)
            .values(category_id=new_category_id)
        )
        result = await session.execute(stmt)
        return result.rowcount

    async def get_recent(
        self,
        session: AsyncSession,
        limit: int = 5,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Expense]:
        """Fetch recent expenses for dashboard snapshot (FR-18)."""
        stmt = select(Expense).options(selectinload(Expense.category))
        if start_date:
            stmt = stmt.where(Expense.expense_date >= start_date)
        if end_date:
            stmt = stmt.where(Expense.expense_date <= end_date)
        stmt = stmt.order_by(
            Expense.expense_date.desc(), Expense.created_at.desc()
        ).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_total_spent(
        self,
        session: AsyncSession,
        start_date: date,
        end_date: date,
        category_id: Optional[uuid.UUID] = None,
    ) -> Decimal:
        """Calculate total amount spent within a date range."""
        stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
        )
        if category_id:
            stmt = stmt.where(Expense.category_id == category_id)

        result = await session.execute(stmt)
        val = result.scalar_one()
        return Decimal(str(val))

    async def get_expense_count(
        self, session: AsyncSession, start_date: date, end_date: date
    ) -> int:
        """Count expenses in date range."""
        stmt = select(func.count(Expense.id)).where(
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
        )
        result = await session.execute(stmt)
        return int(result.scalar_one() or 0)

    async def get_spend_by_category(
        self, session: AsyncSession, start_date: date, end_date: date
    ) -> List[Tuple[uuid.UUID, str, Decimal]]:
        """Get aggregate spend per category in date range (FR-19)."""
        stmt = (
            select(
                Category.id,
                Category.name,
                func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
            )
            .join(Expense, Expense.category_id == Category.id)
            .where(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
            )
            .group_by(Category.id, Category.name)
            .order_by(func.sum(Expense.amount).desc())
        )
        result = await session.execute(stmt)
        return [(row[0], str(row[1]), Decimal(str(row[2]))) for row in result.all()]

    async def get_daily_trend(
        self, session: AsyncSession, start_date: date, end_date: date
    ) -> List[Tuple[date, Decimal]]:
        """Get daily spend totals for a date range (FR-20)."""
        stmt = (
            select(
                Expense.expense_date,
                func.coalesce(func.sum(Expense.amount), 0).label("daily_total"),
            )
            .where(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
            )
            .group_by(Expense.expense_date)
            .order_by(Expense.expense_date.asc())
        )
        result = await session.execute(stmt)
        return [(row[0], Decimal(str(row[1]))) for row in result.all()]
