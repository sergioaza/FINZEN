"""recurring_expenses debt_id link

Revision ID: 008
Revises: 007
Create Date: 2026-03-06

Vincula gastos recurrentes a deudas: al pagar el recurrente se abona
automáticamente a la deuda vinculada.
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "recurring_expenses",
        sa.Column(
            "debt_id",
            sa.Integer,
            sa.ForeignKey("debts.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column("recurring_expenses", "debt_id")
