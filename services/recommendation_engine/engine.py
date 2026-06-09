from typing import Dict, Any, List, Tuple
import math
import structlog

logger = structlog.get_logger("recommendation.engine")

FEATURE_KEYS = [
    "price_per_sqft",
    "education_score",
    "healthcare_score",
    "lifestyle_score",
    "connectivity_score",
    "investment_score",
    "amenity_density",
    "property_inventory",
    "rental_yield"
]


def extract_locality_features(metrics_obj: Any, scores_obj: Any) -> Dict[str, float]:
    """
    Extracts raw locality feature vector keys from database metrics and scores records.
    Applies standard default averages for missing data to remain robust.
    """
    # Amenity Density sum: count of all recorded densities
    amenity_density = 0.0
    if metrics_obj:
        amenity_density = (
            (metrics_obj.schools_per_sq_km or 0.0) +
            (metrics_obj.hospitals_per_sq_km or 0.0) +
            (metrics_obj.restaurants_per_sq_km or 0.0) +
            (metrics_obj.grocery_stores_per_sq_km or 0.0) +
            (metrics_obj.gyms_per_sq_km or 0.0) +
            (metrics_obj.parks_per_sq_km or 0.0)
        )

    return {
        "price_per_sqft": float(metrics_obj.median_price_per_sqft) if metrics_obj and metrics_obj.median_price_per_sqft is not None else 4000.0,
        "education_score": float(scores_obj.education_score) if scores_obj and scores_obj.education_score is not None else 50.0,
        "healthcare_score": float(scores_obj.healthcare_score) if scores_obj and scores_obj.healthcare_score is not None else 50.0,
        "lifestyle_score": float(scores_obj.lifestyle_score) if scores_obj and scores_obj.lifestyle_score is not None else 50.0,
        "connectivity_score": float(scores_obj.connectivity_score) if scores_obj and scores_obj.connectivity_score is not None else 50.0,
        "investment_score": float(scores_obj.investment_score) if scores_obj and scores_obj.investment_score is not None else 50.0,
        "amenity_density": amenity_density if amenity_density > 0 else 1.0,
        "property_inventory": float(metrics_obj.property_inventory) if metrics_obj and metrics_obj.property_inventory is not None else 10.0,
        "rental_yield": float(metrics_obj.rental_yield_estimate) if metrics_obj and metrics_obj.rental_yield_estimate is not None else 3.5
    }


def normalize_features(localities_raw: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Dict[str, float]]]:
    """
    Standardizes raw features across all localities using Min-Max Normalization.
    Returns:
        1. List of localities with normalized feature dicts.
        2. Bounds dictionary containing min/max values per feature (useful for drift checking).
    """
    if not localities_raw:
        return [], {}

    # Compile bounds
    bounds = {}
    for key in FEATURE_KEYS:
        vals = [loc["features"][key] for loc in localities_raw]
        bounds[key] = {
            "min": min(vals),
            "max": max(vals)
        }

    normalized = []
    for loc in localities_raw:
        norm_feats = {}
        for key in FEATURE_KEYS:
            min_val = bounds[key]["min"]
            max_val = bounds[key]["max"]
            diff = max_val - min_val
            if diff < 1e-6:
                norm_feats[key] = 0.5
            else:
                norm_feats[key] = (loc["features"][key] - min_val) / diff
        
        normalized.append({
            "locality_id": loc["locality_id"],
            "name": loc["name"],
            "city": loc["city"],
            "state": loc["state"],
            "raw_features": loc["features"],
            "normalized_features": norm_feats
        })

    return normalized, bounds


def cosine_similarity(v1: Dict[str, float], v2: Dict[str, float], keys: List[str]) -> float:
    dot_product = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for key in keys:
        val_a = v1[key]
        val_b = v2[key]
        dot_product += val_a * val_b
        norm_a += val_a ** 2
        norm_b += val_b ** 2

    denom = math.sqrt(norm_a) * math.sqrt(norm_b)
    if denom < 1e-6:
        return 0.0
    return dot_product / denom


