import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.user import User


class Expense(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "expenses"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    expense_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    payment_mode: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="expenses",
    )
    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="expenses",
    )

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_expense_amount_positive"),
        CheckConstraint(
            "expense_date <= CURRENT_DATE",
            name="check_expense_date_not_future",
        ),
        CheckConstraint(
            "payment_mode IS NULL OR payment_mode IN ('cash', 'card', 'upi', 'other')",
            name="check_expense_payment_mode_valid",
        ),
        Index("idx_expenses_user_id", "user_id"),
        Index("idx_expenses_category_id", "category_id"),
        Index("idx_expenses_expense_date", "expense_date"),
        Index("idx_expenses_title", "title"),
        Index("idx_expenses_user_date_category", "user_id", "expense_date", "category_id"),
    )
