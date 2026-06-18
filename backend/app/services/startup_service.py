from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user_service import create_user, get_by_email, get_by_login


def ensure_default_admin(db: Session) -> None:
    admin = get_by_login(db, settings.default_admin_login) or get_by_email(
        db, settings.default_admin_email
    )
    if admin:
        admin.email = settings.default_admin_email.lower()
        admin.login = settings.default_admin_login.lower()
        admin.hashed_password = get_password_hash(settings.default_admin_password)
        admin.first_name = settings.default_admin_first_name
        admin.last_name = settings.default_admin_last_name
        admin.role = UserRole.admin_msd
        admin.is_active = True
        db.add(admin)
        db.commit()
        return

    create_user(
        db,
        UserCreate(
            email=settings.default_admin_email,
            login=settings.default_admin_login,
            password=settings.default_admin_password,
            first_name=settings.default_admin_first_name,
            last_name=settings.default_admin_last_name,
            role=UserRole.admin_msd,
            is_active=True,
        ),
    )
    db.commit()
