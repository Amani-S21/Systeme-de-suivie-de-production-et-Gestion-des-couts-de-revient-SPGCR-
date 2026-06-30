from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.models.enums import ProductionStatus
from app.schemas.common import OrmModel
from app.schemas.cost import CostRead
from app.schemas.product import ProductRead


class ProductionMaterialIn(OrmModel):
    material_id: int
    quantity_used: Decimal = Field(gt=0)


class ProductionCreate(OrmModel):
    product_id: int
    operator_id: int | None = None
    quantity: Decimal = Field(gt=0)
    status: ProductionStatus = ProductionStatus.planifiee
    materials: list[ProductionMaterialIn] = Field(default_factory=list)
    confirm_below_minimum_stock: bool = False


class ProductionUpdate(OrmModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    status: ProductionStatus | None = None


class ProductionRead(OrmModel):
    id: int
    reference: str
    product_id: int
    operator_id: int | None = None
    quantity: Decimal
    status: ProductionStatus
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    product: ProductRead | None = None
    cost: CostRead | None = None
