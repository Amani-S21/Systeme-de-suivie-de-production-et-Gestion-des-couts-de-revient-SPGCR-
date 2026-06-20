from datetime import date

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.charge import Charge
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.charge import ChargeCreate, ChargeRead, ChargeUpdate
from app.services.charge_service import create_charge, list_charges, update_charge

router = APIRouter(prefix="/charges", tags=["charges"], dependencies=[Depends(require_roles(UserRole.admin_msd, UserRole.responsable_production))])


@router.get("", response_model=list[ChargeRead])
def index(search: str | None = None, category: str | None = None, date_from: date | None = Query(None), date_to: date | None = Query(None), db: Session = Depends(get_db)):
    return list_charges(db, search, category, date_from, date_to)


@router.post("", response_model=ChargeRead)
def create(payload: ChargeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    charge = create_charge(db, payload, user)
    db.commit()
    db.refresh(charge)
    return charge


@router.patch("/{charge_id}", response_model=ChargeRead)
def update(charge_id: int, payload: ChargeUpdate, db: Session = Depends(get_db)):
    charge = update_charge(db, charge_id, payload)
    db.commit()
    db.refresh(charge)
    return charge


@router.delete("/{charge_id}")
def delete(charge_id: int, db: Session = Depends(get_db)):
    charge = db.get(Charge, charge_id)
    if not charge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charge introuvable")
    db.delete(charge)
    db.commit()
    return {"success": True}
