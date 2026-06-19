from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import ProductionStatus, UserRole
from app.models.user import User
from app.schemas.production import ProductionCreate, ProductionRead, ProductionUpdate
from app.services.production_service import create_production, list_productions, update_production

router = APIRouter(prefix="/productions", tags=["productions"])


@router.get("", response_model=list[ProductionRead])
def index(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return list_productions(db)


@router.post("", response_model=ProductionRead)
def create(payload: ProductionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    production = create_production(db, payload, user)
    db.commit()
    db.refresh(production)
    return production


@router.patch("/{production_id}", response_model=ProductionRead)
def update(production_id: int, payload: ProductionUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == UserRole.operateur_usine:
        changes = payload.model_dump(exclude_unset=True)
        if changes != {"status": ProductionStatus.terminee}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Un operateur peut uniquement cloturer un lot")
    production = update_production(db, production_id, payload)
    db.commit()
    db.refresh(production)
    return production
