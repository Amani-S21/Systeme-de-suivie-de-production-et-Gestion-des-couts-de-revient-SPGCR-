from datetime import datetime
from decimal import Decimal

from app.schemas.common import OrmModel


class CostCreate(OrmModel):
    labor_cost: Decimal = Decimal("0")
    overhead_cost: Decimal = Decimal("0")
    other_cost: Decimal = Decimal("0")


class CostRead(OrmModel):
    id: int
    production_id: int
    raw_material_cost: Decimal
    labor_cost: Decimal
    overhead_cost: Decimal
    other_cost: Decimal
    total_cost: Decimal
    unit_cost: Decimal
    margin_rate: Decimal
    calculated_at: datetime
