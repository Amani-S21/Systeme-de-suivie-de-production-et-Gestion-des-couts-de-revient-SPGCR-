from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import OrmModel


class ChargeCreate(OrmModel):
    label: str = Field(min_length=2, max_length=180)
    category: str = Field(min_length=2, max_length=50)
    amount: Decimal = Field(gt=0)
    charge_date: date
    description: str | None = None


class ChargeUpdate(OrmModel):
    label: str | None = Field(None, min_length=2, max_length=180)
    category: str | None = Field(None, min_length=2, max_length=50)
    amount: Decimal | None = Field(None, gt=0)
    charge_date: date | None = None
    description: str | None = None


class ChargeRead(ChargeCreate):
    id: int
    created_by_id: int | None
    created_at: datetime
