import uuid
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.schemas.expense import ExpenseResponse


class CategoryBreakdownItem(BaseModel):
    category_id: uuid.UUID
    category_name: str
    amount: Decimal
    percentage: float


class BudgetSnapshot(BaseModel):
    id: Optional[uuid.UUID] = None
    limit_amount: Decimal
    spent: Decimal
    remaining: Decimal
    status: Literal["on_track", "near_limit", "over_budget"]
    percentage_used: float


class DashboardSummaryResponse(BaseModel):
    month: str
    total_spent: Decimal
    expense_count: int
    recent_expenses: List[ExpenseResponse]
    category_breakdown: List[CategoryBreakdownItem]
    budget_snapshot: Optional[BudgetSnapshot] = None


class DashboardTrendItem(BaseModel):
    label: str
    amount: Decimal


class DashboardTrendResponse(BaseModel):
    granularity: Literal["daily", "weekly", "monthly"]
    month: Optional[str] = None
    items: List[DashboardTrendItem]


class DashboardComparisonResponse(BaseModel):
    current_month: str
    previous_month: str
    current_total: Decimal
    previous_total: Decimal
    difference: Decimal
    percentage_change: Optional[float] = None


class TopCategoryItem(BaseModel):
    rank: int
    category_id: uuid.UUID
    category_name: str
    total_spent: Decimal
    percentage_of_total: float


class TopCategoriesResponse(BaseModel):
    month: str
    items: List[TopCategoryItem]


class AverageSpendResponse(BaseModel):
    period: Literal["daily", "weekly"]
    average_amount: Decimal
    total_spent: Decimal
    units_count: int
