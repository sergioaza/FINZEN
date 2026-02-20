"""Credit limit in accounts + savings goals v2 (wishlist model)

Revision ID: 004
Revises: 003
Create Date: 2026-02-19

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Feature 2: credit_limit en accounts ──────────────────────────────────
    op.add_column("accounts", sa.Column("credit_limit", sa.Float(), nullable=True))

    # ── Feature 3: savings_goals reestructurado ───────────────────────────────

    # Migrar saldo actual a contribuciones antes de borrar current_amount
    op.execute("""
        INSERT INTO goal_contributions (goal_id, amount, date, notes)
        SELECT id, current_amount, created_at, 'Saldo migrado'
        FROM savings_goals
        WHERE current_amount > 0
    """)

    # Añadir is_quota_payment a goal_contributions
    op.add_column(
        "goal_contributions",
        sa.Column("is_quota_payment", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )

    # Añadir quota_amount y frequency a savings_goals
    op.add_column(
        "savings_goals",
        sa.Column("quota_amount", sa.Float(), server_default="0", nullable=False),
    )

    # Crear nuevo enum wishliststatus
    op.execute("CREATE TYPE wishliststatus AS ENUM ('active', 'achieved')")

    # Añadir nueva columna status_new con el nuevo tipo
    op.add_column(
        "savings_goals",
        sa.Column("status_new", sa.Enum("active", "achieved", name="wishliststatus"), nullable=True),
    )

    # Migrar valores: completed → achieved, active → active
    op.execute("""
        UPDATE savings_goals
        SET status_new = CASE
            WHEN status::text = 'completed' THEN 'achieved'::wishliststatus
            ELSE status::text::wishliststatus
        END
    """)

    # Hacer status_new NOT NULL
    op.alter_column("savings_goals", "status_new", nullable=False)

    # Eliminar columna antigua y renombrar
    op.drop_column("savings_goals", "status")
    op.alter_column("savings_goals", "status_new", new_column_name="status")

    # Eliminar el tipo antiguo
    op.execute("DROP TYPE IF EXISTS goalstatus")

    # Añadir frequency como varchar (luego se crea el enum)
    op.execute("CREATE TYPE wishlistfrequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly')")
    op.add_column(
        "savings_goals",
        sa.Column(
            "frequency",
            sa.Enum("daily", "weekly", "biweekly", "monthly", name="wishlistfrequency"),
            server_default="monthly",
            nullable=False,
        ),
    )

    # Eliminar columnas obsoletas
    op.drop_column("savings_goals", "current_amount")
    op.drop_column("savings_goals", "target_date")


def downgrade() -> None:
    # Restaurar target_date y current_amount
    op.add_column("savings_goals", sa.Column("target_date", sa.Date(), nullable=True))
    op.add_column(
        "savings_goals",
        sa.Column("current_amount", sa.Float(), server_default="0", nullable=False),
    )

    # Recalcular current_amount desde contribuciones
    op.execute("""
        UPDATE savings_goals sg
        SET current_amount = COALESCE((
            SELECT SUM(gc.amount) FROM goal_contributions gc WHERE gc.goal_id = sg.id
        ), 0)
    """)

    # Eliminar frequency
    op.drop_column("savings_goals", "frequency")
    op.execute("DROP TYPE IF EXISTS wishlistfrequency")

    # Restaurar enum goalstatus y columna status
    op.execute("CREATE TYPE goalstatus AS ENUM ('active', 'completed')")
    op.add_column(
        "savings_goals",
        sa.Column("status_old", sa.Enum("active", "completed", name="goalstatus"), nullable=True),
    )
    op.execute("""
        UPDATE savings_goals
        SET status_old = CASE
            WHEN status::text = 'achieved' THEN 'completed'::goalstatus
            ELSE status::text::goalstatus
        END
    """)
    op.alter_column("savings_goals", "status_old", nullable=False)
    op.drop_column("savings_goals", "status")
    op.alter_column("savings_goals", "status_old", new_column_name="status")
    op.execute("DROP TYPE IF EXISTS wishliststatus")

    # Eliminar quota_amount e is_quota_payment
    op.drop_column("savings_goals", "quota_amount")
    op.drop_column("goal_contributions", "is_quota_payment")

    # Eliminar credit_limit
    op.drop_column("accounts", "credit_limit")
