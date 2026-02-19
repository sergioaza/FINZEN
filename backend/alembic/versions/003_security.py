"""Security hardening: email verification, revoked tokens, audit logs

Revision ID: 003
Revises: 002
Create Date: 2026-02-18

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add security columns to users table
    # server_default=true so existing users are already verified
    op.add_column("users", sa.Column(
        "email_verified", sa.Boolean(),
        server_default=sa.text("true"), nullable=False
    ))
    op.add_column("users", sa.Column("email_verify_token", sa.String(), nullable=True))
    op.add_column("users", sa.Column("reset_token", sa.String(), nullable=True))
    op.add_column("users", sa.Column("reset_token_expires", sa.DateTime(), nullable=True))

    op.create_table(
        "revoked_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("jti", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("ip", sa.String(), nullable=True),
        sa.Column("details", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("revoked_tokens")
    op.drop_column("users", "reset_token_expires")
    op.drop_column("users", "reset_token")
    op.drop_column("users", "email_verify_token")
    op.drop_column("users", "email_verified")
