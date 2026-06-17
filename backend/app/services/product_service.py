from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def list_products(db: Session) -> list[Product]:
    return list(db.scalars(select(Product).order_by(Product.name)))


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.flush()
    return product


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.flush()
    return product
