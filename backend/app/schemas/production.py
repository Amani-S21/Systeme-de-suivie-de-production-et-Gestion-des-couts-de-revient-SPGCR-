from datetime import datetime
from decimal import Decimal

from app.models.enums import ProductionStatus
from app.schemas.common import OrmModel
from app.schemas.product import ProductRead


class ProductionMaterialIn(OrmModel):
    material_id: int
    quantity_used: Decimal


class ProductionCreate(OrmModel):
    product_id: int
    operator_id: int | None = None
    quantity: Decimal
    status: ProductionStatus = ProductionStatus.planifiee
    materials: list[ProductionMaterialIn] = []


class ProductionUpdate(OrmModel):
    quantity: Decimal | None = None
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
