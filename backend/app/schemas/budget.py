import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BudgetBase(BaseModel):
    category_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Category ID, or null for overall monthly budget",
    )
    period_month: date = Field(
        ...,
        description="First day of the budget month (e.g. 2026-08-01 or 2026-08)",
    )
    limit_amount: Decimal = Field(
        ...,
        gt=0,
        description="Budget limit amount (must be positive)",
    )

    @field_validator("limit_amount")
    @classmethod
    def validate_positive_limit(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Limit amount must be a positive number")
        return round(v, 2)

    @field_validator("period_month", mode="before")
    @classmethod
    def parse_and_normalize_period_month(cls, v: Union[str, date]) -> date:
        if isinstance(v, str):
            v_clean = v.strip()
            # If YYYY-MM format (e.g. "2026-08")
            if len(v_clean) == 7 and v_clean.count("-") == 1:
                try:
                    dt = datetime.strptime(v_clean, "%Y-%m")
                    return date(dt.year, dt.month, 1)
                except ValueError:
                    raise ValueError("Invalid month format. Expected 'YYYY-MM' (e.g. '2026-08')")
            # If YYYY-MM-DD format (e.g. "2026-08-01")
            elif len(v_clean) >= 10:
                try:
                    dt = datetime.strptime(v_clean[:10], "%Y-%m-%d")
                    return date(dt.year, dt.month, 1)
                except ValueError:
                    raise ValueError("Invalid date format. Expected 'YYYY-MM-DD' (e.g. '2026-08-01')")
            else:
                raise ValueError("Invalid date format. Expected 'YYYY-MM' or 'YYYY-MM-DD'")
        elif isinstance(v, date):
            return date(v.year, v.month, 1)
        return v


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    limit_amount: Decimal = Field(
        ...,
        gt=0,
        description="Updated budget limit amount",
    )

    @field_validator("limit_amount")
    @classmethod
    def validate_positive_limit(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Limit amount must be a positive number")
        return round(v, 2)


class BudgetResponse(BaseModel):
    id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    period_month: date
    limit_amount: Decimal
    spent: Decimal = Decimal("0.00")
    remaining: Decimal = Decimal("0.00")
    status: Literal["on_track", "near_limit", "over_budget"] = "on_track"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetListResponse(BaseModel):
    month: str
    overall: Optional[BudgetResponse] = None
    categories: List[BudgetResponse] = []
    total_budget: Decimal = Decimal("0.00")
    total_spent: Decimal = Decimal("0.00")
    total_remaining: Decimal = Decimal("0.00")
