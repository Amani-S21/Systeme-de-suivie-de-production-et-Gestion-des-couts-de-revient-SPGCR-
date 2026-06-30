from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import OrmModel


class MaterialBase(OrmModel):
    code: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    unit: str = "kg"
    quantity: Decimal = Decimal("0")
    unit_cost: Decimal = Decimal("0")
    minimum_stock: Decimal = Decimal("0")


class MaterialCreate(MaterialBase):
    quantity: Decimal = Field(default=Decimal("0"), ge=0)
    unit_cost: Decimal = Field(default=Decimal("0"), ge=0)
    minimum_stock: Decimal = Field(gt=0)


class MaterialUpdate(OrmModel):
    code: str | None = None
    name: str | None = None
    unit: str | None = None
    quantity: Decimal | None = Field(default=None, ge=0)
    unit_cost: Decimal | None = Field(default=None, ge=0)
    minimum_stock: Decimal | None = Field(default=None, gt=0)


class MaterialRead(MaterialBase):
    id: int
    created_at: datetime


class StockMovementCreate(OrmModel):
    movement_type: str
    quantity: Decimal = Field(gt=0)
    reason: str
