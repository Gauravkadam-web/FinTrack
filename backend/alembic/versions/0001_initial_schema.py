"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-08-26 23:25:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── 1. categories table ───
    op.create_table(
        "categories",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column(
            "is_system",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_categories_name"),
    )
    op.create_index("ix_categories_name", "categories", ["name"], unique=True)

    # ─── 2. expenses table ───
    op.create_table(
        "expenses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=50), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("payment_mode", sa.String(length=20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            name="fk_expenses_category_id",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("amount > 0", name="check_expense_amount_positive"),
        sa.CheckConstraint(
            "expense_date <= CURRENT_DATE",
            name="check_expense_date_not_future",
        ),
        sa.CheckConstraint(
            "payment_mode IS NULL OR payment_mode IN ('cash', 'card', 'upi', 'other')",
            name="check_expense_payment_mode_valid",
        ),
    )
    op.create_index("idx_expenses_category_id", "expenses", ["category_id"])
    op.create_index("idx_expenses_expense_date", "expenses", ["expense_date"])
    op.create_index("idx_expenses_title", "expenses", ["title"])
    op.create_index(
        "idx_expenses_date_category",
        "expenses",
        ["expense_date", "category_id"],
    )

    # ─── 3. budgets table ───
    op.create_table(
        "budgets",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("period_month", sa.Date(), nullable=False),
        sa.Column("limit_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            name="fk_budgets_category_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "limit_amount > 0",
            name="check_budget_limit_amount_positive",
        ),
        sa.UniqueConstraint(
            "category_id",
            "period_month",
            name="uq_budget_category_period",
        ),
    )


def downgrade() -> None:
    op.drop_table("budgets")
    op.drop_index("idx_expenses_date_category", table_name="expenses")
    op.drop_index("idx_expenses_title", table_name="expenses")
    op.drop_index("idx_expenses_expense_date", table_name="expenses")
    op.drop_index("idx_expenses_category_id", table_name="expenses")
    op.drop_table("expenses")
    op.drop_index("ix_categories_name", table_name="categories")
    op.drop_table("categories")
