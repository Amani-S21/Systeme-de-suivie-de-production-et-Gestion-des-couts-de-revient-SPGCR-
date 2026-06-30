from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.startup_service import ensure_default_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        ensure_default_admin(db)
    finally:
        db.close()
    yield


fastapi_app = FastAPI(title=settings.app_name, lifespan=lifespan)
fastapi_app.include_router(api_router, prefix=settings.api_v1_prefix)


@fastapi_app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@fastapi_app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Keep CORS outside FastAPI's error middleware so even HTTP 500 responses
# remain readable by the React application instead of becoming "Failed to fetch".
app = CORSMiddleware(
    app=fastapi_app,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
