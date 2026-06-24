from datetime import date

from fastapi import HTTPException, status
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.charge import Charge
from app.models.user import User
from app.schemas.charge import ChargeCreate, ChargeUpdate


def list_charges(db: Session, search: str | None, category: str | None, date_from: date | None, date_to: date | None, product_id: int | None = None) -> list[Charge]:
    stmt = select(Charge)
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(Charge.label.ilike(term), Charge.description.ilike(term)))
    if category:
        stmt = stmt.where(Charge.category == category)
    if date_from:
        stmt = stmt.where(Charge.charge_date >= date_from)
    if date_to:
        stmt = stmt.where(Charge.charge_date <= date_to)
    if product_id:
        stmt = stmt.where(Charge.product_id == product_id)
    return list(db.scalars(stmt.order_by(Charge.charge_date.desc(), Charge.id.desc())))


def create_charge(db: Session, payload: ChargeCreate, user: User) -> Charge:
    charge = Charge(**payload.model_dump(), created_by_id=user.id)
    db.add(charge)
    db.flush()
    return charge


def update_charge(db: Session, charge_id: int, payload: ChargeUpdate) -> Charge:
    charge = db.get(Charge, charge_id)
    if not charge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charge introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(charge, key, value)
    db.flush()
    return charge


def product_charge_summary(db: Session, product_id: int) -> dict[str, Decimal | int]:
    rows = db.execute(
        select(Charge.category, func.coalesce(func.sum(Charge.amount), 0))
        .where(Charge.product_id == product_id)
        .group_by(Charge.category)
    ).all()
    totals = {category: Decimal(amount or 0) for category, amount in rows}
    labor = totals.get("main_oeuvre", Decimal("0"))
    overhead = sum(
        amount
        for category, amount in totals.items()
        if category in {"energie", "transport", "maintenance", "administration", "charge_indirecte"}
    )
    other = sum(
        amount
        for category, amount in totals.items()
        if category not in {"main_oeuvre", "energie", "transport", "maintenance", "administration", "charge_indirecte"}
    )
    return {
        "product_id": product_id,
        "labor_cost": labor,
        "overhead_cost": overhead,
        "other_cost": other,
        "total_cost": labor + overhead + other,
    }
