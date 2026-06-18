from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def get_by_login(db: Session, login: str) -> User | None:
    return db.scalar(select(User).where(User.login == login.lower()))


def authenticate(db: Session, identifier: str, password: str) -> User | None:
    normalized = identifier.lower().strip()
    user = get_by_login(db, normalized) or get_by_email(db, normalized)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(db: Session, payload: UserCreate) -> User:
    if get_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email deja utilise")
    if get_by_login(db, payload.login):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Login deja utilise")
    user = User(
        email=payload.email.lower(),
        login=payload.login.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()
    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    data = payload.model_dump(exclude_unset=True)
    password = data.pop("password", None)
    for key, value in data.items():
        setattr(user, key, value)
    if password:
        user.hashed_password = get_password_hash(password)
    db.flush()
    return user
