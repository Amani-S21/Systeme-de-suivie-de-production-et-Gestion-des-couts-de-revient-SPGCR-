"""add material code

Revision ID: 202606190002
Revises: 202606190001
"""
from alembic import op
import sqlalchemy as sa

revision = "202606190002"
down_revision = "202606190001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("materials", sa.Column("code", sa.String(length=80), nullable=True))
    op.execute("UPDATE materials SET code = 'CMP-' || lpad(id::text, 4, '0') WHERE code IS NULL")
    op.alter_column("materials", "code", nullable=False)
    op.create_unique_constraint("uq_materials_code", "materials", ["code"])


def downgrade() -> None:
    op.drop_constraint("uq_materials_code", "materials", type_="unique")
    op.drop_column("materials", "code")
