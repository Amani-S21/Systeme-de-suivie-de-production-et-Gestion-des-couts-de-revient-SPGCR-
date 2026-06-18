from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialRead, MaterialUpdate, StockMovementCreate
from app.services.material_service import add_stock_movement, create_material, list_materials, update_material

router = APIRouter(prefix="/materials", tags=["materials"])


@router.get("", response_model=list[MaterialRead])
def index(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return list_materials(db)


@router.post("", response_model=MaterialRead, dependencies=[Depends(require_roles(UserRole.admin_msd, UserRole.responsable_production))])
def create(payload: MaterialCreate, db: Session = Depends(get_db)):
    material = create_material(db, payload)
    db.commit()
    db.refresh(material)
    return material


@router.patch("/{material_id}", response_model=MaterialRead, dependencies=[Depends(require_roles(UserRole.admin_msd, UserRole.responsable_production))])
def update(material_id: int, payload: MaterialUpdate, db: Session = Depends(get_db)):
    material = update_material(db, material_id, payload)
    db.commit()
    db.refresh(material)
    return material


@router.post("/{material_id}/movements", response_model=MaterialRead, dependencies=[Depends(require_roles(UserRole.admin_msd, UserRole.responsable_production))])
def movement(material_id: int, payload: StockMovementCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    material = add_stock_movement(db, material_id, payload, user)
    db.commit()
    db.refresh(material)
    return material
