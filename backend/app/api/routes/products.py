from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.product_service import create_product, list_products, update_product

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def index(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return list_products(db)


@router.post("", response_model=ProductRead, dependencies=[Depends(require_roles(UserRole.admin, UserRole.responsable))])
def create(payload: ProductCreate, db: Session = Depends(get_db)):
    product = create_product(db, payload)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductRead, dependencies=[Depends(require_roles(UserRole.admin, UserRole.responsable))])
def update(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = update_product(db, product_id, payload)
    db.commit()
    db.refresh(product)
    return product
