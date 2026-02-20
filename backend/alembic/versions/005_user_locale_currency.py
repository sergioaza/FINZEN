"""User locale, country and currency preferences

Revision ID: 005
Revises: 004
Create Date: 2026-02-19

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("locale", sa.String(), server_default="es", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("country", sa.String(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("currency", sa.String(), server_default="COP", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "currency")
    op.drop_column("users", "country")
    op.drop_column("users", "locale")
