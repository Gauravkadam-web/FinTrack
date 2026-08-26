import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.budget import (
    BudgetCreate,
    BudgetListResponse,
    BudgetResponse,
    BudgetUpdate,
)
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])
budget_service = BudgetService()


@router.get(
    "",
    response_model=BudgetListResponse,
    status_code=status.HTTP_200_OK,
    summary="List budgets for a month",
    description="Get overall and all category budgets for the specified month with spent, remaining, and status (FR-21, FR-26, FR-27).",
)
async def list_budgets(
    month: Optional[str] = Query(
        default=None,
        pattern=r"^\d{4}-\d{2}$",
        description="Month in 'YYYY-MM' format (defaults to current month)",
    ),
    session: AsyncSession = Depends(get_db),
):
    return await budget_service.list_budgets(session, month)


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or set budget",
    description="Set an overall monthly budget (category_id=null) or a category-specific budget (FR-26).",
)
async def create_budget(
    data: BudgetCreate,
    session: AsyncSession = Depends(get_db),
):
    return await budget_service.create_budget(session, data)


@router.put(
    "/{budget_id}",
    response_model=BudgetResponse,
    status_code=status.HTTP_200_OK,
    summary="Update budget limit",
    description="Update the limit amount for an existing budget (FR-26).",
)
async def update_budget(
    budget_id: uuid.UUID,
    data: BudgetUpdate,
    session: AsyncSession = Depends(get_db),
):
    return await budget_service.update_budget(session, budget_id, data)


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete budget",
    description="Remove a budget goal (FR-26).",
)
async def delete_budget(
    budget_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
):
    await budget_service.delete_budget(session, budget_id)
    return None
