import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.models.budget import Budget
from app.repositories.budget_repository import BudgetRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.budget import (
    BudgetCreate,
    BudgetListResponse,
    BudgetResponse,
    BudgetUpdate,
)
from app.utils.date_utils import (
    format_period_month,
    get_month_bounds,
    parse_period_month,
)


class BudgetService:
    def __init__(
        self,
        budget_repo: BudgetRepository = None,
        expense_repo: ExpenseRepository = None,
        category_repo: CategoryRepository = None,
    ):
        self.budget_repo = budget_repo or BudgetRepository()
        self.expense_repo = expense_repo or ExpenseRepository()
        self.category_repo = category_repo or CategoryRepository()

    async def _compute_budget_response(
        self, session: AsyncSession, budget: Budget
    ) -> BudgetResponse:
        """Compute spent, remaining, and status for a budget row."""
        start_date, end_date = get_month_bounds(
            format_period_month(budget.period_month)
        )
        spent = await self.expense_repo.get_total_spent(
            session,
            start_date=start_date,
            end_date=end_date,
            category_id=budget.category_id,
        )

        limit_amt = Decimal(str(budget.limit_amount))
        remaining = limit_amt - spent

        # Status thresholds (business rules per API Spec §5):
        # on_track: spent < 80% of limit
        # near_limit: spent 80%–99.99% of limit
        # over_budget: spent >= 100% of limit
        if limit_amt <= 0:
            status = "over_budget"
        else:
            percentage = (spent / limit_amt) * Decimal("100")
            if percentage < Decimal("80"):
                status = "on_track"
            elif percentage < Decimal("100"):
                status = "near_limit"
            else:
                status = "over_budget"

        cat_name = budget.category.name if budget.category else None

        return BudgetResponse(
            id=budget.id,
            category_id=budget.category_id,
            category_name=cat_name,
            period_month=budget.period_month,
            limit_amount=limit_amt,
            spent=spent,
            remaining=remaining,
            status=status,
            created_at=budget.created_at,
            updated_at=budget.updated_at,
        )

    async def list_budgets(
        self, session: AsyncSession, month_str: Optional[str] = None
    ) -> BudgetListResponse:
        """List overall and category budgets for a specific month with totals (FR-21, FR-26, FR-27)."""
        period_month = parse_period_month(month_str)
        month_formatted = format_period_month(period_month)
        start_date, end_date = get_month_bounds(month_formatted)

        budgets = await self.budget_repo.get_all_for_month(session, period_month)

        overall_budget_response: Optional[BudgetResponse] = None
        category_budget_responses = []

        total_budget_limit = Decimal("0.00")

        for b in budgets:
            resp = await self._compute_budget_response(session, b)
            if b.category_id is None:
                overall_budget_response = resp
                total_budget_limit = resp.limit_amount
            else:
                category_budget_responses.append(resp)

        # If no overall budget is explicitly set, total_budget is sum of category budgets
        if overall_budget_response is None:
            total_budget_limit = sum(
                (cb.limit_amount for cb in category_budget_responses), Decimal("0.00")
            )

        total_spent = await self.expense_repo.get_total_spent(
            session, start_date, end_date
        )
        total_remaining = total_budget_limit - total_spent

        return BudgetListResponse(
            month=month_formatted,
            overall=overall_budget_response,
            categories=category_budget_responses,
            total_budget=total_budget_limit,
            total_spent=total_spent,
            total_remaining=total_remaining,
        )

    async def create_budget(
        self, session: AsyncSession, data: BudgetCreate
    ) -> BudgetResponse:
        """Create/set a monthly budget (FR-26)."""
        # Validate category if provided
        if data.category_id:
            category = await self.category_repo.get_by_id(session, data.category_id)
            if not category:
                raise NotFoundException(
                    message="Category not found", field="category_id"
                )

        # Check unique constraint (category_id + period_month)
        existing = await self.budget_repo.get_by_category_and_month(
            session, data.category_id, data.period_month
        )
        if existing:
            field_name = "category_id" if data.category_id else "period_month"
            target_str = (
                f"category '{category.name}'" if data.category_id else "overall month"
            )
            raise ConflictException(
                message=f"Budget for {target_str} and month {data.period_month.strftime('%Y-%m')} already exists",
                field=field_name,
            )

        budget = Budget(
            category_id=data.category_id,
            period_month=data.period_month,
            limit_amount=data.limit_amount,
        )
        created = await self.budget_repo.create(session, budget)
        await session.commit()

        # Reload with category if present
        refreshed = await self.budget_repo.get_by_id(session, created.id)
        return await self._compute_budget_response(session, refreshed or created)

    async def update_budget(
        self, session: AsyncSession, budget_id: uuid.UUID, data: BudgetUpdate
    ) -> BudgetResponse:
        """Update a budget limit amount (FR-26)."""
        budget = await self.budget_repo.get_by_id(session, budget_id)
        if not budget:
            raise NotFoundException(message="Budget not found", field="id")

        budget.limit_amount = data.limit_amount
        await self.budget_repo.update(session, budget)
        await session.commit()
        refreshed = await self.budget_repo.get_by_id(session, budget.id)
        return await self._compute_budget_response(session, refreshed or budget)

    async def delete_budget(self, session: AsyncSession, budget_id: uuid.UUID) -> None:
        """Remove a budget goal (FR-26)."""
        budget = await self.budget_repo.get_by_id(session, budget_id)
        if not budget:
            raise NotFoundException(message="Budget not found", field="id")

        await self.budget_repo.delete(session, budget)
        await session.commit()