def euclidean_similarity(v1: Dict[str, float], v2: Dict[str, float], keys: List[str]) -> float:
    dist_sq = 0.0
    for key in keys:
        dist_sq += (v1[key] - v2[key]) ** 2
    return 1.0 / (1.0 + math.sqrt(dist_sq))


def calculate_similar_localities(
    target: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Identifies localities with matching feature matrices.
    Ranks them using average of Cosine and Euclidean similarity indices.
    """
    results = []
    t_feats = target["normalized_features"]

    for cand in candidates:
        if cand["locality_id"] == target["locality_id"]:
            continue

        c_feats = cand["normalized_features"]
        
        # Calculate similarities
        cos_sim = cosine_similarity(t_feats, c_feats, FEATURE_KEYS)
        euc_sim = euclidean_similarity(t_feats, c_feats, FEATURE_KEYS)
        composite_score = (cos_sim + euc_sim) / 2.0

        # Calculate contributions
        contribution = {}
        for key in FEATURE_KEYS:
            # Match score is 1 - distance
            contribution[key] = round(1.0 - abs(t_feats[key] - c_feats[key]), 3)

        # Generate reasoning description
        sorted_contribs = sorted(contribution.items(), key=lambda x: x[1], reverse=True)
        top_matches = [f"{x[0]} ({x[1]*100:.0f}% match)" for x in sorted_contribs[:3]]
        reasoning = (
            f"Recommended as a SIMILAR locality based on composite matrix check (score: {composite_score:.2f}). "
            f"Key matching attributes: {', '.join(top_matches)}."
        )

        results.append({
            "target_locality_id": target["locality_id"],
            "recommended_locality_id": cand["locality_id"],
            "recommendation_type": "SIMILAR",
            "score": round(composite_score, 4),
            "reasoning": reasoning,
            "feature_contribution": contribution
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def calculate_cheaper_alternatives(
    target: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Finds localities with similar features but pricing at least 15% lower.
    Ranks them using similarity across non-price features.
    """
    results = []
    t_raw = target["raw_features"]
    t_feats = target["normalized_features"]
    target_price = t_raw["price_per_sqft"]

    non_price_keys = [k for k in FEATURE_KEYS if k != "price_per_sqft"]

    for cand in candidates:
        if cand["locality_id"] == target["locality_id"]:
            continue

        c_raw = cand["raw_features"]
        cand_price = c_raw["price_per_sqft"]

        # Check cheaper filter constraint (at least 15% cheaper)
        if target_price > 0:
            price_saving = (target_price - cand_price) / target_price
        else:
            price_saving = 0.0

        if price_saving < 0.15:
            continue

        c_feats = cand["normalized_features"]
        
        # Rank by similarity on non-price vectors
        cos_sim = cosine_similarity(t_feats, c_feats, non_price_keys)
        euc_sim = euclidean_similarity(t_feats, c_feats, non_price_keys)
        similarity = (cos_sim + euc_sim) / 2.0

        # Calculate contributions
        contribution = {"price_savings": round(price_saving, 3)}
        for key in non_price_keys:
            contribution[key] = round(1.0 - abs(t_feats[key] - c_feats[key]), 3)

        saving_pct = price_saving * 100
        reasoning = (
            f"Recommended as a CHEAPER alternative. It offers similar overall scores (match: {similarity*100:.1f}%) "
            f"but at a {saving_pct:.1f}% lower price per sqft (median: {int(cand_price)} INR/sqft vs target {int(target_price)} INR/sqft)."
        )

        results.append({
            "target_locality_id": target["locality_id"],
            "recommended_locality_id": cand["locality_id"],
            "recommendation_type": "CHEAPER",
            "score": round(similarity, 4),
            "reasoning": reasoning,
            "feature_contribution": contribution
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def calculate_premium_alternatives(
    target: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Finds localities with superior livability scores but higher price per sqft.
    Ranks by score improvements.
    """
    results = []
    t_raw = target["raw_features"]
    t_feats = target["normalized_features"]
    
    # Calculate target livability average
    target_livability = (
        t_raw["education_score"] +
        t_raw["healthcare_score"] +
        t_raw["lifestyle_score"] +
        t_raw["connectivity_score"]
    ) / 4.0

    for cand in candidates:
        if cand["locality_id"] == target["locality_id"]:
            continue

        c_raw = cand["raw_features"]
        
        cand_livability = (
            c_raw["education_score"] +
            c_raw["healthcare_score"] +
            c_raw["lifestyle_score"] +
            c_raw["connectivity_score"]
        ) / 4.0

        # Premium must improve livability and be more expensive
        if cand_livability <= target_livability or c_raw["price_per_sqft"] <= t_raw["price_per_sqft"]:
            continue

        price_premium = 0.0
        if t_raw["price_per_sqft"] > 0:
            price_premium = (c_raw["price_per_sqft"] - t_raw["price_per_sqft"]) / t_raw["price_per_sqft"]

        # Composite score tracks improvement magnitude relative to premium
        livability_improvement = cand_livability - target_livability
        rank_score = livability_improvement / (1.0 + price_premium)

        # Contribution
        contribution = {
            "livability_gain": round(livability_improvement, 2),
            "price_premium": round(price_premium, 3),
            "education_gain": round(c_raw["education_score"] - t_raw["education_score"], 2),
            "connectivity_gain": round(c_raw["connectivity_score"] - t_raw["connectivity_score"], 2),
            "healthcare_gain": round(c_raw["healthcare_score"] - t_raw["healthcare_score"], 2)
        }

        reasoning = (
            f"Recommended as a PREMIUM alternative. Offers superior livability (avg score: {cand_livability:.1f} vs target {target_livability:.1f}) "
            f"with a price premium of {price_premium*100:.1f}% (median: {int(c_raw['price_per_sqft'])} INR/sqft vs target {int(t_raw['price_per_sqft'])} INR/sqft)."
        )

        results.append({
            "target_locality_id": target["locality_id"],
            "recommended_locality_id": cand["locality_id"],
            "recommendation_type": "PREMIUM",
            "score": round(rank_score, 4),
            "reasoning": reasoning,
            "feature_contribution": contribution
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def calculate_high_growth_localities(
    target: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Ranks other localities strictly on investment attractiveness index and rental yields.
    """
    results = []
    
    for cand in candidates:
        if cand["locality_id"] == target["locality_id"]:
            continue

        c_raw = cand["raw_features"]
        c_feats = cand["normalized_features"]

        # Composite index: 60% investment score, 40% rental yield score
        growth_score = (c_feats["investment_score"] * 0.6) + (c_feats["rental_yield"] * 0.4)

        contribution = {
            "investment_score": float(c_raw["investment_score"]),
            "rental_yield": float(c_raw["rental_yield"])
        }

        reasoning = (
            f"Recommended as a HIGH_GROWTH area. Features high investment indicators "
            f"(Investment index: {c_raw['investment_score']:.1f}/100, Est. Rental Yield: {c_raw['rental_yield']:.2f}%)."
        )

        results.append({
            "target_locality_id": target["locality_id"],
            "recommended_locality_id": cand["locality_id"],
            "recommendation_type": "HIGH_GROWTH",
            "score": round(growth_score, 4),
            "reasoning": reasoning,
            "feature_contribution": contribution
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def calculate_family_friendly_localities(
    target: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Ranks candidates strictly on family indices: access to schools, hospitals, and parks/lifestyle.
    """
    results = []

    for cand in candidates:
        if cand["locality_id"] == target["locality_id"]:
            continue

        c_raw = cand["raw_features"]
        c_feats = cand["normalized_features"]

        # Family index: average of education, healthcare, and lifestyle normalized scores
        family_score = (c_feats["education_score"] + c_feats["healthcare_score"] + c_feats["lifestyle_score"]) / 3.0

        contribution = {
            "education_score": float(c_raw["education_score"]),
            "healthcare_score": float(c_raw["healthcare_score"]),
            "lifestyle_score": float(c_raw["lifestyle_score"])
        }

        reasoning = (
            f"Recommended as a FAMILY_FRIENDLY neighborhood due to high access scores. "
            f"Breakdown: Schools ({c_raw['education_score']:.1f}), Healthcare ({c_raw['healthcare_score']:.1f}), "
            f"Lifestyle & Parks ({c_raw['lifestyle_score']:.1f})."
        )

        results.append({
            "target_locality_id": target["locality_id"],
            "recommended_locality_id": cand["locality_id"],
            "recommendation_type": "FAMILY_FRIENDLY",
            "score": round(family_score, 4),
            "reasoning": reasoning,
            "feature_contribution": contribution
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def calculate_safer_localities(
    target: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Finds alternative localities that are safer.
    Safety is proxied using a combination of education, healthcare, and lifestyle features.
    Ranks them by the proxy safety score improvement.
    """
    results = []
    t_raw = target["raw_features"]
    
    # Proxy Safety = 30% Education + 30% Healthcare + 40% Lifestyle
    target_safety = (t_raw["education_score"] * 0.3) + (t_raw["healthcare_score"] * 0.3) + (t_raw["lifestyle_score"] * 0.4)

    for cand in candidates:
        if cand["locality_id"] == target["locality_id"]:
            continue

        c_raw = cand["raw_features"]
        cand_safety = (c_raw["education_score"] * 0.3) + (c_raw["healthcare_score"] * 0.3) + (c_raw["lifestyle_score"] * 0.4)

        if cand_safety <= target_safety:
            continue

        contribution = {
            "education_score": float(c_raw["education_score"]),
            "healthcare_score": float(c_raw["healthcare_score"]),
            "lifestyle_score": float(c_raw["lifestyle_score"]),
            "safety_gain": round(cand_safety - target_safety, 2)
        }

        reasoning = (
            f"Recommended as a SAFER locality (safety index: {cand_safety:.1f}/100 vs target {target_safety:.1f}/100). "
            f"Safety is proxied by rich civic amenities: Schools ({c_raw['education_score']:.1f}), "
            f"Hospitals ({c_raw['healthcare_score']:.1f}), and Lifestyle elements ({c_raw['lifestyle_score']:.1f})."
        )

        results.append({
            "target_locality_id": target["locality_id"],
            "recommended_locality_id": cand["locality_id"],
            "recommendation_type": "SAFER",
            "score": round(cand_safety / 100.0, 4),  # Scale to [0, 1]
            "reasoning": reasoning,
            "feature_contribution": contribution
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def calculate_better_connected_localities(
    target: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Finds localities with a higher connectivity index than the target locality.
    Ranks them by the connectivity score.
    """
    results = []
    t_raw = target["raw_features"]
    t_conn = t_raw["connectivity_score"]

    for cand in candidates:
        if cand["locality_id"] == target["locality_id"]:
            continue

        c_raw = cand["raw_features"]
        c_conn = c_raw["connectivity_score"]

        if c_conn <= t_conn:
            continue

        contribution = {
            "connectivity_score": float(c_conn),
            "connectivity_gain": round(c_conn - t_conn, 2)
        }

        reasoning = (
            f"Recommended as a BETTER_CONNECTED alternative. Features superior transit access "
            f"(Connectivity: {c_conn:.1f}/100 vs target {t_conn:.1f}/100)."
        )

        results.append({
            "target_locality_id": target["locality_id"],
            "recommended_locality_id": cand["locality_id"],
            "recommendation_type": "BETTER_CONNECTED",
            "score": round(c_conn / 100.0, 4),  # Scale to [0, 1]
            "reasoning": reasoning,
            "feature_contribution": contribution
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]

