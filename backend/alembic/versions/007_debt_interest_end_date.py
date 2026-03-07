"""debt interest_rate and estimated_end_date

Revision ID: 007
Revises: 006
Create Date: 2026-03-06

Agrega tasa de interés mensual y fecha estimada de finalización a las deudas.
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("debts", sa.Column("interest_rate", sa.Float, nullable=True))
    op.add_column("debts", sa.Column("estimated_end_date", sa.Date, nullable=True))


def downgrade():
    op.drop_column("debts", "estimated_end_date")
    op.drop_column("debts", "interest_rate")
