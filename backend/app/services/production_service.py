from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.bom import BomItem
from app.models.enums import ProductionStatus, UserRole
from app.models.material import Material, StockMovement
from app.models.production import Production, ProductionMaterial
from app.models.product import Product
from app.models.user import User
from app.schemas.production import ProductionCreate, ProductionMaterialIn, ProductionUpdate


def list_productions(db: Session, user: User) -> list[Production]:
    stmt = (
        select(Production)
        .options(selectinload(Production.product), selectinload(Production.cost))
        .order_by(Production.created_at.desc())
    )
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
    ensure_material_consumption(
        db,
        production,
        requested_materials=payload.materials,
        created_by_id=user.id,
        confirm_below_minimum_stock=payload.confirm_below_minimum_stock,
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


def ensure_material_consumption(
    db: Session,
    production: Production,
    requested_materials: list[ProductionMaterialIn],
    created_by_id: int | None,
    confirm_below_minimum_stock: bool,
) -> bool:
    """Create the immutable material snapshot and stock exits once per production."""
    if production.materials:
        return False

    quantities: dict[int, Decimal] = {}
    if requested_materials:
        for item in requested_materials:
            if item.material_id in quantities:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Une matiere ne peut apparaitre qu'une fois dans une production",
                )
            quantities[item.material_id] = Decimal(item.quantity_used)
    else:
        bom_items = list(
            db.scalars(select(BomItem).where(BomItem.product_id == production.product_id))
        )
        if not bom_items:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Aucune recette BOM n'est configuree pour ce produit",
            )
        quantities = {
            item.material_id: Decimal(item.quantity_required) * Decimal(production.quantity)
            for item in bom_items
        }

    materials = {
        material.id: material
        for material in db.scalars(
            select(Material)
            .where(Material.id.in_(quantities))
            .with_for_update()
        )
    }
    missing_ids = set(quantities) - set(materials)
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Matiere introuvable: {min(missing_ids)}",
        )

    threshold_warnings: list[str] = []
    for material_id, quantity_used in quantities.items():
        material = materials[material_id]
        if quantity_used <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"La quantite de {material.name} doit etre positive",
            )
        if material.unit_cost <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Le CUMP de {material.name} doit etre superieur a zero",
            )
        remaining = Decimal(material.quantity) - quantity_used
        if remaining < 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Stock insuffisant pour {material.name}: "
                    f"{material.quantity} disponible, {quantity_used} requis"
                ),
            )
        if remaining <= Decimal(material.minimum_stock):
            threshold_warnings.append(
                f"{material.name} ({remaining} restant, seuil {material.minimum_stock})"
            )

    if threshold_warnings and not confirm_below_minimum_stock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Confirmation requise: le stock atteindra son seuil minimum pour "
                + ", ".join(threshold_warnings)
            ),
        )

    for material_id, quantity_used in quantities.items():
        material = materials[material_id]
        material.quantity = Decimal(material.quantity) - quantity_used
        production.materials.append(
            ProductionMaterial(
                material_id=material.id,
                quantity_used=quantity_used,
                unit_cost=material.unit_cost,
            )
        )
        db.add(
            StockMovement(
                material_id=material.id,
                movement_type="sortie",
                quantity=quantity_used,
                reason=f"Consommation automatique du lot {production.reference}",
                created_by_id=created_by_id,
            )
        )
    db.flush()
    return True
