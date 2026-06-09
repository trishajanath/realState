import asyncio
from datetime import datetime, timezone
import statistics
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.elements import WKTElement

import models
from scoring import calculate_locality_scores
from caching import cache_manager
import structlog

logger = structlog.get_logger("locality.jobs")


async def calculate_centroid_if_needed(session: AsyncSession, locality: models.Locality) -> Optional[WKTElement]:
    """
    Calculates the spatial centroid of a locality based on properties coordinates,
    and updates the database if the location column is empty.
    """
    if locality.location is not None:
        return locality.location

    # Query all properties inside this locality to determine the average lat/lng
    query = select(
        func.avg(models.Property.latitude),
        func.avg(models.Property.longitude)
    ).where(models.Property.locality_id == locality.id)

    result = await session.execute(query)
    avg_lat, avg_lon = result.fetchone()

    if avg_lat is not None and avg_lon is not None:
        # Update centroid POINT column
        wkt = f"POINT({avg_lon} {avg_lat})"
        geom = WKTElement(wkt, srid=4326)
        
        locality.location = geom
        session.add(locality)
        await session.commit()
        logger.info("Computed and updated locality centroid location", locality_name=locality.name, centroid=wkt)
        return geom
    
    # Fallback default coordinates for Coimbatore city center
    default_lat, default_lon = 11.0168, 76.9558
    wkt = f"POINT({default_lon} {default_lat})"
    geom = WKTElement(wkt, srid=4326)
    locality.location = geom
    session.add(locality)
    await session.commit()
    return geom


async def fetch_nearest_amenity(
    session: AsyncSession,
    centroid: WKTElement,
    amenity_type: str
) -> Optional[Dict[str, Any]]:
    """
    Finds the nearest amenity of a specific type to the centroid location.
    """
    query = select(
        models.Amenity.name,
        func.ST_Distance(models.Amenity.location, centroid).label("distance")
    ).where(models.Amenity.category == amenity_type).order_by("distance").limit(1)

    result = await session.execute(query)
    row = result.fetchone()
    if row:
        return {
            "name": row[0],
            "distance_meters": round(float(row[1]), 2)
        }
    return None


