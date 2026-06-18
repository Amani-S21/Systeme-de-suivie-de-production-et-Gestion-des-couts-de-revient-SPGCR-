"""initial schema"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "202606170001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    role_enum = postgresql.ENUM("admin_msd", "responsable_production", "operateur_usine", name="userrole", create_type=False)
    status_enum = postgresql.ENUM("planifiee", "en_cours", "terminee", "annulee", name="productionstatus", create_type=False)
    movement_enum = postgresql.ENUM("entree", "sortie", "ajustement", name="movementtype", create_type=False)
    postgresql.ENUM("admin_msd", "responsable_production", "operateur_usine", name="userrole").create(op.get_bind(), checkfirst=True)
    postgresql.ENUM("planifiee", "en_cours", "terminee", "annulee", name="productionstatus").create(op.get_bind(), checkfirst=True)
    postgresql.ENUM("entree", "sortie", "ajustement", name="movementtype").create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("login", sa.String(120), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(120), nullable=False),
        sa.Column("last_name", sa.String(120), nullable=False),
        sa.Column("role", role_enum, nullable=False, server_default="operateur_usine"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "materials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False, unique=True),
        sa.Column("unit", sa.String(30), nullable=False, server_default="kg"),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False, server_default="0"),
        sa.Column("unit_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("minimum_stock", sa.Numeric(14, 3), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False, unique=True),
        sa.Column("sku", sa.String(80), nullable=False, unique=True),
        sa.Column("unit", sa.String(30), nullable=False, server_default="unite"),
        sa.Column("sale_price", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "productions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reference", sa.String(80), nullable=False, unique=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False),
        sa.Column("status", status_enum, nullable=False, server_default="planifiee"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "production_materials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("production_id", sa.Integer(), sa.ForeignKey("productions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("material_id", sa.Integer(), sa.ForeignKey("materials.id"), nullable=False),
        sa.Column("quantity_used", sa.Numeric(14, 3), nullable=False),
        sa.Column("unit_cost", sa.Numeric(14, 2), nullable=False),
    )
    op.create_table(
        "costs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("production_id", sa.Integer(), sa.ForeignKey("productions.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("raw_material_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("labor_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("overhead_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("other_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("total_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("unit_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("margin_rate", sa.Numeric(7, 2), nullable=False, server_default="0"),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "stock_movements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("material_id", sa.Integer(), sa.ForeignKey("materials.id"), nullable=False),
        sa.Column("movement_type", movement_enum, nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False),
        sa.Column("reason", sa.String(255), nullable=False),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("entity", sa.String(120), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    for table in [
        "audit_logs",
        "stock_movements",
        "costs",
        "production_materials",
        "productions",
        "products",
        "materials",
        "users",
    ]:
        op.drop_table(table)
    sa.Enum(name="movementtype").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="productionstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
