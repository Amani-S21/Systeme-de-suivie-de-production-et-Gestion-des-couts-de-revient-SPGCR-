from datetime import datetime

from pydantic import EmailStr, Field

from app.models.enums import UserRole
from app.schemas.common import OrmModel


class UserBase(OrmModel):
    email: EmailStr
    login: str = Field(min_length=3, max_length=120)
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    role: UserRole = UserRole.operateur_usine
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(OrmModel):
    login: str | None = Field(default=None, min_length=3, max_length=120)
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8)


class UserRead(UserBase):
    id: int
    created_at: datetime


class Token(OrmModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
