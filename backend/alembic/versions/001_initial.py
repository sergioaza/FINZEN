"""Initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("onboarding_done", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.Enum("debit", "credit", name="accounttype"), nullable=False),
        sa.Column("account_subtype", sa.Enum("cash", "savings", "checking", "digital", "credit_card", name="accountsubtype"), nullable=False),
        sa.Column("balance", sa.Float(), default=0.0),
        sa.Column("color", sa.String(), default="#3B82F6"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.Enum("income", "expense", name="categorytype"), nullable=False),
        sa.Column("color", sa.String(), default="#6B7280"),
        sa.Column("icon", sa.String(), default="tag"),
        sa.Column("is_default", sa.Boolean(), default=False),
    )

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("type", sa.Enum("income", "expense", name="transactiontype"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("description", sa.String(), default=""),
        sa.Column("transfer_pair_id", sa.Integer(), sa.ForeignKey("transactions.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "budgets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("limit_amount", sa.Float(), nullable=False),
    )

    op.create_table(
        "recurring_expenses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("frequency", sa.Enum("daily", "weekly", "biweekly", "monthly", "yearly", name="frequency"), nullable=False),
        sa.Column("day_of_charge", sa.Integer(), nullable=False),
        sa.Column("next_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "recurring_payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recurring_expense_id", sa.Integer(), sa.ForeignKey("recurring_expenses.id"), nullable=False),
        sa.Column("paid_date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
    )

    op.create_table(
        "debts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("counterpart_name", sa.String(), nullable=False),
        sa.Column("original_amount", sa.Float(), nullable=False),
        sa.Column("remaining_amount", sa.Float(), nullable=False),
        sa.Column("type", sa.Enum("owe", "owed", name="debttype"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("description", sa.String(), default=""),
        sa.Column("status", sa.Enum("active", "paid", name="debtstatus"), default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "debt_payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("debt_id", sa.Integer(), sa.ForeignKey("debts.id"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("notes", sa.String(), default=""),
    )


def downgrade() -> None:
    op.drop_table("debt_payments")
    op.drop_table("debts")
    op.drop_table("recurring_payments")
    op.drop_table("recurring_expenses")
    op.drop_table("budgets")
    op.drop_table("transactions")
    op.drop_table("categories")
    op.drop_table("accounts")
    op.drop_table("users")
