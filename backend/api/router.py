from fastapi import APIRouter
from api.endpoints import health, metrics, properties, auth, localities, amenities_ep, news

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Telemetry Metrics"])
api_router.include_router(properties.router, prefix="/properties", tags=["Properties"])
api_router.include_router(localities.router, prefix="/localities", tags=["Localities"])
api_router.include_router(amenities_ep.router, prefix="/amenities", tags=["Amenities"])
api_router.include_router(news.router, prefix="/news", tags=["News & Infrastructure"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
