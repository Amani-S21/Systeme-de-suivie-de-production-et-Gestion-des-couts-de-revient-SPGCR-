"""add user login

Revision ID: 202606180001
Revises: 202606170001
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa

revision = "202606180001"
down_revision = "202606170001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("login", sa.String(length=120), nullable=True))
    op.execute("UPDATE users SET login = lower(split_part(email, '@', 1)) WHERE login IS NULL")
    op.alter_column("users", "login", nullable=False)
    op.create_index(op.f("ix_users_login"), "users", ["login"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_login"), table_name="users")
    op.drop_column("users", "login")
