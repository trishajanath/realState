from typing import Dict, Any, Tuple


def calculate_education_score(schools_per_sq_km: float) -> Tuple[float, str]:
    density = schools_per_sq_km or 0.0
    # Formula: 100.0 reached at 5 schools per sq km
    score = min(100.0, density * 20.0)
    explanation = f"Education score is {score:.1f}/100. Schools density is {density:.2f} per sq km (Formula: density * 20, capped at 100)."
    return round(score, 2), explanation


def calculate_healthcare_score(hospitals_per_sq_km: float) -> Tuple[float, str]:
    density = hospitals_per_sq_km or 0.0
    # Formula: 100.0 reached at 4 hospitals per sq km
    score = min(100.0, density * 25.0)
    explanation = f"Healthcare score is {score:.1f}/100. Hospitals density is {density:.2f} per sq km (Formula: density * 25, capped at 100)."
    return round(score, 2), explanation


def calculate_lifestyle_score(restaurants: float, gyms: float, parks: float) -> Tuple[float, str]:
    rest_d = restaurants or 0.0
    gym_d = gyms or 0.0
    park_d = parks or 0.0
    
    # Formula: Restaurants weight 4.0, Gyms weight 10.0, Parks weight 20.0
    score = min(100.0, (rest_d * 4.0) + (gym_d * 10.0) + (park_d * 20.0))
    explanation = (
        f"Lifestyle score is {score:.1f}/100. Density factors: Restaurants ({rest_d:.2f}/sq km, weight 4), "
        f"Gyms ({gym_d:.2f}/sq km, weight 10), Parks ({park_d:.2f}/sq km, weight 20). Capped at 100."
    )
    return round(score, 2), explanation


def calculate_connectivity_score(
    railway_dist_meters: float,
    airport_dist_meters: float,
    bus_dist_meters: float,
    highway_score: float
) -> Tuple[float, str]:
    # Convert distances to km (default to large distance if None)
    railway_km = (railway_dist_meters or 15000) / 1000.0
    airport_km = (airport_dist_meters or 35000) / 1000.0
    bus_km = (bus_dist_meters or 10000) / 1000.0
    h_score = highway_score or 50.0

    # Individual component scores (closer is better)
    # 100 points if next door, 0 points if past limits (Railway: 20km, Airport: 40km, Bus: 10km)
    rail_score = max(0.0, 100.0 - (railway_km * 5.0))
    air_score = max(0.0, 100.0 - (airport_km * 2.5))
    terminal_score = max(0.0, 100.0 - (bus_km * 10.0))

    # Weighted composite: 30% Railway, 30% Bus, 20% Airport, 20% Highway Access
    score = (rail_score * 0.3) + (terminal_score * 0.3) + (air_score * 0.2) + (h_score * 0.2)
    
    explanation = (
        f"Connectivity score is {score:.1f}/100. Proximity targets: Nearest Railway Station is {railway_km:.1f}km away (score: {rail_score:.1f}/100), "
        f"Nearest Airport is {airport_km:.1f}km away (score: {air_score:.1f}/100), Bus Terminal is {bus_km:.1f}km away (score: {terminal_score:.1f}/100), "
        f"Highway accessibility index is {h_score:.1f}/100."
    )
    return round(score, 2), explanation


def calculate_investment_score(
    rental_yield: float,
    price_growth_rate: float,
    it_park_dist_meters: float,
    ind_corridor_dist_meters: float,
    listing_velocity: float
) -> Tuple[float, str]:
    yield_val = rental_yield or 3.0
    growth = price_growth_rate or 0.0
    it_km = (it_park_dist_meters or 20000) / 1000.0
    ind_km = (ind_corridor_dist_meters or 20000) / 1000.0
    velocity = listing_velocity or 0.0

    # Scores calculations
    # Rental yield: 5% is a very good yield for Coimbatore, scales to 100 at 6.6%
    yield_score = min(100.0, yield_val * 15.0)
    
    # Growth rate: annual rate (e.g. 8.5% is 85 points)
    growth_score = min(100.0, max(0.0, growth * 10.0))

    # IT and Industrial corridors proximity (closer is better, limit 25km)
    it_score = max(0.0, 100.0 - (it_km * 4.0))
    ind_score = max(0.0, 100.0 - (ind_km * 4.0))

    # Inventory velocity (listings count, e.g. 20 listings in the area = 100 points)
    velocity_score = min(100.0, velocity * 5.0)

    # Weighted composite: 25% Rental Yield, 15% Price Growth, 25% IT Proximity, 20% Industrial Corridor, 15% Velocity
    score = (yield_score * 0.25) + (growth_score * 0.15) + (it_score * 0.25) + (ind_score * 0.20) + (velocity_score * 0.15)

    explanation = (
        f"Investment score is {score:.1f}/100. Factors breakdown: Rental Yield estimate of {yield_val:.2f}% (score: {yield_score:.1f}), "
        f"Annual Price Growth of {growth:.2f}% (score: {growth_score:.1f}), Proximity to IT Parks is {it_km:.1f}km (score: {it_score:.1f}), "
        f"Proximity to Industrial corridors is {ind_km:.1f}km (score: {ind_score:.1f}), listing velocity index is {velocity:.1f} (score: {velocity_score:.1f})."
    )
    return round(score, 2), explanation


def calculate_locality_scores(metrics_obj: Any) -> Tuple[Dict[str, float], Dict[str, str]]:
    """
    Given a LocalityMetrics database object, parses parameters and calculates 
    all score indexes and breakdown justifications.
    """
    # Parse transit distances
    railway_dist = metrics_obj.nearest_railway_station.get("distance_meters") if metrics_obj.nearest_railway_station else None
    airport_dist = metrics_obj.nearest_airport.get("distance_meters") if metrics_obj.nearest_airport else None
    bus_dist = metrics_obj.nearest_bus_terminal.get("distance_meters") if metrics_obj.nearest_bus_terminal else None

    # Scores
    edu, edu_exp = calculate_education_score(metrics_obj.schools_per_sq_km)
    health, health_exp = calculate_healthcare_score(metrics_obj.hospitals_per_sq_km)
    life, life_exp = calculate_lifestyle_score(
        metrics_obj.restaurants_per_sq_km,
        metrics_obj.gyms_per_sq_km,
        metrics_obj.parks_per_sq_km
    )
    conn, conn_exp = calculate_connectivity_score(
        railway_dist,
        airport_dist,
        bus_dist,
        metrics_obj.highway_access_score
    )
    
    # Simple simulated price growth (e.g. 5.0% for Coimbatore)
    price_growth = 5.5  
    invest, invest_exp = calculate_investment_score(
        metrics_obj.rental_yield_estimate,
        price_growth,
        metrics_obj.it_park_proximity,
        metrics_obj.industrial_corridor_proximity,
        metrics_obj.listing_velocity
    )

    # Overall livability calculation: equal weighting of the base components
    overall_livability = (edu + health + life + conn) / 4.0

    scores = {
        "education_score": edu,
        "healthcare_score": health,
        "lifestyle_score": life,
        "connectivity_score": conn,
        "investment_score": invest,
        "overall_livability_score": round(overall_livability, 2)
    }

    explanations = {
        "education": edu_exp,
        "healthcare": health_exp,
        "lifestyle": life_exp,
        "connectivity": conn_exp,
        "investment": invest_exp,
        "overall_livability": f"Overall Neighborhood Livability is {overall_livability:.1f}/100. Computed as the average of Education, Healthcare, Lifestyle, and Connectivity scores."
    }

    return scores, explanations
