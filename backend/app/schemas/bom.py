from decimal import Decimal

from pydantic import Field

from app.schemas.common import OrmModel


class BomLineCreate(OrmModel):
    material_id: int
    quantity_required: Decimal = Field(gt=0)


class BomReplace(OrmModel):
    lines: list[BomLineCreate] = Field(min_length=1)


class BomItemRead(OrmModel):
    id: int
    product_id: int
    material_id: int
    quantity_required: Decimal
