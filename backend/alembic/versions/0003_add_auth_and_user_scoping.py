"""add auth and user scoping

Revision ID: 0003_add_auth_and_user_scoping
Revises: 0002_seed_categories
Create Date: 2026-08-31 19:50:00.000000

"""

import os
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003_add_auth_and_user_scoping"
down_revision: Union[str, None] = "0002_seed_categories"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # ─── 1. Create users table ───
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("google_id", sa.String(length=255), nullable=True),
        sa.Column(
            "email_verified",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
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
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("google_id", name="uq_users_google_id"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_google_id", "users", ["google_id"])

    # ─── 2. Create refresh_tokens table ───
    op.create_table(
        "refresh_tokens",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("device_info", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_refresh_tokens_user_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["replaced_by"],
            ["refresh_tokens.id"],
            name="fk_refresh_tokens_replaced_by",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("idx_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])

    # ─── 3. Add user_id column as NULLABLE to resource tables ───
    op.add_column(
        "categories",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "expenses",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "budgets",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # ─── 4. Backfill existing data with default owner user if data exists ───
    owner_email = os.getenv("MIGRATION_OWNER_EMAIL", "owner@fintrack.local")
    owner_row = bind.execute(
        sa.text("SELECT id FROM users WHERE email = :email"),
        {"email": owner_email},
    ).fetchone()

    if not owner_row:
        owner_id = str(uuid.uuid4())
        bind.execute(
            sa.text(
                "INSERT INTO users (id, email, display_name, email_verified, is_active, created_at, updated_at) "
                "VALUES (:id, :email, 'FinTrack Owner', true, true, now(), now())"
            ),
            {"id": owner_id, "email": owner_email},
        )
    else:
        owner_id = str(owner_row[0])

    # Assign all unassigned rows to the migration owner
    bind.execute(
        sa.text("UPDATE categories SET user_id = :owner_id WHERE user_id IS NULL"),
        {"owner_id": owner_id},
    )
    bind.execute(
        sa.text("UPDATE expenses SET user_id = :owner_id WHERE user_id IS NULL"),
        {"owner_id": owner_id},
    )
    bind.execute(
        sa.text("UPDATE budgets SET user_id = :owner_id WHERE user_id IS NULL"),
        {"owner_id": owner_id},
    )

    # ─── 5. Alter user_id to NOT NULL ───
    op.alter_column("categories", "user_id", nullable=False)
    op.alter_column("expenses", "user_id", nullable=False)
    op.alter_column("budgets", "user_id", nullable=False)

    # ─── 6. Add Foreign Key constraints and indexes ───
    op.create_foreign_key(
        "fk_categories_user_id",
        "categories",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_expenses_user_id",
        "expenses",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_budgets_user_id",
        "budgets",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_index("idx_categories_user_id", "categories", ["user_id"])
    op.create_index("idx_expenses_user_id", "expenses", ["user_id"])
    op.create_index("idx_budgets_user_id", "budgets", ["user_id"])

    # ─── 7. Update Uniqueness Constraints to be user-scoped ───
    try:
        op.drop_index("ix_categories_name", table_name="categories")
    except Exception:
        pass
    try:
        op.drop_constraint("uq_categories_name", "categories", type_="unique")
    except Exception:
        pass

    op.create_unique_constraint(
        "uq_categories_user_name",
        "categories",
        ["user_id", "name"],
    )

    try:
        op.drop_constraint("uq_budget_category_period", "budgets", type_="unique")
    except Exception:
        pass

    op.create_unique_constraint(
        "uq_budget_user_category_period",
        "budgets",
        ["user_id", "category_id", "period_month"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_budget_user_category_period", "budgets", type_="unique")
    op.create_unique_constraint(
        "uq_budget_category_period",
        "budgets",
        ["category_id", "period_month"],
    )

    op.drop_constraint("uq_categories_user_name", "categories", type_="unique")
    op.create_unique_constraint("uq_categories_name", "categories", ["name"])
    op.create_index("ix_categories_name", "categories", ["name"], unique=True)

    op.drop_index("idx_budgets_user_id", table_name="budgets")
    op.drop_index("idx_expenses_user_id", table_name="expenses")
    op.drop_index("idx_categories_user_id", table_name="categories")

    op.drop_constraint("fk_budgets_user_id", "budgets", type_="foreignkey")
    op.drop_constraint("fk_expenses_user_id", "expenses", type_="foreignkey")
    op.drop_constraint("fk_categories_user_id", "categories", type_="foreignkey")

    op.drop_column("budgets", "user_id")
    op.drop_column("expenses", "user_id")
    op.drop_column("categories", "user_id")

    op.drop_index("idx_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_index("idx_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")

    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
