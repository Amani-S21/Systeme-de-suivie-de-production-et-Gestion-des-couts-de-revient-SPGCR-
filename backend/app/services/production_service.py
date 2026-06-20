from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import ProductionStatus, UserRole
from app.models.material import Material
from app.models.production import Production, ProductionMaterial
from app.models.product import Product
from app.models.user import User
from app.schemas.production import ProductionCreate, ProductionUpdate


def list_productions(db: Session, user: User) -> list[Production]:
    stmt = select(Production).options(selectinload(Production.product)).order_by(Production.created_at.desc())
    if user.role == UserRole.operateur_usine:
        stmt = stmt.where(or_(Production.operator_id == user.id, Production.created_by_id == user.id))
    return list(db.scalars(stmt))


def create_production(db: Session, payload: ProductionCreate, user: User) -> Production:
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    count = db.scalar(select(func.count(Production.id))) or 0
    operator_id = user.id if user.role == UserRole.operateur_usine else payload.operator_id
    if operator_id:
        operator = db.get(User, operator_id)
        if not operator or operator.role != UserRole.operateur_usine:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Operateur invalide")
    production = Production(
        reference=f"PRD-{datetime.now(timezone.utc).year}-{count + 1:04d}",
        product_id=payload.product_id,
        quantity=payload.quantity,
        status=payload.status,
        created_by_id=user.id,
        operator_id=operator_id,
        started_at=datetime.now(timezone.utc) if payload.status == ProductionStatus.en_cours else None,
    )
    db.add(production)
    db.flush()
    for item in payload.materials:
        material = db.get(Material, item.material_id)
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matiere introuvable")
        material.quantity -= item.quantity_used
        db.add(
            ProductionMaterial(
                production_id=production.id,
                material_id=material.id,
                quantity_used=item.quantity_used,
                unit_cost=material.unit_cost,
            )
        )
    db.flush()
    return production


def update_production(db: Session, production_id: int, payload: ProductionUpdate) -> Production:
    production = db.get(Production, production_id)
    if not production:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production introuvable")
    data = payload.model_dump(exclude_unset=True)
    if data.get("status") == ProductionStatus.terminee and not production.finished_at:
        production.finished_at = datetime.now(timezone.utc)
    if data.get("status") == ProductionStatus.en_cours and not production.started_at:
        production.started_at = datetime.now(timezone.utc)
    for key, value in data.items():
        setattr(production, key, value)
    db.flush()
    return production


def raw_material_total(production: Production) -> Decimal:
    return sum((item.quantity_used * item.unit_cost for item in production.materials), Decimal("0"))
