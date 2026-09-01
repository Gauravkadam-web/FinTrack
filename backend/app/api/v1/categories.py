import uuid
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryExpenseCountResponse,
    CategoryResponse,
    CategoryUpdate,
)
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])
category_service = CategoryService()


@router.get(
    "",
    response_model=List[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="List all categories",
    description="Returns all categories along with the expense count for the authenticated user (FR-9).",
)
async def list_categories(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await category_service.list_categories(session, current_user.id)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category",
    description="Create a new custom category for the authenticated user (FR-6).",
)
async def create_category(
    data: CategoryCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await category_service.create_category(session, data, current_user.id)


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Rename category",
    description="Rename an existing category. Blocked if system category (FR-7).",
)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await category_service.update_category(session, category_id, data, current_user.id)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete category",
    description="Delete a custom category. All linked expenses are automatically reassigned to 'Uncategorized' (FR-8).",
)
async def delete_category(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await category_service.delete_category(session, category_id, current_user.id)
    return None


@router.get(
    "/{category_id}/expense-count",
    response_model=CategoryExpenseCountResponse,
    status_code=status.HTTP_200_OK,
    summary="Get category expense count",
    description="Get count of expenses using this category for confirmation dialog preview (FR-8 UX).",
)
async def get_category_expense_count(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await category_service.get_expense_count(session, category_id, current_user.id)
