from fastapi import APIRouter

from app.api.routes import auth, costs, dashboard, materials, productions, products, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(materials.router)
api_router.include_router(products.router)
api_router.include_router(productions.router)
api_router.include_router(costs.router)
api_router.include_router(dashboard.router)
