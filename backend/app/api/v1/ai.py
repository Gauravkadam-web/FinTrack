import calendar
from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import (
    AIBudgetForecastResponse,
    AICategorizeRequest,
    AICategorizeResponse,
    AIInsightsResponse,
    AIParsedExpenseResponse,
    AIParseExpenseRequest,
    AIReceiptScanRequest,
    AIReceiptScanResponse,
)
from app.services.ai_service import AIService
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/ai", tags=["AI Engine"])
ai_service = AIService()
category_service = CategoryService()
dashboard_service = DashboardService()
budget_service = BudgetService()


@router.post(
    "/categorize",
    response_model=AICategorizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Auto-categorize expense",
    description="Given an expense title and optional notes, AI matches with user's categories or suggests a new one.",
)
async def categorize_expense(
    payload: AICategorizeRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    categories = await category_service.list_categories(session, current_user.id)
    user_cats = [{"id": c.id, "name": c.name} for c in categories]
    return await ai_service.suggest_category(
        title=payload.title,
        user_categories=user_cats,
        amount=payload.amount,
        notes=payload.notes,
    )


@router.post(
    "/parse-expense",
    response_model=AIParsedExpenseResponse,
    status_code=status.HTTP_200_OK,
    summary="Natural language quick add",
    description="Parse natural language statement into a structured expense entry.",
)
async def parse_expense(
    payload: AIParseExpenseRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    categories = await category_service.list_categories(session, current_user.id)
    user_cats = [{"id": c.id, "name": c.name} for c in categories]
    return await ai_service.parse_expense_text(
        prompt_text=payload.prompt,
        user_categories=user_cats,
    )


@router.post(
    "/scan-receipt",
    response_model=AIReceiptScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan receipt / bill image",
    description="Upload base64 image and extract merchant, amount, date, payment mode, and category via multimodal vision.",
)
async def scan_receipt(
    payload: AIReceiptScanRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import base64

    # Extract base64 and mime type
    raw_b64 = payload.image_base64
    mime_type = payload.mime_type or "image/jpeg"

    if "," in raw_b64:
        header, raw_b64 = raw_b64.split(",", 1)
        if "data:" in header and ";base64" in header:
            mime_type = header.replace("data:", "").replace(";base64", "").strip()

    try:
        image_bytes = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 image data.",
        )

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum supported image size is 10MB.",
        )

    categories = await category_service.list_categories(session, current_user.id)
    user_cats = [{"id": c.id, "name": c.name} for c in categories]

    return await ai_service.scan_receipt_image(
        image_bytes=image_bytes,
        mime_type=mime_type,
        user_categories=user_cats,
    )


@router.get(
    "/insights",
    response_model=AIInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="AI spending insights & health check",
    description="Generate personalized financial health summary and 3 actionable insights for the user.",
)
async def get_insights(
    period: Optional[str] = Query(default="month", description="Period: 'month' or 'week'"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = await dashboard_service.get_summary(session, current_user.id)
    comparison = await dashboard_service.get_comparison(session, current_user.id)

    cat_breakdown = [
        {"name": c.category_name, "amount": float(c.amount), "percentage": c.percentage}
        for c in summary.category_breakdown
    ]
    budget_dict = {
        "budget_amount": float(summary.budget_snapshot.limit_amount) if summary.budget_snapshot else None,
        "spent_amount": float(summary.budget_snapshot.spent) if summary.budget_snapshot else None,
        "status": summary.budget_snapshot.status if summary.budget_snapshot else "no_budget",
    }

    return await ai_service.generate_insights(
        total_spend=summary.total_spent,
        category_breakdown=cat_breakdown,
        mom_change_pct=comparison.percentage_change,
        budget_status=budget_dict,
        period=period or "month",
    )


@router.get(
    "/budget-forecast",
    response_model=AIBudgetForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Smart burn rate & budget pacing forecast",
    description="Calculates current daily spend burn rate, projected month-end spend, and safe daily limit recommendations.",
)
async def get_budget_forecast(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = await dashboard_service.get_summary(session, current_user.id)

    today = date.today()
    _, total_days = calendar.monthrange(today.year, today.month)
    days_elapsed = today.day

    total_spent = summary.total_spent
    budget_limit = summary.budget_snapshot.limit_amount if summary.budget_snapshot else Decimal("0.00")

    # If user hasn't set an overall budget, fallback to a default reference or spent amount
    if not budget_limit or budget_limit <= 0:
        budget_limit = max(total_spent * Decimal("1.2"), Decimal("10000.00"))

    return await ai_service.forecast_budget_pacing(
        spent=total_spent,
        budget_limit=budget_limit,
        days_elapsed=days_elapsed,
        total_days=total_days,
    )
