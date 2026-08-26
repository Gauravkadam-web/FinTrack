import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExpenseBase(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Expense title (max 50 chars)",
    )
    category_id: uuid.UUID = Field(
        ...,
        description="ID of the category",
    )
    amount: Decimal = Field(
        ...,
        gt=0,
        description="Expense amount (must be positive, up to 2 decimal places)",
    )
    expense_date: date = Field(
        default_factory=date.today,
        description="Expense date (cannot be in the future)",
    )
    notes: Optional[str] = Field(
        default=None,
        description="Optional expense notes",
    )
    payment_mode: Optional[Literal["cash", "card", "upi", "other"]] = Field(
        default=None,
        description="Payment mode (cash, card, upi, other)",
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty or whitespace only")
        if len(trimmed) > 50:
            raise ValueError("Title cannot exceed 50 characters")
        return trimmed

    @field_validator("expense_date")
    @classmethod
    def validate_date_not_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Expense date cannot be in the future")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount_precision(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be a positive number")
        # Round to 2 decimal places
        return round(v, 2)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    title: str
    category_id: uuid.UUID
    category_name: Optional[str] = None
    amount: Decimal
    expense_date: date
    notes: Optional[str] = None
    payment_mode: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    page: int
    limit: int
    total_count: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class ExpenseQueryParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    search: Optional[str] = Field(default=None, description="Search in title and notes")
    category_id: Optional[uuid.UUID] = Field(default=None)
    date_from: Optional[date] = Field(default=None)
    date_to: Optional[date] = Field(default=None)
    amount_min: Optional[Decimal] = Field(default=None, ge=0)
    amount_max: Optional[Decimal] = Field(default=None, ge=0)
    payment_mode: Optional[Literal["cash", "card", "upi", "other"]] = Field(
        default=None
    )
    sort_by: Optional[Literal["amount", "date", "category"]] = Field(default="date")
    sort_order: Optional[Literal["asc", "desc"]] = Field(default="desc")
