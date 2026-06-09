from fastapi import APIRouter
from api.endpoints import health, metrics, properties

api_router = APIRouter()

# Include endpoint modules
api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Telemetry Metrics"])
api_router.include_router(properties.router, prefix="/properties", tags=["Properties"])
