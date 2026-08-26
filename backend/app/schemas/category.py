import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Category name (max 50 chars)",
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Category name cannot be empty or whitespace only")
        if len(trimmed) > 50:
            raise ValueError("Category name cannot exceed 50 characters")
        return trimmed


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_system: bool
    expense_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryExpenseCountResponse(BaseModel):
    category_id: uuid.UUID
    expense_count: int
