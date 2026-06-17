from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.cost import Cost
from app.models.production import Production
from app.schemas.cost import CostCreate
from app.services.production_service import raw_material_total


def calculate_cost(db: Session, production_id: int, payload: CostCreate) -> Cost:
    production = (
        db.query(Production)
        .options(selectinload(Production.materials), selectinload(Production.product))
        .filter(Production.id == production_id)
        .first()
    )
    if not production:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production introuvable")
    raw = raw_material_total(production)
    total = raw + payload.labor_cost + payload.overhead_cost + payload.other_cost
    unit_cost = total / production.quantity if production.quantity else Decimal("0")
    sale_price = production.product.sale_price if production.product else Decimal("0")
    margin_rate = ((sale_price - unit_cost) / sale_price * 100) if sale_price else Decimal("0")
    cost = production.cost or Cost(production_id=production.id)
    cost.raw_material_cost = raw
    cost.labor_cost = payload.labor_cost
    cost.overhead_cost = payload.overhead_cost
    cost.other_cost = payload.other_cost
    cost.total_cost = total
    cost.unit_cost = unit_cost
    cost.margin_rate = margin_rate
    db.add(cost)
    db.flush()
    return cost
