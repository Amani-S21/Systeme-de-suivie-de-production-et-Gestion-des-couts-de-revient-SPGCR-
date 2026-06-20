from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.cost import Cost
from app.models.production import Production
from app.models.product import Product
from app.models.enums import UserRole
from app.models.user import User


MONTH_LABELS = {
    1: "Jan", 2: "Fev", 3: "Mar", 4: "Avr", 5: "Mai", 6: "Juin",
    7: "Juil", 8: "Aout", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}


def summary(db: Session, user: User, date_from: date | None = None, date_to: date | None = None) -> dict:
    production_filters = [Production.status != "annulee"]
    all_status_filters = []
    if user.role == UserRole.operateur_usine:
        scope = or_(Production.operator_id == user.id, Production.created_by_id == user.id)
        production_filters.append(scope)
        all_status_filters.append(scope)
    if date_from:
        start = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
        production_filters.append(Production.created_at >= start)
        all_status_filters.append(Production.created_at >= start)
    if date_to:
        end = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=timezone.utc)
        production_filters.append(Production.created_at < end)
        all_status_filters.append(Production.created_at < end)

    produced_quantity = db.scalar(
        select(func.coalesce(func.sum(Production.quantity), 0)).where(*production_filters)
    ) or Decimal("0")
    average_unit_cost = db.scalar(
        select(func.coalesce(func.avg(Cost.unit_cost), 0))
        .join(Production, Production.id == Cost.production_id)
        .where(*production_filters)
    ) or Decimal("0")
    total_production_cost = db.scalar(
        select(func.coalesce(func.sum(Cost.total_cost), 0))
        .join(Production, Production.id == Cost.production_id)
        .where(*production_filters)
    ) or Decimal("0")
    margin_rate = db.scalar(
        select(func.coalesce(func.avg(Cost.margin_rate), 0))
        .join(Production, Production.id == Cost.production_id)
        .where(*production_filters)
    ) or Decimal("0")

    productions = (
        db.query(Production)
        .options(selectinload(Production.product), selectinload(Production.cost))
        .filter(*production_filters)
        .order_by(Production.created_at.desc())
        .limit(5)
        .all()
    )
    monthly_rows = (
        db.query(
            func.date_trunc("month", Production.created_at).label("period"),
            func.sum(Production.quantity).label("quantity"),
        )
        .filter(*production_filters)
        .group_by("period")
        .order_by("period")
        .all()
    )[-6:]

    costs = (
        db.query(Cost)
        .join(Production, Production.id == Cost.production_id)
        .filter(*production_filters)
        .all()
    )
    raw = sum((c.raw_material_cost for c in costs), Decimal("0"))
    labor = sum((c.labor_cost for c in costs), Decimal("0"))
    overhead = sum((c.overhead_cost for c in costs), Decimal("0"))
    other = sum((c.other_cost for c in costs), Decimal("0"))
    product_cost_rows = (
        db.query(Product.name, Cost.unit_cost, Cost.calculated_at)
        .join(Production, Production.product_id == Product.id)
        .join(Cost, Cost.production_id == Production.id)
        .filter(*production_filters)
        .order_by(Product.name, Cost.calculated_at.desc())
        .all()
    )
    costs_by_product: dict[str, list[Decimal]] = defaultdict(list)
    for name, unit_cost, _ in product_cost_rows:
        costs_by_product[name].append(Decimal(unit_cost or 0))

    product_costs = []
    for name, values in list(costs_by_product.items())[:6]:
        current = values[0]
        previous = values[1] if len(values) > 1 else None
        evolution = (
            float(((current - previous) / previous) * 100)
            if previous and previous != 0
            else 0.0
        )
        product_costs.append({
            "product": name,
            "unit_cost": float(current),
            "evolution": evolution,
        })

    status_rows = (
        db.query(Production.status, func.count(Production.id))
        .filter(*all_status_filters)
        .group_by(Production.status)
        .all()
    )
    status_counts = {str(status.value): int(count) for status, count in status_rows}
    result = {
        "kpis": {
            "produced_quantity": produced_quantity,
            "average_unit_cost": average_unit_cost,
            "total_production_cost": total_production_cost,
            "margin_rate": margin_rate,
        },
        "production_evolution": [
            {
                "month": MONTH_LABELS.get(period.month, str(period.month)),
                "quantity": float(quantity or 0),
            }
            for period, quantity in monthly_rows
        ],
        "cost_breakdown": [
            {"name": "Matieres premieres", "value": float(raw)},
            {"name": "Main d'oeuvre", "value": float(labor)},
            {"name": "Charges indirectes", "value": float(overhead)},
            {"name": "Autres charges", "value": float(other)},
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
        "product_costs": product_costs,
        "production_status": [
            {"name": "Planifiees", "value": status_counts.get("planifiee", 0)},
            {"name": "En cours", "value": status_counts.get("en_cours", 0)},
            {"name": "Terminees", "value": status_counts.get("terminee", 0)},
            {"name": "Annulees", "value": status_counts.get("annulee", 0)},
        ],
    }
    if user.role == UserRole.operateur_usine:
        result["kpis"]["average_unit_cost"] = Decimal("0")
        result["kpis"]["total_production_cost"] = Decimal("0")
        result["kpis"]["margin_rate"] = Decimal("0")
        result["cost_breakdown"] = []
        result["product_costs"] = []
    return result
