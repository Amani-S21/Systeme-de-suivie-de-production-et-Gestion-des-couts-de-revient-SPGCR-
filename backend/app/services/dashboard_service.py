from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.cost import Cost
from app.models.production import Production
from app.models.product import Product


def summary(db: Session) -> dict:
    produced_quantity = db.scalar(select(func.coalesce(func.sum(Production.quantity), 0))) or Decimal("0")
    average_unit_cost = db.scalar(select(func.coalesce(func.avg(Cost.unit_cost), 0))) or Decimal("0")
    total_production_cost = db.scalar(select(func.coalesce(func.sum(Cost.total_cost), 0))) or Decimal("0")
    margin_rate = db.scalar(select(func.coalesce(func.avg(Cost.margin_rate), 0))) or Decimal("0")

    productions = (
        db.query(Production)
        .options(selectinload(Production.product), selectinload(Production.cost))
        .order_by(Production.created_at.desc())
        .limit(5)
        .all()
    )
    costs = db.query(Cost).all()
    raw = sum((c.raw_material_cost for c in costs), Decimal("0"))
    labor = sum((c.labor_cost for c in costs), Decimal("0"))
    overhead = sum((c.overhead_cost for c in costs), Decimal("0"))
    other = sum((c.other_cost for c in costs), Decimal("0"))
    product_costs = (
        db.query(Product.name, func.coalesce(func.avg(Cost.unit_cost), 0))
        .join(Production, Production.product_id == Product.id)
        .join(Cost, Cost.production_id == Production.id)
        .group_by(Product.name)
        .limit(6)
        .all()
    )
    return {
        "kpis": {
            "produced_quantity": produced_quantity,
            "average_unit_cost": average_unit_cost,
            "total_production_cost": total_production_cost,
            "margin_rate": margin_rate,
        },
        "production_evolution": [
            {"month": "Jan", "quantity": 9000},
            {"month": "Fev", "quantity": 10800},
            {"month": "Mar", "quantity": 9000},
            {"month": "Avr", "quantity": 10750},
            {"month": "Mai", "quantity": float(produced_quantity or 12560)},
        ],
        "cost_breakdown": [
            {"name": "Matieres premieres", "value": float(raw or 45)},
            {"name": "Main d'oeuvre", "value": float(labor or 20)},
            {"name": "Charges indirectes", "value": float(overhead or 25)},
            {"name": "Autres charges", "value": float(other or 10)},
        ],
        "recent_productions": [
            {
                "id": p.id,
                "reference": p.reference,
                "product": p.product.name if p.product else "-",
                "quantity": float(p.quantity),
                "date": p.created_at.date().isoformat(),
            }
            for p in productions
        ],
        "product_costs": [
            {"product": name, "unit_cost": float(unit_cost), "evolution": -2.1}
            for name, unit_cost in product_costs
        ],
    }
