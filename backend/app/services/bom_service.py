from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.bom import BomItem
from app.models.material import Material
from app.models.product import Product
from app.schemas.bom import BomReplace


def list_bom(db: Session, product_id: int) -> list[BomItem]:
    if not db.get(Product, product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    return list(db.scalars(select(BomItem).where(BomItem.product_id == product_id).order_by(BomItem.id)))


def replace_bom(db: Session, product_id: int, payload: BomReplace) -> list[BomItem]:
    if not db.get(Product, product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    material_ids = [line.material_id for line in payload.lines]
    if len(material_ids) != len(set(material_ids)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Un composant ne peut apparaitre qu'une fois")
    existing_ids = set(db.scalars(select(Material.id).where(Material.id.in_(material_ids))))
    if existing_ids != set(material_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Un composant est introuvable")

    db.execute(delete(BomItem).where(BomItem.product_id == product_id))
    items = [BomItem(product_id=product_id, **line.model_dump()) for line in payload.lines]
    db.add_all(items)
    db.flush()
    return items
