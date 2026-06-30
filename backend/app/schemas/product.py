from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import OrmModel


class ProductBase(OrmModel):
    name: str = Field(min_length=1, max_length=160)
    sku: str = Field(min_length=1, max_length=80)
    unit: str = "unite"
    sale_price: Decimal = Decimal("0")


class ProductCreate(ProductBase):
    sale_price: Decimal = Field(gt=0)


class ProductUpdate(OrmModel):
    name: str | None = None
    sku: str | None = None
    unit: str | None = None
    sale_price: Decimal | None = Field(default=None, gt=0)


class ProductRead(ProductBase):
    id: int
    created_at: datetime
