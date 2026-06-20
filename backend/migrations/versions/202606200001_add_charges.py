"""add charges

Revision ID: 202606200001
Revises: 202606190002
"""
from alembic import op
import sqlalchemy as sa

revision = "202606200001"
down_revision = "202606190002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "charges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("label", sa.String(length=180), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("charge_date", sa.Date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_charges_date", "charges", ["charge_date"])
    op.create_index("ix_charges_category", "charges", ["category"])


def downgrade() -> None:
    op.drop_index("ix_charges_category", table_name="charges")
    op.drop_index("ix_charges_date", table_name="charges")
    op.drop_table("charges")
