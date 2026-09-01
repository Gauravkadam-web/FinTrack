import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    NotFoundException,
)
from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.category import (
    CategoryCreate,
    CategoryExpenseCountResponse,
    CategoryResponse,
    CategoryUpdate,
)


class CategoryService:
    def __init__(
        self,
        category_repo: Optional[CategoryRepository] = None,
        expense_repo: Optional[ExpenseRepository] = None,
    ):
        self.category_repo = category_repo or CategoryRepository()
        self.expense_repo = expense_repo or ExpenseRepository()

    async def list_categories(
        self, session: AsyncSession, user_id: uuid.UUID
    ) -> List[CategoryResponse]:
        """List all categories for a user with expense counts (FR-9)."""
        rows = await self.category_repo.get_all_with_counts(session, user_id)
        responses = []
        for cat, count in rows:
            responses.append(
                CategoryResponse(
                    id=cat.id,
                    name=cat.name,
                    is_system=cat.is_system,
                    expense_count=count,
                    created_at=cat.created_at,
                    updated_at=cat.updated_at,
                )
            )
        return responses

    async def create_category(
        self, session: AsyncSession, data: CategoryCreate, user_id: uuid.UUID
    ) -> CategoryResponse:
        """Create a new custom category for the user (FR-6)."""
        existing = await self.category_repo.get_by_name(session, data.name, user_id)
        if existing:
            raise ConflictException(
                message=f"Category '{data.name}' already exists",
                field="name",
            )

        category = Category(
            user_id=user_id,
            name=data.name,
            is_system=False,
        )
        created = await self.category_repo.create(session, category)
        await session.commit()

        return CategoryResponse(
            id=created.id,
            name=created.name,
            is_system=created.is_system,
            expense_count=0,
            created_at=created.created_at,
            updated_at=created.updated_at,
        )

    async def update_category(
        self,
        session: AsyncSession,
        category_id: uuid.UUID,
        data: CategoryUpdate,
        user_id: uuid.UUID,
    ) -> CategoryResponse:
        """Rename an existing category (FR-7). Blocked if is_system=True."""
        category = await self.category_repo.get_by_id(session, category_id, user_id)
        if not category:
            raise NotFoundException(message="Category not found", field="id")

        if category.is_system:
            raise ConflictException(
                message="System categories cannot be renamed",
                field="name",
            )

        # Check duplicate name with another category belonging to the same user
        existing = await self.category_repo.get_by_name(session, data.name, user_id)
        if existing and existing.id != category_id:
            raise ConflictException(
                message=f"Category '{data.name}' already exists",
                field="name",
            )

        category.name = data.name
        updated = await self.category_repo.update(session, category)
        count = await self.category_repo.count_expenses(session, category_id, user_id)
        await session.commit()

        return CategoryResponse(
            id=updated.id,
            name=updated.name,
            is_system=updated.is_system,
            expense_count=count,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )

    async def delete_category(
        self, session: AsyncSession, category_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        """Delete category and reassign all linked expenses to 'Uncategorized' (FR-8)."""
        category = await self.category_repo.get_by_id(session, category_id, user_id)
        if not category:
            raise NotFoundException(message="Category not found", field="id")

        if category.is_system or category.name.lower() == "uncategorized":
            raise ConflictException(
                message="System categories (including 'Uncategorized') cannot be deleted",
                field="id",
            )

        # Locate user's Uncategorized category
        uncategorized = await self.category_repo.get_by_name(session, "Uncategorized", user_id)
        if not uncategorized:
            uncategorized = Category(
                user_id=user_id,
                name="Uncategorized",
                is_system=True,
            )
            uncategorized = await self.category_repo.create(session, uncategorized)

        # Transaction: reassign user's expenses to Uncategorized, then delete category
        await self.expense_repo.reassign_category(
            session,
            old_category_id=category_id,
            new_category_id=uncategorized.id,
            user_id=user_id,
        )
        await self.category_repo.delete(session, category)
        await session.commit()

    async def get_expense_count(
        self, session: AsyncSession, category_id: uuid.UUID, user_id: uuid.UUID
    ) -> CategoryExpenseCountResponse:
        """Get count of expenses using this category for confirmation preview (FR-8 UX)."""
        category = await self.category_repo.get_by_id(session, category_id, user_id)
        if not category:
            raise NotFoundException(message="Category not found", field="id")

        count = await self.category_repo.count_expenses(session, category_id, user_id)
        return CategoryExpenseCountResponse(
            category_id=category_id, expense_count=count
        )
