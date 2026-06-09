from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import List
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

import database
import models
import schemas
from config import settings
from caching import cache_manager
from scoring import calculate_locality_scores
from jobs import run_nightly_aggregation, run_weekly_scoring
from observability import configure_logging, locality_requests_total, job_duration_seconds
import structlog

logger = structlog.get_logger("locality.main")
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Bootstrap Observability & Configs
    configure_logging(settings.LOG_LEVEL)
    logger.info("Initializing Locality Intelligence Service lifespan...")

    # 2. Initialize Redis Connection
    await cache_manager.connect()

    # 3. Start Background Scheduler Jobs
    # Nightly Aggregation: Daily at 12:00 AM (midnight)
    scheduler.add_job(
        run_nightly_aggregation_wrapper,
        CronTrigger(hour=0, minute=0),
        id="nightly_aggregation_job",
        replace_existing=True
    )
    
    # Weekly Scoring: Weekly on Sundays at 2:00 AM
    scheduler.add_job(
        run_weekly_scoring_wrapper,
        CronTrigger(day_of_week="sun", hour=2, minute=0),
        id="weekly_scoring_job",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started successfully with Cron aggregation triggers.")

    yield

    # Lifespan Shutdown steps
    scheduler.shutdown()
    await cache_manager.disconnect()
    logger.info("Locality Intelligence Service lifespan shut down successfully.")


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


# --- Scheduler Wrapper Task Helpers to inject DB sessions ---
async def run_nightly_aggregation_wrapper():
    async with database.AsyncSessionLocal() as session:
        with job_duration_seconds.labels(job_name="nightly_aggregation").time():
            await run_nightly_aggregation(session)


async def run_weekly_scoring_wrapper():
    async with database.AsyncSessionLocal() as session:
        with job_duration_seconds.labels(job_name="weekly_scoring").time():
            await run_weekly_scoring(session)


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
        locality_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
        return response
    except Exception as e:
        locality_requests_total.labels(method=method, endpoint=endpoint, status="500").inc()
        raise e


# --- APIs ---

@app.get("/localities", response_model=List[schemas.LocalityResponse])
async def get_localities(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(database.get_db_session)
):
    query = select(models.Locality).offset(skip).limit(limit)
    res = await db.execute(query)
    localities = res.scalars().all()
    
    out = []
    for loc in localities:
        lat, lon = None, None
        if loc.location:
            try:
                from geoalchemy2.shape import to_shape
                shape = to_shape(loc.location)
                lon, lat = shape.x, shape.y
            except Exception:
                pass
        out.append(schemas.LocalityResponse(
            id=loc.id,
            name=loc.name,
            city=loc.city,
            state=loc.state,
            latitude=lat,
            longitude=lon
        ))
    return out


@app.get("/localities/{id}", response_model=schemas.LocalityResponse)
async def get_locality_by_id(
    id: UUID,
    db: AsyncSession = Depends(database.get_db_session)
):
    query = select(models.Locality).where(models.Locality.id == id)
    res = await db.execute(query)
    loc = res.scalars().first()
    
    if not loc:
        raise HTTPException(status_code=404, detail="Locality not found")

    lat, lon = None, None
    if loc.location:
        try:
            from geoalchemy2.shape import to_shape
            shape = to_shape(loc.location)
            lon, lat = shape.x, shape.y
        except Exception:
            pass

    return schemas.LocalityResponse(
        id=loc.id,
        name=loc.name,
        city=loc.city,
        state=loc.state,
        latitude=lat,
        longitude=lon
    )


@app.get("/localities/{id}/metrics", response_model=schemas.LocalityMetricsResponse)
async def get_locality_metrics(
    id: UUID,
    db: AsyncSession = Depends(database.get_db_session)
):
    cache_key = f"locality:{id}:metrics"
    cached = await cache_manager.get(cache_key)
    if cached:
        return schemas.LocalityMetricsResponse(**cached)

    query = select(models.LocalityMetrics).where(models.LocalityMetrics.locality_id == id)
    res = await db.execute(query)
    metrics = res.scalars().first()

    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found for this locality")

    # Map database row to categorized response schema
    payload = schemas.LocalityMetricsResponse(
        locality_id=metrics.locality_id,
        property=schemas.PropertyMetrics(
            avg_property_price=metrics.avg_property_price,
            median_property_price=metrics.median_property_price,
            avg_price_per_sqft=metrics.avg_price_per_sqft,
            median_price_per_sqft=metrics.median_price_per_sqft,
            rental_yield_estimate=metrics.rental_yield_estimate,
            listing_velocity=metrics.listing_velocity,
            property_inventory=metrics.property_inventory
        ),
        amenities=schemas.AmenityMetrics(
            schools_per_sq_km=metrics.schools_per_sq_km,
            hospitals_per_sq_km=metrics.hospitals_per_sq_km,
            restaurants_per_sq_km=metrics.restaurants_per_sq_km,
            grocery_stores_per_sq_km=metrics.grocery_stores_per_sq_km,
            gyms_per_sq_km=metrics.gyms_per_sq_km,
            parks_per_sq_km=metrics.parks_per_sq_km
        ),
        accessibility=schemas.AccessibilityMetrics(
            nearest_railway_station=metrics.nearest_railway_station,
            nearest_airport=metrics.nearest_airport,
            nearest_bus_terminal=metrics.nearest_bus_terminal,
            highway_access_score=metrics.highway_access_score
        ),
        infrastructure=schemas.InfrastructureMetrics(
            planned_projects=metrics.planned_projects,
            metro_proximity=metrics.metro_proximity,
            industrial_corridor_proximity=metrics.industrial_corridor_proximity,
            it_park_proximity=metrics.it_park_proximity
        ),
        updated_at=metrics.updated_at
    )

    # Cache payload with 1 hour TTL
    # Use dict dump for Redis serialization
    await cache_manager.set(cache_key, payload.model_dump(mode="json"), ttl=3600)
    return payload


@app.get("/localities/{id}/scores", response_model=schemas.LocalityScoresResponse)
async def get_locality_scores(
    id: UUID,
    db: AsyncSession = Depends(database.get_db_session)
):
    cache_key = f"locality:{id}:scores"
    cached = await cache_manager.get(cache_key)
    if cached:
        return schemas.LocalityScoresResponse(**cached)

    # Fetch scores from DB
    score_query = select(models.LocalityScores).where(models.LocalityScores.locality_id == id)
    scores_res = await db.execute(score_query)
    scores_obj = scores_res.scalars().first()

    if not scores_obj:
        raise HTTPException(status_code=404, detail="Scores not found for this locality")

    # Fetch corresponding metrics to generate explainable text breakdowns
    metrics_query = select(models.LocalityMetrics).where(models.LocalityMetrics.locality_id == id)
    metrics_res = await db.execute(metrics_query)
    metrics_obj = metrics_res.scalars().first()

    if not metrics_obj:
        raise HTTPException(status_code=404, detail="Metrics required for explainable scoring are missing")

    # Generate explanations dynamically using metrics (guarantees consistency)
    _, explanations = calculate_locality_scores(metrics_obj)
    
    # Calculate overall livability
    overall_livability = (
        scores_obj.education_score +
        scores_obj.healthcare_score +
        scores_obj.lifestyle_score +
        scores_obj.connectivity_score
    ) / 4.0

    payload = schemas.LocalityScoresResponse(
        locality_id=scores_obj.locality_id,
        education_score=scores_obj.education_score,
        healthcare_score=scores_obj.healthcare_score,
        lifestyle_score=scores_obj.lifestyle_score,
        connectivity_score=scores_obj.connectivity_score,
        investment_score=scores_obj.investment_score,
        overall_livability_score=round(overall_livability, 2),
        updated_at=scores_obj.updated_at,
        explanations=explanations
    )

    await cache_manager.set(cache_key, payload.model_dump(mode="json"), ttl=3600)
    return payload


@app.get("/localities/{id}/history", response_model=schemas.LocalityPriceHistoryResponse)
async def get_locality_history(
    id: UUID,
    db: AsyncSession = Depends(database.get_db_session)
):
    cache_key = f"locality:{id}:history"
    cached = await cache_manager.get(cache_key)
    if cached:
        return schemas.LocalityPriceHistoryResponse(**cached)

    query = select(models.LocalityPriceHistory).where(
        models.LocalityPriceHistory.locality_id == id
    ).order_by(models.LocalityPriceHistory.year.desc(), models.LocalityPriceHistory.quarter.desc())

    res = await db.execute(query)
    history_records = res.scalars().all()

    history_entries = [
        schemas.PriceHistoryEntry(
            year=rec.year,
            quarter=rec.quarter,
            avg_price_per_sqft=rec.avg_price_per_sqft,
            median_price_per_sqft=rec.median_price_per_sqft
        ) for rec in history_records
    ]

    payload = schemas.LocalityPriceHistoryResponse(
        locality_id=id,
        history=history_entries
    )

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
