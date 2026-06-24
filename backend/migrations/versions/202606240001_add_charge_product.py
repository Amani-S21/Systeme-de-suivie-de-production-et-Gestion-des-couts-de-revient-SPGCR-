"""add charge product

Revision ID: 202606240001
Revises: 202606200002
"""
from alembic import op
import sqlalchemy as sa

revision = "202606240001"
down_revision = "202606200002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("charges", sa.Column("product_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_charges_product", "charges", "products", ["product_id"], ["id"])
    op.create_index("ix_charges_product_id", "charges", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_charges_product_id", table_name="charges")
    op.drop_constraint("fk_charges_product", "charges", type_="foreignkey")
    op.drop_column("charges", "product_id")
