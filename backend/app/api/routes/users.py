from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import create_user, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("", response_model=list[UserRead], dependencies=[Depends(require_roles(UserRole.admin))])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())))


@router.post("", response_model=UserRead, dependencies=[Depends(require_roles(UserRole.admin))])
def create(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    user = create_user(db, payload)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead, dependencies=[Depends(require_roles(UserRole.admin))])
def update(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> User:
    user = update_user(db, db.get(User, user_id), payload)  # type: ignore[arg-type]
    db.commit()
    db.refresh(user)
    return user
