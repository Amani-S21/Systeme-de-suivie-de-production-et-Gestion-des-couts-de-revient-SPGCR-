from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.bom import BomItemRead, BomReplace
from app.services.bom_service import list_bom, replace_bom

router = APIRouter(prefix="/products/{product_id}/bom", tags=["bom"])


@router.get("", response_model=list[BomItemRead])
def index(product_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return list_bom(db, product_id)


@router.put("", response_model=list[BomItemRead], dependencies=[Depends(require_roles(UserRole.admin_msd, UserRole.responsable_production))])
def replace(product_id: int, payload: BomReplace, db: Session = Depends(get_db)):
    items = replace_bom(db, product_id, payload)
    db.commit()
    return items
