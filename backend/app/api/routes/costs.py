from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.cost import CostCreate, CostRead
from app.services.cost_service import calculate_cost

router = APIRouter(prefix="/costs", tags=["costs"], dependencies=[Depends(get_current_user)])


@router.post("/production/{production_id}", response_model=CostRead)
def calculate(production_id: int, payload: CostCreate, db: Session = Depends(get_db)):
    cost = calculate_cost(db, production_id, payload)
    db.commit()
    db.refresh(cost)
    return cost
