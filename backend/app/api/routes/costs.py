from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.production import Production
from app.models.user import User
from app.schemas.cost import CostCreate, CostRead
from app.services.cost_service import calculate_cost

router = APIRouter(prefix="/costs", tags=["costs"], dependencies=[Depends(get_current_user)])


@router.post("/production/{production_id}", response_model=CostRead)
def calculate(production_id: int, payload: CostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    production = db.get(Production, production_id)
    if user.role == UserRole.operateur_usine and (not production or user.id not in {production.operator_id, production.created_by_id}):
        raise HTTPException(status_code=403, detail="Ce lot ne vous est pas affecte")
    cost = calculate_cost(db, production_id, payload, user_id=user.id)
    db.commit()
    db.refresh(cost)
    return cost
