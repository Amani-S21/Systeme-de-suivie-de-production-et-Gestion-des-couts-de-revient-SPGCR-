from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.schemas.cost import CostCreate, CostRead
from app.services.cost_service import calculate_cost

router = APIRouter(prefix="/costs", tags=["costs"], dependencies=[Depends(require_roles(UserRole.admin, UserRole.responsable))])


@router.post("/production/{production_id}", response_model=CostRead)
def calculate(production_id: int, payload: CostCreate, db: Session = Depends(get_db)):
    cost = calculate_cost(db, production_id, payload)
    db.commit()
    db.refresh(cost)
    return cost
