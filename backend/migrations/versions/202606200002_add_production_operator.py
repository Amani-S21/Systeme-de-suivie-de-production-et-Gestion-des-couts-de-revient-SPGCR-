"""add production operator

Revision ID: 202606200002
Revises: 202606200001
"""
from alembic import op
import sqlalchemy as sa

revision = "202606200002"
down_revision = "202606200001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("productions", sa.Column("operator_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_productions_operator", "productions", "users", ["operator_id"], ["id"])
    op.create_index("ix_productions_operator_id", "productions", ["operator_id"])


def downgrade() -> None:
    op.drop_index("ix_productions_operator_id", table_name="productions")
    op.drop_constraint("fk_productions_operator", "productions", type_="foreignkey")
    op.drop_column("productions", "operator_id")
