import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Numeric,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.category import Category


class Budget(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "budgets"

    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=True,
    )
    period_month: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    limit_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Relationships
    category: Mapped[Optional["Category"]] = relationship(
        "Category",
        back_populates="budgets",
    )

    __table_args__ = (
        CheckConstraint(
            "limit_amount > 0",
            name="check_budget_limit_amount_positive",
        ),
        UniqueConstraint(
            "category_id",
            "period_month",
            name="uq_budget_category_period",
        ),
    )
