import calendar
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Literal, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.repositories.budget_repository import BudgetRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.dashboard import (
    AverageSpendResponse,
    BudgetSnapshot,
    CategoryBreakdownItem,
    DashboardComparisonResponse,
    DashboardSummaryResponse,
    DashboardTrendItem,
    DashboardTrendResponse,
    TopCategoriesResponse,
    TopCategoryItem,
)
from app.schemas.expense import ExpenseResponse
from app.utils.date_utils import (
    format_period_month,
    get_month_bounds,
    get_previous_month,
    parse_period_month,
)


class DashboardService:
    def __init__(
        self,
        expense_repo: ExpenseRepository = None,
        budget_repo: BudgetRepository = None,
        category_repo: CategoryRepository = None,
    ):
        self.expense_repo = expense_repo or ExpenseRepository()
        self.budget_repo = budget_repo or BudgetRepository()
        self.category_repo = category_repo or CategoryRepository()

    def _expense_to_response(self, expense: Expense) -> ExpenseResponse:
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

    async def get_summary(
        self, session: AsyncSession, month_str: Optional[str] = None
    ) -> DashboardSummaryResponse:
        """Fetch dashboard summary metrics for a given month (FR-17, FR-18, FR-19, FR-21)."""
        period_month = parse_period_month(month_str)
        month_formatted = format_period_month(period_month)
        start_date, end_date = get_month_bounds(month_formatted)

        # 1. Total spent & count
        total_spent = await self.expense_repo.get_total_spent(
            session, start_date, end_date
        )
        expense_count = await self.expense_repo.get_expense_count(
            session, start_date, end_date
        )

        # 2. Recent expenses (last 5 in month)
        recent_expenses_models = await self.expense_repo.get_recent(
            session, limit=5, start_date=start_date, end_date=end_date
        )
        recent_expenses = [self._expense_to_response(e) for e in recent_expenses_models]

        # 3. Category breakdown
        category_spend = await self.expense_repo.get_spend_by_category(
            session, start_date, end_date
        )
        category_breakdown: List[CategoryBreakdownItem] = []
        for cat_id, cat_name, amt in category_spend:
            pct = (
                float((amt / total_spent) * Decimal("100")) if total_spent > 0 else 0.0
            )
            category_breakdown.append(
                CategoryBreakdownItem(
                    category_id=cat_id,
                    category_name=cat_name,
                    amount=amt,
                    percentage=round(pct, 2),
                )
            )

        # 4. Budget snapshot
        overall_budget = await self.budget_repo.get_overall_for_month(
            session, period_month
        )
        budget_snapshot: Optional[BudgetSnapshot] = None
        if overall_budget:
            limit_amt = Decimal(str(overall_budget.limit_amount))
            spent = total_spent
            remaining = limit_amt - spent
            pct_used = (
                float((spent / limit_amt) * Decimal("100")) if limit_amt > 0 else 0.0
            )

            if limit_amt <= 0:
                status = "over_budget"
            elif pct_used < 80.0:
                status = "on_track"
            elif pct_used < 100.0:
                status = "near_limit"
            else:
                status = "over_budget"

            budget_snapshot = BudgetSnapshot(
                id=overall_budget.id,
                limit_amount=limit_amt,
                spent=spent,
                remaining=remaining,
                status=status,
                percentage_used=round(pct_used, 2),
            )

        return DashboardSummaryResponse(
            month=month_formatted,
            total_spent=total_spent,
            expense_count=expense_count,
            recent_expenses=recent_expenses,
            category_breakdown=category_breakdown,
            budget_snapshot=budget_snapshot,
        )

    async def get_trend(
        self,
        session: AsyncSession,
        granularity: Literal["daily", "weekly", "monthly"] = "daily",
        month_str: Optional[str] = None,
    ) -> DashboardTrendResponse:
        """Fetch spend-over-time trend data (FR-20, FR-22)."""
        items: List[DashboardTrendItem] = []

        if granularity == "daily":
            if month_str:
                start_date, end_date = get_month_bounds(month_str)
            else:
                end_date = date.today()
                start_date = end_date - timedelta(days=29)

            daily_totals = await self.expense_repo.get_daily_trend(
                session, start_date, end_date
            )
            daily_map = {d: amt for d, amt in daily_totals}

            curr = start_date
            while curr <= end_date:
                amt = daily_map.get(curr, Decimal("0.00"))
                items.append(
                    DashboardTrendItem(label=curr.strftime("%Y-%m-%d"), amount=amt)
                )
                curr += timedelta(days=1)

        elif granularity == "weekly":
            # Last 12 weeks
            today = date.today()
            # Start on the Monday of 11 weeks ago
            start_of_current_week = today - timedelta(days=today.weekday())
            start_date = start_of_current_week - timedelta(weeks=11)
            end_date = today

            daily_totals = await self.expense_repo.get_daily_trend(
                session, start_date, end_date
            )
            daily_map = {d: amt for d, amt in daily_totals}

            for week_idx in range(12):
                week_start = start_date + timedelta(weeks=week_idx)
                week_end = week_start + timedelta(days=6)
                week_total = Decimal("0.00")

                curr = week_start
                while curr <= min(week_end, end_date):
                    week_total += daily_map.get(curr, Decimal("0.00"))
                    curr += timedelta(days=1)

                label = f"{week_start.strftime('%b %d')}"
                items.append(DashboardTrendItem(label=label, amount=week_total))

        elif granularity == "monthly":
            # Last 12 months
            today = date.today()
            # 11 months back
            year = today.year
            month = today.month - 11
            while month <= 0:
                month += 12
                year -= 1
            start_date = date(year, month, 1)
            _, last_day = calendar.monthrange(today.year, today.month)
            end_date = date(today.year, today.month, last_day)

            daily_totals = await self.expense_repo.get_daily_trend(
                session, start_date, end_date
            )
            daily_map = {d: amt for d, amt in daily_totals}

            curr_month_start = start_date
            for _ in range(12):
                _, num_days = calendar.monthrange(
                    curr_month_start.year, curr_month_start.month
                )
                curr_month_end = date(
                    curr_month_start.year, curr_month_start.month, num_days
                )

                month_total = Decimal("0.00")
                curr = curr_month_start
                while curr <= curr_month_end:
                    month_total += daily_map.get(curr, Decimal("0.00"))
                    curr += timedelta(days=1)

                items.append(
                    DashboardTrendItem(
                        label=curr_month_start.strftime("%Y-%m"),
                        amount=month_total,
                    )
                )

                # Advance one month
                if curr_month_start.month == 12:
                    curr_month_start = date(curr_month_start.year + 1, 1, 1)
                else:
                    curr_month_start = date(
                        curr_month_start.year, curr_month_start.month + 1, 1
                    )

        return DashboardTrendResponse(
            granularity=granularity,
            month=month_str,
            items=items,
        )

    async def get_comparison(
        self, session: AsyncSession, month_str: Optional[str] = None
    ) -> DashboardComparisonResponse:
        """Compare current month spend vs previous month spend (FR-23)."""
        curr_start, curr_end = get_month_bounds(month_str)
        curr_formatted = format_period_month(curr_start)

        prev_start = get_previous_month(curr_start)
        _, prev_last_day = calendar.monthrange(prev_start.year, prev_start.month)
        prev_end = date(prev_start.year, prev_start.month, prev_last_day)
        prev_formatted = format_period_month(prev_start)

        current_total = await self.expense_repo.get_total_spent(
            session, curr_start, curr_end
        )
        previous_total = await self.expense_repo.get_total_spent(
            session, prev_start, prev_end
        )

        difference = current_total - previous_total

        pct_change: Optional[float] = None
        if previous_total > Decimal("0.00"):
            change = (difference / previous_total) * Decimal("100")
            pct_change = round(float(change), 2)

        return DashboardComparisonResponse(
            current_month=curr_formatted,
            previous_month=prev_formatted,
            current_total=current_total,
            previous_total=previous_total,
            difference=difference,
            percentage_change=pct_change,
        )

    async def get_top_categories(
        self, session: AsyncSession, month_str: Optional[str] = None, limit: int = 5
    ) -> TopCategoriesResponse:
        """Fetch top N spending categories for a given month (FR-24)."""
        start_date, end_date = get_month_bounds(month_str)
        month_formatted = format_period_month(start_date)

        total_spent = await self.expense_repo.get_total_spent(
            session, start_date, end_date
        )
        cat_rows = await self.expense_repo.get_spend_by_category(
            session, start_date, end_date
        )

        items: List[TopCategoryItem] = []
        for rank, (cat_id, cat_name, amt) in enumerate(cat_rows[:limit], start=1):
            pct = (
                float((amt / total_spent) * Decimal("100")) if total_spent > 0 else 0.0
            )
            items.append(
                TopCategoryItem(
                    rank=rank,
                    category_id=cat_id,
                    category_name=cat_name,
                    total_spent=amt,
                    percentage_of_total=round(pct, 2),
                )
            )

        return TopCategoriesResponse(
            month=month_formatted,
            items=items,
        )

    async def get_average_spend(
        self, session: AsyncSession, period: Literal["daily", "weekly"] = "daily"
    ) -> AverageSpendResponse:
        """Calculate normalized average spend (FR-25)."""
        today = date.today()
        # Default to last 30 days window for normalized metrics
        start_date = today - timedelta(days=29)
        end_date = today

        total_spent = await self.expense_repo.get_total_spent(
            session, start_date, end_date
        )

        if period == "daily":
            units_count = 30
            avg = total_spent / Decimal(str(units_count))
        else:  # weekly
            units_count = 4  # approx 4 weeks in 30 days
            avg = total_spent / Decimal(str(units_count))

        return AverageSpendResponse(
            period=period,
            average_amount=round(avg, 2),
            total_spent=total_spent,
            units_count=units_count,
        )
