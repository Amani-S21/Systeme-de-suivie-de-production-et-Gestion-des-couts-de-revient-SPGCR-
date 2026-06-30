from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MovementType


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), default="kg", nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    minimum_stock: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    movements = relationship("StockMovement", back_populates="material")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id"), nullable=False)
    movement_type: Mapped[MovementType] = mapped_column(
        Enum(MovementType, name="movementtype"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    material = relationship("Material", back_populates="movements")
