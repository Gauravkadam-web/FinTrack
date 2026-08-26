"""seed categories

Revision ID: 0002_seed_categories
Revises: 0001_initial_schema
Create Date: 2026-08-26 23:25:30.000000

"""

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import column, table

from alembic import op

revision: str = "0002_seed_categories"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Categories definition table representation
categories_table = table(
    "categories",
    column("id", UUID(as_uuid=True)),
    column("name", sa.String),
    column("is_system", sa.Boolean),
)

STARTER_CATEGORIES = [
    {"name": "Uncategorized", "is_system": True},
    {"name": "Food", "is_system": False},
    {"name": "Transport", "is_system": False},
    {"name": "Rent", "is_system": False},
    {"name": "Utilities", "is_system": False},
    {"name": "Entertainment", "is_system": False},
    {"name": "Shopping", "is_system": False},
    {"name": "Healthcare", "is_system": False},
    {"name": "Other", "is_system": False},
]


def upgrade() -> None:
    bind = op.get_bind()

    # Idempotent insert: only insert categories that don't already exist
    for cat in STARTER_CATEGORIES:
        existing = bind.execute(
            sa.text("SELECT id FROM categories WHERE name = :name"),
            {"name": cat["name"]},
        ).fetchone()

        if not existing:
            bind.execute(
                sa.text(
                    "INSERT INTO categories "
                    "(id, name, is_system, created_at, updated_at) "
                    "VALUES (:id, :name, :is_system, now(), now())"
                ),
                {
                    "id": str(uuid.uuid4()),
                    "name": cat["name"],
                    "is_system": cat["is_system"],
                },
            )


def downgrade() -> None:
    bind = op.get_bind()
    # On downgrade, remove seeded categories
    category_names = [cat["name"] for cat in STARTER_CATEGORIES]
    bind.execute(
        sa.text("DELETE FROM categories WHERE name IN :names"),
        {"names": tuple(category_names)},
    )
