from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    emergencies,
    hospitals,
    confirmations,
    ambulances,
    health,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(emergencies.router, prefix="/emergencies", tags=["Emergencies"])
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["Hospitals & Resources"])
api_router.include_router(confirmations.router, prefix="/confirmations", tags=["Hospital Confirmations"])
api_router.include_router(ambulances.router, prefix="/ambulances", tags=["Ambulances & Coordination"])
api_router.include_router(health.router, prefix="/health", tags=["Health & Audit"])
