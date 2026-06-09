from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
import statistics
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

import models
from engine import (
    extract_locality_features,
    normalize_features,
    calculate_similar_localities,
    calculate_cheaper_alternatives,
    calculate_premium_alternatives,
    calculate_high_growth_localities,
    calculate_family_friendly_localities,
    calculate_safer_localities,
    calculate_better_connected_localities,
    FEATURE_KEYS
)
from ai import ai_service
from caching import cache_manager
from observability import (
    recommendation_generation_failures_total,
    recommendation_geo_drift_index,
    recommendation_stale_count
)
import structlog

logger = structlog.get_logger("recommendation.jobs")


async def run_nightly_recommendation_recomputation(session: AsyncSession) -> None:
    """
    Nightly background task.
    Compiles features for all localities, normalizes them, detects feature drift,
    computes top recommendations for all types, clears stale records, and saves snapshots.
    """
    logger.info("Starting nightly recommendation recomputation job...")
    run_record = models.RecommendationRun(status="RUNNING")
    session.add(run_record)
    await session.commit()

    try:
        # 1. Fetch all localities with metrics and scores
        loc_query = select(models.Locality)
        res_loc = await session.execute(loc_query)
        localities = res_loc.scalars().all()

        if not localities:
            raise ValueError("No localities found in database. Cannot run recommendation calculations.")

        localities_raw = []
        for loc in localities:
            # Query metrics
            metrics_query = select(models.LocalityMetrics).where(models.LocalityMetrics.locality_id == loc.id)
            res_m = await session.execute(metrics_query)
            metrics = res_m.scalars().first()

            # Query scores
            scores_query = select(models.LocalityScores).where(models.LocalityScores.locality_id == loc.id)
            res_s = await session.execute(scores_query)
            scores = res_s.scalars().first()

            # Extract features
            feats = extract_locality_features(metrics, scores)
            
            localities_raw.append({
                "locality_id": loc.id,
                "name": loc.name,
                "city": loc.city,
                "state": loc.state,
                "features": feats
            })

        # 2. Normalize features
        normalized_data, bounds = normalize_features(localities_raw)

        # 3. Calculate current features summary (means) for drift tracking
        features_summary = {}
        for key in FEATURE_KEYS:
            vals = [loc["raw_features"][key] for loc in normalized_data]
            mean_val = statistics.mean(vals) if vals else 0.0
            std_val = statistics.stdev(vals) if len(vals) > 1 else 0.0
            features_summary[key] = {
                "mean": mean_val,
                "std": std_val
            }

        # 4. Check Feature Drift against last successful run
        last_run_query = select(models.RecommendationRun).where(
            models.RecommendationRun.status == "SUCCESS"
        ).order_by(models.RecommendationRun.run_timestamp.desc()).limit(1)
        
        last_run_res = await session.execute(last_run_query)
        last_run = last_run_res.scalars().first()

        if last_run and last_run.features_summary:
            prev_summary = last_run.features_summary
            for key in FEATURE_KEYS:
                if key in prev_summary:
                    curr_mean = features_summary[key]["mean"]
                    prev_mean = prev_summary[key]["mean"]
                    drift = abs(curr_mean - prev_mean)
                    # Expose drift to Prometheus
                    recommendation_geo_drift_index.labels(feature_name=key).set(drift)
                    logger.info("Feature drift computed", feature=key, drift=drift)
        else:
            # First successful run, no drift
            for key in FEATURE_KEYS:
                recommendation_geo_drift_index.labels(feature_name=key).set(0.0)

        # 5. Measure stale count (recommendations older than 24 hours)
        day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        stale_query = select(models.LocalityRecommendation).where(
            models.LocalityRecommendation.created_at < day_ago
        )
        stale_res = await session.execute(stale_query)
        stale_records = stale_res.scalars().all()
        recommendation_stale_count.set(len(stale_records))

        # 6. Generate Recommendations and Save Snapshots
        all_recommendations = []
        for target in normalized_data:
            # Rule-based recommendations (is_llm = False)
            rec_similar = calculate_similar_localities(target, normalized_data, limit=5)
            for r in rec_similar:
                r["is_llm"] = False
            all_recommendations.extend(rec_similar)

            rec_cheaper = calculate_cheaper_alternatives(target, normalized_data, limit=5)
            for r in rec_cheaper:
                r["is_llm"] = False
            all_recommendations.extend(rec_cheaper)

            rec_premium = calculate_premium_alternatives(target, normalized_data, limit=5)
            for r in rec_premium:
                r["is_llm"] = False
            all_recommendations.extend(rec_premium)

            rec_growth = calculate_high_growth_localities(target, normalized_data, limit=5)
            for r in rec_growth:
                r["is_llm"] = False
            all_recommendations.extend(rec_growth)

            rec_family = calculate_family_friendly_localities(target, normalized_data, limit=5)
            for r in rec_family:
                r["is_llm"] = False
            all_recommendations.extend(rec_family)

            rec_safer = calculate_safer_localities(target, normalized_data, limit=5)
            for r in rec_safer:
                r["is_llm"] = False
            all_recommendations.extend(rec_safer)

            rec_connected = calculate_better_connected_localities(target, normalized_data, limit=5)
            for r in rec_connected:
                r["is_llm"] = False
            all_recommendations.extend(rec_connected)

            # LLM-based recommendations (is_llm = True) if API key available
            if ai_service.api_key and "secure" not in ai_service.api_key and ai_service.api_key != "AIzaSyDC_Obdu6DGqdB_x3YqOrz8KXi8Lmd6Zzc":
                for r_type in ["SIMILAR", "CHEAPER", "PREMIUM", "HIGH_GROWTH", "FAMILY_FRIENDLY", "SAFER", "BETTER_CONNECTED"]:
                    try:
                        llm_recs = await ai_service.generate_recommendations(target, normalized_data, r_type, limit=5)
                        if llm_recs:
                            for r in llm_recs:
                                r["is_llm"] = True
                            all_recommendations.extend(llm_recs)
                    except Exception as ex:
                        logger.warning("Failed to generate LLM recommendations nightly wrapper", target=target["name"], type=r_type, error=str(ex))

        # 7. Write to PostgreSQL: clear old recommendations first, then write new
        # Clean existing locality recommendations
        await session.execute(delete(models.LocalityRecommendation))
        
        # Save newly calculated ones
        for rec in all_recommendations:
            db_rec = models.LocalityRecommendation(
                target_locality_id=rec["target_locality_id"],
                recommended_locality_id=rec["recommended_locality_id"],
                recommendation_type=rec["recommendation_type"],
                score=rec["score"],
                reasoning=rec["reasoning"],
                feature_contribution=rec["feature_contribution"],
                is_llm=rec["is_llm"]
            )
            session.add(db_rec)

        # Update run stats
        run_record.status = "SUCCESS"
        run_record.features_summary = features_summary
        run_record.run_timestamp = datetime.now(timezone.utc)
        await session.commit()
        logger.info("Successfully updated recommendations table", count=len(all_recommendations))

        # 8. Clear Redis Cache for all localities to prevent stale reads
        for loc in localities:
            await cache_manager.clear_recommendation_cache(str(loc.id))
        logger.info("Redis cache invalidated successfully.")

    except Exception as e:
        error_msg = str(e)
        logger.error("Failed to recompute recommendations", error=error_msg)
        recommendation_generation_failures_total.inc()
        
        run_record.status = "FAILURE"
        run_record.error_message = error_msg
        run_record.run_timestamp = datetime.now(timezone.utc)
        await session.commit()
        raise e
