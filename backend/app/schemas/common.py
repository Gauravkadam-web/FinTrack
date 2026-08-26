from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number starting from 1")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page (1-100)")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    limit: int
    total_count: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
