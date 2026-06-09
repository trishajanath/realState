from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from typing import List, Literal, Optional
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from time import time

import database
import models
import schemas
from config import settings
from caching import cache_manager
from jobs import run_nightly_recommendation_recomputation
from observability import configure_logging, recommendation_requests_total, recommendation_query_latency_seconds
import structlog

logger = structlog.get_logger("recommendation.main")
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Bootstrap Observability & Configs
    configure_logging(settings.LOG_LEVEL)
    logger.info("Initializing Similar Locality Recommendation Service lifespan...")

    # 2. Initialize Redis Connection
    await cache_manager.connect()

    # 3. Start Background Scheduler Jobs
    # Nightly Recommendation Builder: Daily at 1:00 AM
    scheduler.add_job(
        run_nightly_recommendation_wrapper,
        CronTrigger(hour=1, minute=0),
        id="nightly_recommendation_recomputation_job",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started successfully with Cron recomputation triggers.")

    yield

    # Lifespan Shutdown steps
    scheduler.shutdown()
    await cache_manager.disconnect()
    logger.info("Similar Locality Recommendation Service lifespan shut down successfully.")


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
async def run_nightly_recommendation_wrapper():
    async with database.AsyncSessionLocal() as session:
        await run_nightly_recommendation_recomputation(session)


# --- Middleware to Count Metrics ---
@app.middleware("http")
async def prometheus_metrics_middleware(request, call_next):
    method = request.method
    endpoint = request.url.path
    
    if endpoint in ["/metrics", "/health"]:
        return await call_next(request)

    try:
        response = await call_next(request)
        status = str(response.status_code)
        recommendation_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
        return response
    except Exception as e:
        recommendation_requests_total.labels(method=method, endpoint=endpoint, status="500").inc()
        raise e


# --- Helper to Fetch Locality Features ---
async def get_all_locality_feature_vectors(db: AsyncSession) -> List[dict]:
    # Query all localities
    query = select(models.Locality)
    res = await db.execute(query)
    localities = res.scalars().all()
    
    out = []
    for loc in localities:
        # Get metrics
        m_query = select(models.LocalityMetrics).where(models.LocalityMetrics.locality_id == loc.id)
        m_res = await db.execute(m_query)
        metrics = m_res.scalars().first()
        
        # Get scores
        s_query = select(models.LocalityScores).where(models.LocalityScores.locality_id == loc.id)
        s_res = await db.execute(s_query)
        scores = s_res.scalars().first()
        
        from engine import extract_locality_features
        feats = extract_locality_features(metrics, scores)
        out.append({
            "locality_id": loc.id,
            "name": loc.name,
            "city": loc.city,
            "state": loc.state,
            "raw_features": feats
        })
    return out


# --- APIs ---

@app.get("/localities/{id}/similar", response_model=List[schemas.RecommendationItem])
async def get_similar_localities(
    id: UUID,
    use_llm: bool = Query(False, description="Whether to use Gemini LLM to generate recommendations"),
    db: AsyncSession = Depends(database.get_db_session)
):
    """
    Fetches the cached top matching SIMILAR localities.
    """
    cache_key = f"recommendation:{id}:similar:llm" if use_llm else f"recommendation:{id}:similar"
    cached = await cache_manager.get(cache_key)
    if cached:
        return [schemas.RecommendationItem(**item) for item in cached]

    start_time = time()

    # Query with join to retrieve recommended locality metadata
    query = (
        select(
            models.LocalityRecommendation,
            models.Locality.name,
            models.Locality.city,
            models.Locality.state
        )
        .join(models.Locality, models.Locality.id == models.LocalityRecommendation.recommended_locality_id)
        .where(
            models.LocalityRecommendation.target_locality_id == id,
            models.LocalityRecommendation.recommendation_type == "SIMILAR",
            models.LocalityRecommendation.is_llm == use_llm
        )
        .order_by(models.LocalityRecommendation.score.desc())
    )

    res = await db.execute(query)
    rows = res.all()

    latency = time() - start_time
    recommendation_query_latency_seconds.observe(latency)

    out = []
    for row in rows:
        rec = row[0]
        name = row[1]
        city = row[2]
        state = row[3]
        out.append(schemas.RecommendationItem(
            id=rec.recommended_locality_id,
            name=name,
            city=city,
            state=state,
            recommendation_type=rec.recommendation_type,
            score=float(rec.score),
            reasoning=rec.reasoning,
            feature_contribution=rec.feature_contribution or {},
            generation_timestamp=rec.created_at
        ))

    # If empty and use_llm=True, attempt on-the-fly generation
    if not out and use_llm:
        logger.info("LLM recommendations not precomputed or cached. Generating on-the-fly...", target_id=id)
        try:
            from ai import ai_service
            all_vecs = await get_all_locality_feature_vectors(db)
            target = next((v for v in all_vecs if str(v["locality_id"]) == str(id)), None)
            if not target:
                raise HTTPException(status_code=404, detail="Target locality not found.")
            
            llm_recs = await ai_service.generate_recommendations(target, all_vecs, "SIMILAR", limit=5)
            if llm_recs:
                for rec in llm_recs:
                    db_rec = models.LocalityRecommendation(
                        target_locality_id=rec["target_locality_id"],
                        recommended_locality_id=UUID(rec["recommended_locality_id"]) if isinstance(rec["recommended_locality_id"], str) else rec["recommended_locality_id"],
                        recommendation_type=rec["recommendation_type"],
                        score=rec["score"],
                        reasoning=rec["reasoning"],
                        feature_contribution=rec["feature_contribution"],
                        is_llm=True
                    )
                    db.add(db_rec)
                await db.commit()

                # Re-query or construct return items
                for rec in llm_recs:
                    rec_id = UUID(rec["recommended_locality_id"]) if isinstance(rec["recommended_locality_id"], str) else rec["recommended_locality_id"]
                    cand = next((v for v in all_vecs if str(v["locality_id"]) == str(rec_id)), None)
                    if cand:
                        out.append(schemas.RecommendationItem(
                            id=rec_id,
                            name=cand["name"],
                            city=cand["city"],
                            state=cand["state"],
                            recommendation_type=rec["recommendation_type"],
                            score=rec["score"],
                            reasoning=rec["reasoning"],
                            feature_contribution=rec["feature_contribution"],
                            generation_timestamp=datetime.now(timezone.utc)
                        ))
        except Exception as e:
            logger.error("Failed to generate LLM recommendations on-the-fly", error=str(e))
            # Fall back to rule-based
            if not out:
                logger.info("Falling back to rule-based recommendations due to LLM error")
                return await get_similar_localities(id=id, use_llm=False, db=db)

    if out:
        # Cache results in Redis for 1 hour
        serialized = [item.model_dump(mode="json") for item in out]
        await cache_manager.set(cache_key, serialized, ttl=3600)

    return out


@app.get("/localities/{id}/alternatives", response_model=List[schemas.RecommendationItem])
async def get_locality_alternatives(
    id: UUID,
    type: Literal["CHEAPER", "PREMIUM", "HIGH_GROWTH", "FAMILY_FRIENDLY", "SAFER", "BETTER_CONNECTED"] = Query(..., description="The alternative recommendation category"),
    use_llm: bool = Query(False, description="Whether to use Gemini LLM to generate recommendations"),
    db: AsyncSession = Depends(database.get_db_session)
):
    """
    Fetches the cached alternative recommendations (CHEAPER, PREMIUM, HIGH_GROWTH, FAMILY_FRIENDLY, SAFER, BETTER_CONNECTED).
    """
    cache_key = f"recommendation:{id}:alternatives:{type}:llm" if use_llm else f"recommendation:{id}:alternatives:{type}"
    cached = await cache_manager.get(cache_key)
    if cached:
        return [schemas.RecommendationItem(**item) for item in cached]

    start_time = time()

    query = (
        select(
            models.LocalityRecommendation,
            models.Locality.name,
            models.Locality.city,
            models.Locality.state
        )
        .join(models.Locality, models.Locality.id == models.LocalityRecommendation.recommended_locality_id)
        .where(
            models.LocalityRecommendation.target_locality_id == id,
            models.LocalityRecommendation.recommendation_type == type,
            models.LocalityRecommendation.is_llm == use_llm
        )
        .order_by(models.LocalityRecommendation.score.desc())
    )

    res = await db.execute(query)
    rows = res.all()

    latency = time() - start_time
    recommendation_query_latency_seconds.observe(latency)

    out = []
    for row in rows:
        rec = row[0]
        name = row[1]
        city = row[2]
        state = row[3]
        out.append(schemas.RecommendationItem(
            id=rec.recommended_locality_id,
            name=name,
            city=city,
            state=state,
            recommendation_type=rec.recommendation_type,
            score=float(rec.score),
            reasoning=rec.reasoning,
            feature_contribution=rec.feature_contribution or {},
            generation_timestamp=rec.created_at
        ))

    # If empty and use_llm=True, attempt on-the-fly generation
    if not out and use_llm:
        logger.info("LLM alternatives recommendations not precomputed or cached. Generating on-the-fly...", target_id=id, type=type)
        try:
            from ai import ai_service
            all_vecs = await get_all_locality_feature_vectors(db)
            target = next((v for v in all_vecs if str(v["locality_id"]) == str(id)), None)
            if not target:
                raise HTTPException(status_code=404, detail="Target locality not found.")
            
            llm_recs = await ai_service.generate_recommendations(target, all_vecs, type, limit=5)
            if llm_recs:
                for rec in llm_recs:
                    db_rec = models.LocalityRecommendation(
                        target_locality_id=rec["target_locality_id"],
                        recommended_locality_id=UUID(rec["recommended_locality_id"]) if isinstance(rec["recommended_locality_id"], str) else rec["recommended_locality_id"],
                        recommendation_type=rec["recommendation_type"],
                        score=rec["score"],
                        reasoning=rec["reasoning"],
                        feature_contribution=rec["feature_contribution"],
                        is_llm=True
                    )
                    db.add(db_rec)
                await db.commit()

                # Re-query or construct return items
                for rec in llm_recs:
                    rec_id = UUID(rec["recommended_locality_id"]) if isinstance(rec["recommended_locality_id"], str) else rec["recommended_locality_id"]
                    cand = next((v for v in all_vecs if str(v["locality_id"]) == str(rec_id)), None)
                    if cand:
                        out.append(schemas.RecommendationItem(
                            id=rec_id,
                            name=cand["name"],
                            city=cand["city"],
                            state=cand["state"],
                            recommendation_type=rec["recommendation_type"],
                            score=rec["score"],
                            reasoning=rec["reasoning"],
                            feature_contribution=rec["feature_contribution"],
                            generation_timestamp=datetime.now(timezone.utc)
                        ))
        except Exception as e:
            logger.error("Failed to generate LLM alternatives recommendations on-the-fly", error=str(e))
            # Fall back to rule-based
            if not out:
                logger.info("Falling back to rule-based alternatives due to LLM error")
                return await get_locality_alternatives(id=id, type=type, use_llm=False, db=db)

    if out:
        serialized = [item.model_dump(mode="json") for item in out]
        await cache_manager.set(cache_key, serialized, ttl=3600)

    return out


@app.get("/localities/{id}/recommendation-metadata", response_model=schemas.RecommendationMetadataResponse)
async def get_recommendation_metadata(
    id: UUID,
    db: AsyncSession = Depends(database.get_db_session)
):
    """
    Returns statistics and summary variables concerning recommendation runs and feature drift.
    """
    # 1. Last successful run metrics
    last_run_query = (
        select(models.RecommendationRun)
        .where(models.RecommendationRun.status == "SUCCESS")
        .order_by(models.RecommendationRun.run_timestamp.desc())
        .limit(1)
    )
    res_run = await db.execute(last_run_query)
    last_run = res_run.scalars().first()

    last_run_time = last_run.run_timestamp if last_run else None
    drift_metrics = last_run.features_summary if last_run else {}

    # 2. Total active recommendations
    count_query = select(func.count(models.LocalityRecommendation.id))
    res_count = await db.execute(count_query)
    total_count = res_count.scalar_one() or 0

    # 3. Stale recommendations (older than 24 hours)
    day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    stale_query = select(func.count(models.LocalityRecommendation.id)).where(
        models.LocalityRecommendation.created_at < day_ago
    )
    res_stale = await db.execute(stale_query)
    stale_count = res_stale.scalar_one() or 0

    return schemas.RecommendationMetadataResponse(
        last_run_timestamp=last_run_time,
        total_recommendations_count=total_count,
        stale_count=stale_count,
        feature_drift_metrics=drift_metrics
    )


@app.get("/metrics")
def prometheus_metrics():
    """
    Exposes raw Prometheus text stats for scraping.
    """
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/health")
async def health_check(db: AsyncSession = Depends(database.get_db_session)):
    """
    Health check mapping dependencies.
    """
    postgres_status = "healthy"
    redis_status = "healthy"
    
    try:
        await db.execute(select(1))
    except Exception as e:
        postgres_status = f"unhealthy ({str(e)})"
        
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
