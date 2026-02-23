"""debt account_id

Revision ID: 006
Revises: 005
Create Date: 2026-02-23

Guarda la cuenta de origen en deudas tipo "owed" (dinero prestado).
Permite revertir el saldo al eliminar y crear transacciones de trazabilidad.
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "debts",
        sa.Column(
            "account_id",
            sa.Integer,
            sa.ForeignKey("accounts.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column("debts", "account_id")
