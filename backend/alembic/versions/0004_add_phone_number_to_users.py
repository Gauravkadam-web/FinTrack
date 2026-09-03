"""add phone_number and phone_verified to users

Revision ID: 0004_add_phone_number_to_users
Revises: 0003_add_auth_and_user_scoping
Create Date: 2026-09-03 15:47:00.000000

"""

from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0004_add_phone_number_to_users"
down_revision: Union[str, None] = "0003_add_auth_and_user_scoping"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("phone_number", sa.String(length=20), nullable=True),
    )
    op.create_index(
        "ix_users_phone_number",
        "users",
        ["phone_number"],
        unique=True,
    )
    op.add_column(
        "users",
        sa.Column(
            "phone_verified",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "phone_verified")
    op.drop_index("ix_users_phone_number", table_name="users")
    op.drop_column("users", "phone_number")
