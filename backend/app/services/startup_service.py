from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import UserRole
from app.schemas.user import UserCreate
from app.services.user_service import create_user, get_by_email


def ensure_default_admin(db: Session) -> None:
    if get_by_email(db, settings.default_admin_email):
        return
    create_user(
        db,
        UserCreate(
            email=settings.default_admin_email,
            password=settings.default_admin_password,
            first_name=settings.default_admin_first_name,
            last_name=settings.default_admin_last_name,
            role=UserRole.admin,
            is_active=True,
        ),
    )
    db.commit()
