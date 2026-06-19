"""add bom items

Revision ID: 202606190001
Revises: 202606180001
"""
from alembic import op
import sqlalchemy as sa

revision = "202606190001"
down_revision = "202606180001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bom_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("material_id", sa.Integer(), sa.ForeignKey("materials.id"), nullable=False),
        sa.Column("quantity_required", sa.Numeric(14, 3), nullable=False),
        sa.UniqueConstraint("product_id", "material_id", name="uq_bom_product_material"),
    )


def downgrade() -> None:
    op.drop_table("bom_items")
