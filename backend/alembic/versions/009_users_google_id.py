"""users google_id

Revision ID: 009
Revises: 008
Create Date: 2026-03-06

Agrega google_id a usuarios para login con Google OAuth.
"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("google_id", sa.String, nullable=True),
    )
    op.create_unique_constraint("uq_users_google_id", "users", ["google_id"])


def downgrade():
    op.drop_constraint("uq_users_google_id", "users", type_="unique")
    op.drop_column("users", "google_id")
