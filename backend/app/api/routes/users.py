from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
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


@router.get("", response_model=list[UserRead], dependencies=[Depends(require_roles(UserRole.admin_msd))])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())))


@router.get("/operators", response_model=list[UserRead], dependencies=[Depends(require_roles(UserRole.admin_msd, UserRole.responsable_production))])
def list_operators(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).where(User.role == UserRole.operateur_usine, User.is_active.is_(True)).order_by(User.first_name, User.last_name)))


@router.post("", response_model=UserRead, dependencies=[Depends(require_roles(UserRole.admin_msd))])
def create(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    user = create_user(db, payload)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead, dependencies=[Depends(require_roles(UserRole.admin_msd))])
def update(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> User:
    user = update_user(db, db.get(User, user_id), payload)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", dependencies=[Depends(require_roles(UserRole.admin_msd))])
def delete(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vous ne pouvez pas supprimer votre propre compte")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    try:
        db.delete(user)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cet utilisateur est lie a des operations existantes") from exc
    return {"success": True}