async def run_nightly_aggregation(session: AsyncSession) -> None:
    """
    Aggregate property data and compute GIS spatial proximity and density metrics.
    """
    logger.info("Starting nightly locality metrics aggregation job...")
    
    # Fetch all localities
    localities_query = select(models.Locality)
    result = await localities_query
    localities = (await session.execute(localities_query)).scalars().all()

    for locality in localities:
        logger.info("Aggregating metrics for locality", name=locality.name)
        
        # 1. Resolve locality centroid coordinates
        centroid = await calculate_centroid_if_needed(session, locality)
        if not centroid:
            logger.warning("Could not resolve centroid location for locality, skipping", name=locality.name)
            continue

        # 2. Property metrics aggregation
        prop_query = select(models.Property).where(models.Property.locality_id == locality.id)
        properties = (await session.execute(prop_query)).scalars().all()

        sale_prices = []
        sale_prices_sqft = []
        rent_prices_sqft = []
        inventory = len(properties)

        for p in properties:
            p_price = float(p.price)
            p_area = float(p.area_sqft)
            price_sqft = p_price / p_area if p_area > 0 else 0.0

            if p.listing_type == "Sale":
                sale_prices.append(p_price)
                if price_sqft > 0:
                    sale_prices_sqft.append(price_sqft)
            elif p.listing_type == "Rent":
                if price_sqft > 0:
                    rent_prices_sqft.append(price_sqft)

        avg_price = statistics.mean(sale_prices) if sale_prices else 0.0
        med_price = statistics.median(sale_prices) if sale_prices else 0.0
        avg_price_sqft = statistics.mean(sale_prices_sqft) if sale_prices_sqft else 0.0
        med_price_sqft = statistics.median(sale_prices_sqft) if sale_prices_sqft else 0.0

        # Rental Yield estimate (Median Monthly Rent/sqft * 12) / Median Sale Price/sqft * 100
        # Average rental yield for Coimbatore defaults to 3.8% if listings are insufficient
        rental_yield = 3.8
        if rent_prices_sqft and med_price_sqft > 0:
            med_rent_sqft = statistics.median(rent_prices_sqft)
            rental_yield = (med_rent_sqft * 12.0) / med_price_sqft * 100.0

        # Listing velocity (listings rate)
        listing_velocity = float(inventory) * 0.8  # placeholder indicator

        # 3. Amenity Density calculations (within 2km radius circle, Area = 12.57 sq km)
        densities = {}
        category_map = {
            "School": "school",
            "Hospital": "hospital",
            "Restaurant": "restaurant",
            "Grocery Store": "grocery_store",
            "Gym": "gym",
            "Park": "park"
        }
        for display_name, cat_val in category_map.items():
            amenity_count_query = select(func.count(models.Amenity.id)).where(
                and_(
                    models.Amenity.category == cat_val,
                    func.ST_DWithin(models.Amenity.location, centroid, 2000)
                )
            )
            count_res = await session.execute(amenity_count_query)
            count = count_res.scalar_one() or 0
            densities[display_name] = float(count) / 12.57

        # 4. Proximity metrics (Railway Station, Airport, Bus Terminal, Highway)
        nearest_railway = await fetch_nearest_amenity(session, centroid, "railway_station")
        nearest_airport = await fetch_nearest_amenity(session, centroid, "airport")
        nearest_bus = await fetch_nearest_amenity(session, centroid, "bus_stop")
        highway_score = 85.0  # standard defaults

        # 5. Infrastructure metrics
        metro_res = await fetch_nearest_amenity(session, centroid, "metro_station")
        metro_proximity = metro_res["distance_meters"] if metro_res else 12000.0

        it_park_res = await fetch_nearest_amenity(session, centroid, "it_park")
        it_park_proximity = it_park_res["distance_meters"] if it_park_res else 8000.0

        ind_res = await fetch_nearest_amenity(session, centroid, "industrial_corridor")
        ind_proximity = ind_res["distance_meters"] if ind_res else 15000.0

        planned_projects = [
            {"project_name": "Coimbatore Bypass expansion", "status": "Proposed", "distance_meters": 3500},
            {"project_name": "TIDEL Park Phase-II", "status": "Under Construction", "distance_meters": 6200}
        ]

        # 6. Upsert Metrics record
        metrics_select = select(models.LocalityMetrics).where(models.LocalityMetrics.locality_id == locality.id)
        metrics_obj = (await session.execute(metrics_select)).scalars().first()

        if not metrics_obj:
            metrics_obj = models.LocalityMetrics(locality_id=locality.id)
            session.add(metrics_obj)

        metrics_obj.avg_property_price = avg_price
        metrics_obj.median_property_price = med_price
        metrics_obj.avg_price_per_sqft = avg_price_sqft
        metrics_obj.median_price_per_sqft = med_price_sqft
        metrics_obj.rental_yield_estimate = rental_yield
        metrics_obj.listing_velocity = listing_velocity
        metrics_obj.property_inventory = inventory
        metrics_obj.schools_per_sq_km = densities["School"]
        metrics_obj.hospitals_per_sq_km = densities["Hospital"]
        metrics_obj.restaurants_per_sq_km = densities["Restaurant"]
        metrics_obj.grocery_stores_per_sq_km = densities["Grocery Store"]
        metrics_obj.gyms_per_sq_km = densities["Gym"]
        metrics_obj.parks_per_sq_km = densities["Park"]
        metrics_obj.nearest_railway_station = nearest_railway
        metrics_obj.nearest_airport = nearest_airport
        metrics_obj.nearest_bus_terminal = nearest_bus
        metrics_obj.highway_access_score = highway_score
        metrics_obj.planned_projects = planned_projects
        metrics_obj.metro_proximity = metro_proximity
        metrics_obj.industrial_corridor_proximity = ind_proximity
        metrics_obj.it_park_proximity = it_park_proximity
        metrics_obj.updated_at = datetime.now(timezone.utc)

        # 7. Record pricing trend history entry for current quarter
        now = datetime.now()
        quarter = (now.month - 1) // 3 + 1
        year = now.year

        history_select = select(models.LocalityPriceHistory).where(
            and_(
                models.LocalityPriceHistory.locality_id == locality.id,
                models.LocalityPriceHistory.year == year,
                models.LocalityPriceHistory.quarter == quarter
            )
        )
        history_obj = (await session.execute(history_select)).scalars().first()

        if not history_obj:
            history_obj = models.LocalityPriceHistory(
                locality_id=locality.id,
                year=year,
                quarter=quarter
            )
            session.add(history_obj)

        history_obj.avg_price_per_sqft = avg_price_sqft
        history_obj.median_price_per_sqft = med_price_sqft

        await session.commit()
        logger.info("Persisted nightly locality metrics successfully", locality_name=locality.name)

        # 8. Clear Redis caches for this locality
        await cache_manager.clear_locality_cache(str(locality.id))

    logger.info("Nightly locality aggregation job completed.")


async def run_weekly_scoring(session: AsyncSession) -> None:
    """
    Evaluates computed metrics against scoring engine calculators.
    """
    logger.info("Starting weekly locality scoring recomputation job...")
    
    metrics_query = select(models.LocalityMetrics)
    metrics_list = (await session.execute(metrics_query)).scalars().all()

    for metrics_obj in metrics_list:
        locality_select = select(models.Locality).where(models.Locality.id == metrics_obj.locality_id)
        locality = (await session.execute(locality_select)).scalar_one()

        logger.info("Calculating score benchmarks for locality", name=locality.name)
        scores, explanations = calculate_locality_scores(metrics_obj)

        # Upsert locality scores
        score_select = select(models.LocalityScores).where(models.LocalityScores.locality_id == metrics_obj.locality_id)
        scores_obj = (await session.execute(score_select)).scalars().first()

        if not scores_obj:
            scores_obj = models.LocalityScores(locality_id=metrics_obj.locality_id)
            session.add(scores_obj)

        scores_obj.education_score = scores["education_score"]
        scores_obj.healthcare_score = scores["healthcare_score"]
        scores_obj.lifestyle_score = scores["lifestyle_score"]
        scores_obj.connectivity_score = scores["connectivity_score"]
        scores_obj.investment_score = scores["investment_score"]
        scores_obj.updated_at = datetime.now(timezone.utc)

        await session.commit()
        logger.info("Persisted weekly locality scores successfully", locality_name=locality.name, scores=scores)

        # Clear caches
        await cache_manager.clear_locality_cache(str(metrics_obj.locality_id))

    logger.info("Weekly scoring job completed successfully.")
