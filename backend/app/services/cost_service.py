from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.cost import Cost
from app.models.production import Production
from app.schemas.cost import CostCreate
from app.services.production_service import ensure_material_consumption, raw_material_total


def calculate_margin_rate(sale_price: Decimal, unit_cost: Decimal) -> Decimal:
    if sale_price <= 0 or unit_cost <= 0:
        return Decimal("0")
    return ((sale_price - unit_cost) / unit_cost) * 100


def calculate_cost(db: Session, production_id: int, payload: CostCreate, user_id: int | None = None) -> Cost:
    production = (
        db.query(Production)
        .options(selectinload(Production.materials), selectinload(Production.product))
        .filter(Production.id == production_id)
        .first()
    )
    if not production:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production introuvable")
    ensure_material_consumption(
        db,
        production,
        requested_materials=[],
        created_by_id=user_id,
        confirm_below_minimum_stock=True,
    )
    raw = raw_material_total(production)
    total = raw + payload.labor_cost + payload.overhead_cost + payload.other_cost
    unit_cost = total / production.quantity if production.quantity else Decimal("0")
    sale_price = production.product.sale_price if production.product else Decimal("0")
    margin_rate = calculate_margin_rate(sale_price, unit_cost)
    cost = db.scalar(select(Cost).where(Cost.production_id == production.id))
    if cost is None:
        cost = Cost(production_id=production.id)
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
