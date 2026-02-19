"""Savings goals

Revision ID: 002
Revises: 001
Create Date: 2026-02-18

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "savings_goals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("target_amount", sa.Float(), nullable=False),
        sa.Column("current_amount", sa.Float(), default=0.0),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("description", sa.String(), default=""),
        sa.Column("color", sa.String(), default="#6366f1"),
        sa.Column("status", sa.Enum("active", "completed", name="goalstatus"), default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "goal_contributions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("goal_id", sa.Integer(), sa.ForeignKey("savings_goals.id"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("notes", sa.String(), default=""),
    )


def downgrade() -> None:
    op.drop_table("goal_contributions")
    op.drop_table("savings_goals")
    op.execute("DROP TYPE IF EXISTS goalstatus")
