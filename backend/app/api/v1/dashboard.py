from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dashboard import (
    AverageSpendResponse,
    DashboardComparisonResponse,
    DashboardSummaryResponse,
    DashboardTrendResponse,
    TopCategoriesResponse,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
dashboard_service = DashboardService()


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Dashboard summary",
    description="Total spent, recent expenses (last 5), category breakdown (pie), budget snapshot for the given month (FR-17-19, FR-21).",
)
async def get_summary(
    month: Optional[str] = Query(
        default=None,
        pattern=r"^\d{4}-\d{2}$",
        description="Month in 'YYYY-MM' format (defaults to current month)",
    ),
    session: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_summary(session, month)


@router.get(
    "/trend",
    response_model=DashboardTrendResponse,
    status_code=status.HTTP_200_OK,
    summary="Spend trend over time",
    description="Spend-over-time data for charts bucketed by granularity: daily, weekly, or monthly (FR-20, FR-22).",
)
async def get_trend(
    granularity: Literal["daily", "weekly", "monthly"] = Query(
        default="daily", description="Aggregation granularity"
    ),
    month: Optional[str] = Query(
        default=None,
        pattern=r"^\d{4}-\d{2}$",
        description="Month in 'YYYY-MM' format (used for daily granularity)",
    ),
    session: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_trend(session, granularity, month)


@router.get(
    "/comparison",
    response_model=DashboardComparisonResponse,
    status_code=status.HTTP_200_OK,
    summary="Month-over-month comparison",
    description="Current vs previous month total spend and percentage change (FR-23).",
)
async def get_comparison(
    month: Optional[str] = Query(
        default=None,
        pattern=r"^\d{4}-\d{2}$",
        description="Month in 'YYYY-MM' format (defaults to current month)",
    ),
    session: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_comparison(session, month)


@router.get(
    "/top-categories",
    response_model=TopCategoriesResponse,
    status_code=status.HTTP_200_OK,
    summary="Top spending categories",
    description="Top N categories ranked by spend for a given month (FR-24).",
)
async def get_top_categories(
    month: Optional[str] = Query(
        default=None,
        pattern=r"^\d{4}-\d{2}$",
        description="Month in 'YYYY-MM' format (defaults to current month)",
    ),
    limit: int = Query(
        default=5, ge=1, le=20, description="Number of top categories to return"
    ),
    session: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_top_categories(session, month, limit)


@router.get(
    "/average-spend",
    response_model=AverageSpendResponse,
    status_code=status.HTTP_200_OK,
    summary="Average normalized spend",
    description="Normalized average spend per day or per week (FR-25).",
)
async def get_average_spend(
    period: Literal["daily", "weekly"] = Query(
        default="daily", description="Period to average over"
    ),
    session: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_average_spend(session, period)
