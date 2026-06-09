from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import List, Optional
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.elements import WKTElement
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from time import time

import database
import models
import schemas
from config import settings
from caching import cache_manager
from ingestion import IngestionPipeline
from observability import configure_logging, amenity_requests_total, amenity_geo_query_latency_seconds
import structlog

logger = structlog.get_logger("amenity.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Bootstrap Observability & Configs
    configure_logging(settings.LOG_LEVEL)
    logger.info("Initializing Amenity Intelligence Service lifespan...")

    # 2. Initialize Redis Connection
    await cache_manager.connect()

    yield

    # Lifespan Shutdown steps
    await cache_manager.disconnect()
    logger.info("Amenity Intelligence Service lifespan shut down successfully.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS Rules
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Middleware to Count Metrics ---
@app.middleware("http")
async def prometheus_metrics_middleware(request, call_next):
    method = request.method
    endpoint = request.url.path
    
    # Do not log standard metrics endpoints to avoid polluting stats
    if endpoint in ["/metrics", "/health"]:
        return await call_next(request)

    try:
        response = await call_next(request)
        status = str(response.status_code)
        amenity_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
        return response
    except Exception as e:
        amenity_requests_total.labels(method=method, endpoint=endpoint, status="500").inc()
        raise e


# --- APIs ---

@app.post("/amenities/ingest", response_model=schemas.AmenityResponse, status_code=201)
async def ingest_amenity(
    payload: schemas.AmenityCreate,
    db: AsyncSession = Depends(database.get_db_session)
):
    """
    Ingests a raw amenity payload through normalizer, validator, deduplicator, and saves to storage.
    """
    pipeline = IngestionPipeline(db)
    try:
        amenity = await pipeline.ingest(payload.model_dump())
        if not amenity:
            raise HTTPException(status_code=500, detail="Ingestion failed to persist record.")
        return schemas.AmenityResponse.from_orm(amenity)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline failure: {str(e)}")


@app.get("/amenities", response_model=List[schemas.AmenityResponse])
async def get_amenities(
    category: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(database.get_db_session)
):
    """
    Paginated search of database amenities with filtering options.
    """
    query = select(models.Amenity)
    if category:
        query = query.where(models.Amenity.category == category)
    if source:
        query = query.where(models.Amenity.source == source)
    if search:
        query = query.where(models.Amenity.name.ilike(f"%{search}%"))

    query = query.offset(offset).limit(min(100, limit))
    res = await db.execute(query)
    amenities = res.scalars().all()
    return [schemas.AmenityResponse.from_orm(a) for a in amenities]


@app.get("/amenities/nearby", response_model=List[schemas.AmenityNearbyResponse])
async def get_nearby_amenities(
    latitude: float,
    longitude: float,
    radius_meters: float,
    category: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(database.get_db_session)
):
    """
    Performs radial PostGIS proximity queries to identify nearby amenities within a 100km radius cap.
    """
    if radius_meters <= 0 or radius_meters > 100000.0:
        raise HTTPException(status_code=400, detail="radius_meters must be positive and capped at 100000.0 (100km).")

    cache_key = f"amenity:nearby:{latitude}:{longitude}:{radius_meters}:{category}:{limit}:{offset}"
    cached = await cache_manager.get(cache_key)
    if cached:
        return [schemas.AmenityNearbyResponse(**item) for item in cached]

    # Measure geospatial radial query latency
    start_time = time()

    # Create spatial query point
    point_geom = WKTElement(f"POINT({longitude} {latitude})", srid=4326)

    query = select(
        models.Amenity,
        func.ST_Distance(models.Amenity.location, point_geom).label("distance_meters")
    ).where(
        func.ST_DWithin(models.Amenity.location, point_geom, radius_meters)
    )

    if category:
        query = query.where(models.Amenity.category == category)

    query = query.order_by("distance_meters").offset(offset).limit(limit)

    res = await db.execute(query)
    rows = res.all()

    latency = time() - start_time
    amenity_geo_query_latency_seconds.observe(latency)

    out = []
    for row in rows:
        amenity = row[0]
        dist = float(row[1])
        out.append(schemas.AmenityNearbyResponse(
            id=amenity.id,
            name=amenity.name,
            category=amenity.category,
            latitude=amenity.latitude,
            longitude=amenity.longitude,
            address=amenity.address,
            source=amenity.source,
            confidence_score=amenity.confidence_score,
            last_verified_at=amenity.last_verified_at,
            distance_meters=round(dist, 2)
        ))

    # Cache in Redis for 1 hour
    serialized = [item.model_dump(mode="json") for item in out]
    await cache_manager.set(cache_key, serialized, ttl=3600)

    return out


@app.get("/amenities/{id}", response_model=schemas.AmenityResponse)
async def get_amenity_by_id(
    id: UUID,
    db: AsyncSession = Depends(database.get_db_session)
):
    """
    Fetch amenity profile details, cached by profile ID.
    """
    cache_key = f"amenity:profile:{id}"
    cached = await cache_manager.get(cache_key)
    if cached:
        return schemas.AmenityResponse(**cached)

    query = select(models.Amenity).where(models.Amenity.id == id)
    res = await db.execute(query)
    amenity = res.scalars().first()

    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found.")

    payload = schemas.AmenityResponse.from_orm(amenity)
    await cache_manager.set(cache_key, payload.model_dump(mode="json"), ttl=3600)
    return payload


@app.get("/metrics")
def prometheus_metrics():
    """
    Exposes raw Prometheus text stats for scraping.
    """
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/health")
async def health_check(db: AsyncSession = Depends(database.get_db_session)):
    """
    Health check tracking service dependecy status.
    """
    postgres_status = "healthy"
    redis_status = "healthy"
    
    # 1. Check PostgreSQL connection
    try:
        await db.execute(select(1))
    except Exception as e:
        postgres_status = f"unhealthy ({str(e)})"
        
    # 2. Check Redis connection
    if not cache_manager._connected:
        redis_status = "unhealthy"
        
    status = "healthy"
    if "unhealthy" in postgres_status or "unhealthy" in redis_status:
        status = "degraded"
        
    return {
        "status": status,
        "services": {
            "postgres": postgres_status,
            "redis": redis_status
        },
        "timestamp": datetime.now(timezone.utc)
    }
