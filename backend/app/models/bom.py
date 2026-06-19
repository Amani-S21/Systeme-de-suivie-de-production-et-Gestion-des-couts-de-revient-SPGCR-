from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BomItem(Base):
    __tablename__ = "bom_items"
    __table_args__ = (UniqueConstraint("product_id", "material_id", name="uq_bom_product_material"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id"), nullable=False)
    quantity_required: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)

    product = relationship("Product", back_populates="bom_items")
    material = relationship("Material")
