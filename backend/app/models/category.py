from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.budget import Budget
    from app.models.expense import Expense


class Category(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense",
        back_populates="category",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    budgets: Mapped[List["Budget"]] = relationship(
        "Budget",
        back_populates="category",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
