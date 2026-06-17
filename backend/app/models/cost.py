from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Cost(Base):
    __tablename__ = "costs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    production_id: Mapped[int] = mapped_column(ForeignKey("productions.id", ondelete="CASCADE"), unique=True, nullable=False)
    raw_material_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    labor_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    overhead_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    other_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    margin_rate: Mapped[Decimal] = mapped_column(Numeric(7, 2), default=0, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    production = relationship("Production", back_populates="cost")
