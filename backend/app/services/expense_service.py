import math
import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.expense import Expense
from app.repositories.category_repository import CategoryRepository
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseQueryParams,
    ExpenseResponse,
    ExpenseUpdate,
)


class ExpenseService:
    def __init__(
        self,
        expense_repo: ExpenseRepository = None,
        category_repo: CategoryRepository = None,
    ):
        self.expense_repo = expense_repo or ExpenseRepository()
        self.category_repo = category_repo or CategoryRepository()

    def _to_response(self, expense: Expense) -> ExpenseResponse:
        cat_name = expense.category.name if expense.category else None
        return ExpenseResponse(
            id=expense.id,
            title=expense.title,
            category_id=expense.category_id,
            category_name=cat_name,
            amount=Decimal(str(expense.amount)),
            expense_date=expense.expense_date,
            notes=expense.notes,
            payment_mode=expense.payment_mode,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
        )

    async def list_expenses(
        self, session: AsyncSession, params: ExpenseQueryParams
    ) -> ExpenseListResponse:
        """Fetch filtered, searched, and sorted expenses with pagination (FR-3, FR-11-16)."""
        items, total_count = await self.expense_repo.get_paginated(session, params)
        total_pages = math.ceil(total_count / params.limit) if total_count > 0 else 1

        return ExpenseListResponse(
            items=[self._to_response(item) for item in items],
            page=params.page,
            limit=params.limit,
            total_count=total_count,
            total_pages=total_pages,
        )

    async def get_expense(
        self, session: AsyncSession, expense_id: uuid.UUID
    ) -> ExpenseResponse:
        """Get single expense by ID (FR-3)."""
        expense = await self.expense_repo.get_by_id(session, expense_id)
        if not expense:
            raise NotFoundException(message="Expense not found", field="id")
        return self._to_response(expense)

    async def create_expense(
        self, session: AsyncSession, data: ExpenseCreate
    ) -> ExpenseResponse:
        """Create a new expense entry (FR-2)."""
        # Validate category existence
        category = await self.category_repo.get_by_id(session, data.category_id)
        if not category:
            raise NotFoundException(message="Category not found", field="category_id")

        expense = Expense(
            title=data.title,
            category_id=data.category_id,
            amount=data.amount,
            expense_date=data.expense_date,
            notes=data.notes,
            payment_mode=data.payment_mode,
        )
        created = await self.expense_repo.create(session, expense)
        await session.commit()
        refreshed = await self.expense_repo.get_by_id(session, created.id)
        return self._to_response(refreshed or created)

    async def update_expense(
        self, session: AsyncSession, expense_id: uuid.UUID, data: ExpenseUpdate
    ) -> ExpenseResponse:
        """Update an existing expense (FR-4)."""
        expense = await self.expense_repo.get_by_id(session, expense_id)
        if not expense:
            raise NotFoundException(message="Expense not found", field="id")

        # Validate category existence if changed
        if data.category_id != expense.category_id:
            category = await self.category_repo.get_by_id(session, data.category_id)
            if not category:
                raise NotFoundException(
                    message="Category not found", field="category_id"
                )

        expense.title = data.title
        expense.category_id = data.category_id
        expense.amount = data.amount
        expense.expense_date = data.expense_date
        expense.notes = data.notes
        expense.payment_mode = data.payment_mode

        await self.expense_repo.update(session, expense)
        await session.commit()
        refreshed = await self.expense_repo.get_by_id(session, expense.id)
        return self._to_response(refreshed or expense)

    async def delete_expense(
        self, session: AsyncSession, expense_id: uuid.UUID
    ) -> None:
        """Delete an expense (FR-5)."""
        expense = await self.expense_repo.get_by_id(session, expense_id)
        if not expense:
            raise NotFoundException(message="Expense not found", field="id")

        await self.expense_repo.delete(session, expense)
        await session.commit()
