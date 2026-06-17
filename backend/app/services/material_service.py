from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.material import Material, StockMovement
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialUpdate, StockMovementCreate


def list_materials(db: Session) -> list[Material]:
    return list(db.scalars(select(Material).order_by(Material.name)))


def create_material(db: Session, payload: MaterialCreate) -> Material:
    material = Material(**payload.model_dump())
    db.add(material)
    db.flush()
    return material


def update_material(db: Session, material_id: int, payload: MaterialUpdate) -> Material:
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matiere introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(material, key, value)
    db.flush()
    return material


def add_stock_movement(db: Session, material_id: int, payload: StockMovementCreate, user: User) -> Material:
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matiere introuvable")
    if payload.movement_type == "sortie":
        material.quantity -= payload.quantity
    elif payload.movement_type == "entree":
        material.quantity += payload.quantity
    else:
        material.quantity = payload.quantity
    db.add(StockMovement(material_id=material.id, created_by_id=user.id, **payload.model_dump()))
    db.flush()
    return material
