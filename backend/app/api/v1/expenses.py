import uuid
from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseQueryParams,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])
expense_service = ExpenseService()


@router.get(
    "",
    response_model=ExpenseListResponse,
    status_code=status.HTTP_200_OK,
    summary="List expenses (paginated, filtered, sorted)",
    description="Fetch paginated expenses for authenticated user with dynamic filters, ILIKE search, and sorting (FR-3, FR-11-16).",
)
async def list_expenses(
    page: int = Query(default=1, ge=1, description="Page number starting from 1"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(
        default=None, description="Search term in title and notes"
    ),
    category_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by category"
    ),
    date_from: Optional[date] = Query(default=None, description="Filter by start date"),
    date_to: Optional[date] = Query(default=None, description="Filter by end date"),
    amount_min: Optional[Decimal] = Query(
        default=None, ge=0, description="Minimum amount"
    ),
    amount_max: Optional[Decimal] = Query(
        default=None, ge=0, description="Maximum amount"
    ),
    payment_mode: Optional[Literal["cash", "card", "upi", "other"]] = Query(
        default=None, description="Filter by payment mode"
    ),
    sort_by: Optional[Literal["amount", "date", "category"]] = Query(
        default="date", description="Field to sort by"
    ),
    sort_order: Optional[Literal["asc", "desc"]] = Query(
        default="desc", description="Sort direction"
    ),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    params = ExpenseQueryParams(
        page=page,
        limit=limit,
        search=search,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        amount_min=amount_min,
        amount_max=amount_max,
        payment_mode=payment_mode,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await expense_service.list_expenses(session, params, current_user.id)


@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create expense",
    description="Record a new expense entry for authenticated user (FR-2).",
)
async def create_expense(
    data: ExpenseCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await expense_service.create_expense(session, data, current_user.id)


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single expense",
    description="Fetch single expense by its UUID belonging to authenticated user (FR-3).",
)
async def get_expense(
    expense_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await expense_service.get_expense(session, expense_id, current_user.id)


@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse,
    status_code=status.HTTP_200_OK,
    summary="Update expense",
    description="Update all fields of an existing expense belonging to authenticated user (FR-4).",
)
async def update_expense(
    expense_id: uuid.UUID,
    data: ExpenseUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await expense_service.update_expense(session, expense_id, data, current_user.id)


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete expense",
    description="Delete an expense record belonging to authenticated user (FR-5).",
)
async def delete_expense(
    expense_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await expense_service.delete_expense(session, expense_id, current_user.id)
    return None
