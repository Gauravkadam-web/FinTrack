import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class AICategorizeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Expense title")
    amount: Optional[Decimal] = Field(default=None, description="Optional expense amount")
    notes: Optional[str] = Field(default=None, description="Optional extra notes")


class AICategorizeResponse(BaseModel):
    suggested_category: str = Field(..., description="Best matching category name")
    category_id: Optional[uuid.UUID] = Field(default=None, description="Matched category ID if existing")
    is_existing: bool = Field(..., description="True if category belongs to user's existing list")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0.0 - 1.0")
    reason: Optional[str] = Field(default=None, description="Short AI reasoning")


class AIParseExpenseRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500, description="Natural language expense statement")


class AIParsedExpenseResponse(BaseModel):
    title: str = Field(..., description="Parsed expense title (max 50 chars)")
    amount: Decimal = Field(..., gt=0, description="Parsed positive amount")
    category_name: str = Field(..., description="Best matching or proposed category name")
    category_id: Optional[uuid.UUID] = Field(default=None, description="Category ID if matched in user list")
    payment_mode: Optional[Literal["cash", "card", "upi", "other"]] = Field(
        default=None, description="Extracted payment mode"
    )
    expense_date: date = Field(default_factory=date.today, description="Extracted date (defaults to today)")
    notes: Optional[str] = Field(default=None, description="Extracted extra notes")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class AIReceiptScanRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string or data URL")
    mime_type: Optional[str] = Field(default="image/jpeg", description="MIME type (image/jpeg, image/png, image/webp)")


class AIReceiptScanResponse(BaseModel):
    title: str = Field(..., description="Merchant name or receipt title")
    amount: Decimal = Field(..., gt=0, description="Total extracted amount")
    category_name: str = Field(..., description="Best matching category name")
    category_id: Optional[uuid.UUID] = Field(default=None, description="Category ID if matched in user list")
    payment_mode: Optional[Literal["cash", "card", "upi", "other"]] = Field(default=None)
    expense_date: date = Field(default_factory=date.today)
    notes: Optional[str] = Field(default=None, description="Line items or receipt summary")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class AIInsightBullet(BaseModel):
    type: Literal["highlight", "watchout", "tip"] = Field(..., description="Category of insight")
    text: str = Field(..., description="Actionable insight text")


class AIInsightsResponse(BaseModel):
    period: str = Field(default="month", description="Period analyzed")
    headline: str = Field(..., description="High-level financial summary headline")
    insights: List[AIInsightBullet] = Field(..., min_length=1, description="List of insight bullet points")
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class AIBudgetForecastResponse(BaseModel):
    total_budget: Decimal = Field(..., description="Total monthly budget limit")
    total_spent: Decimal = Field(..., description="Current total spend so far")
    days_elapsed: int = Field(..., ge=1)
    days_in_month: int = Field(..., ge=28, le=31)
    days_remaining: int = Field(..., ge=0)
    current_daily_burn: Decimal = Field(..., description="Current average spend per day")
    projected_total_spent: Decimal = Field(..., description="Projected spend by month end")
    projected_variance: Decimal = Field(..., description="Projected over/under budget amount")
    recommended_daily_limit: Decimal = Field(..., description="Safe daily budget for remainder of month")
    status: Literal["on_track", "warning", "exceeded"] = Field(...)
    ai_advice: str = Field(..., description="Friendly contextual advice for user")

    model_config = ConfigDict(from_attributes=True)
