import pytest
from engine import (
    cosine_similarity,
    euclidean_similarity,
    normalize_features,
    calculate_similar_localities,
    calculate_cheaper_alternatives,
    calculate_premium_alternatives,
    calculate_high_growth_localities,
    calculate_family_friendly_localities,
    calculate_safer_localities,
    calculate_better_connected_localities
)


def test_distance_metrics():
    v1 = {"a": 1.0, "b": 0.0, "c": 0.0}
    v2 = {"a": 0.0, "b": 1.0, "c": 0.0}
    v3 = {"a": 0.8, "b": 0.0, "c": 0.0}

    # Cosine Similarity checks
    assert cosine_similarity(v1, v1, ["a", "b", "c"]) == pytest.approx(1.0)
    assert cosine_similarity(v1, v2, ["a", "b", "c"]) == pytest.approx(0.0)
    assert cosine_similarity(v1, v3, ["a", "b", "c"]) == pytest.approx(1.0)  # Colinear vectors

    # Euclidean Similarity checks (closer = higher score)
    assert euclidean_similarity(v1, v1, ["a", "b", "c"]) == 1.0
    assert euclidean_similarity(v1, v2, ["a", "b", "c"]) == pytest.approx(1.0 / (1.0 + 1.4142), rel=1e-3)


def test_normalize_features():
    raw_data = [
        {
            "locality_id": "1", "name": "Loc A", "city": "CBE", "state": "TN",
            "features": {"price_per_sqft": 3000.0, "education_score": 40.0, "healthcare_score": 50.0,
                         "lifestyle_score": 60.0, "connectivity_score": 70.0, "investment_score": 80.0,
                         "amenity_density": 1.5, "property_inventory": 10.0, "rental_yield": 3.0}
        },
        {
            "locality_id": "2", "name": "Loc B", "city": "CBE", "state": "TN",
            "features": {"price_per_sqft": 5000.0, "education_score": 80.0, "healthcare_score": 70.0,
                         "lifestyle_score": 80.0, "connectivity_score": 90.0, "investment_score": 90.0,
                         "amenity_density": 3.5, "property_inventory": 20.0, "rental_yield": 5.0}
        }
    ]

    normalized, bounds = normalize_features(raw_data)
    assert len(normalized) == 2
    
    # Loc A should have min features (normalized to 0.0)
    assert normalized[0]["normalized_features"]["price_per_sqft"] == 0.0
    assert normalized[0]["normalized_features"]["education_score"] == 0.0

    # Loc B should have max features (normalized to 1.0)
    assert normalized[1]["normalized_features"]["price_per_sqft"] == 1.0
    assert normalized[1]["normalized_features"]["education_score"] == 1.0

    # Check bounds
    assert bounds["price_per_sqft"]["min"] == 3000.0
    assert bounds["price_per_sqft"]["max"] == 5000.0


def test_recommendation_ranking_similar():
    candidates = [
        {
            "locality_id": "1", "name": "Target Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 4000.0},
            "normalized_features": {"price_per_sqft": 0.5, "education_score": 0.5, "healthcare_score": 0.5,
                                    "lifestyle_score": 0.5, "connectivity_score": 0.5, "investment_score": 0.5,
                                    "amenity_density": 0.5, "property_inventory": 0.5, "rental_yield": 0.5}
        },
        {
            "locality_id": "2", "name": "Similar Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 4200.0},
            "normalized_features": {"price_per_sqft": 0.52, "education_score": 0.51, "healthcare_score": 0.49,
                                    "lifestyle_score": 0.5, "connectivity_score": 0.51, "investment_score": 0.48,
                                    "amenity_density": 0.5, "property_inventory": 0.5, "rental_yield": 0.5}
        },
        {
            "locality_id": "3", "name": "Dissimilar Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 8000.0},
            "normalized_features": {"price_per_sqft": 1.0, "education_score": 0.9, "healthcare_score": 0.8,
                                    "lifestyle_score": 0.1, "connectivity_score": 0.9, "investment_score": 0.9,
                                    "amenity_density": 0.1, "property_inventory": 0.9, "rental_yield": 0.9}
        }
    ]

    recs = calculate_similar_localities(candidates[0], candidates)
    assert len(recs) == 2
    # Ranks similar higher
    assert recs[0]["recommended_locality_id"] == "2"
    assert recs[0]["score"] > recs[1]["score"]
    assert "composite matrix check" in recs[0]["reasoning"]


def test_cheaper_alternatives():
    candidates = [
        {
            "locality_id": "1", "name": "Expensive Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 10000.0},
            "normalized_features": {"price_per_sqft": 1.0, "education_score": 0.8, "healthcare_score": 0.8,
                                    "lifestyle_score": 0.8, "connectivity_score": 0.8, "investment_score": 0.8,
                                    "amenity_density": 0.8, "property_inventory": 0.5, "rental_yield": 3.0}
        },
        {
            "locality_id": "2", "name": "Cheaper Loc (Matches)", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 8000.0},  # 20% cheaper (>=15%)
            "normalized_features": {"price_per_sqft": 0.8, "education_score": 0.79, "healthcare_score": 0.81,
                                    "lifestyle_score": 0.8, "connectivity_score": 0.78, "investment_score": 0.8,
                                    "amenity_density": 0.8, "property_inventory": 0.5, "rental_yield": 3.0}
        },
        {
            "locality_id": "3", "name": "Too Expensive Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 9500.0},  # only 5% cheaper (rejected)
            "normalized_features": {"price_per_sqft": 0.95, "education_score": 0.8, "healthcare_score": 0.8,
                                    "lifestyle_score": 0.8, "connectivity_score": 0.8, "investment_score": 0.8,
                                    "amenity_density": 0.8, "property_inventory": 0.5, "rental_yield": 3.0}
        }
    ]

    recs = calculate_cheaper_alternatives(candidates[0], candidates)
    # Only candidate 2 should match the filter constraint (>= 15% cheaper)
    assert len(recs) == 1
    assert recs[0]["recommended_locality_id"] == "2"
    assert "CHEAPER alternative" in recs[0]["reasoning"]
    assert recs[0]["feature_contribution"]["price_savings"] == 0.20


def test_premium_alternatives():
    candidates = [
        {
            "locality_id": "1", "name": "Basic Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 4000.0, "education_score": 50.0, "healthcare_score": 50.0,
                             "lifestyle_score": 50.0, "connectivity_score": 50.0},
            "normalized_features": {"price_per_sqft": 0.4}
        },
        {
            "locality_id": "2", "name": "Premium Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 6000.0, "education_score": 80.0, "healthcare_score": 75.0,
                             "lifestyle_score": 70.0, "connectivity_score": 85.0},
            "normalized_features": {"price_per_sqft": 0.6}
        }
    ]

    recs = calculate_premium_alternatives(candidates[0], candidates)
    assert len(recs) == 1
    assert recs[0]["recommended_locality_id"] == "2"
    assert recs[0]["feature_contribution"]["price_premium"] == 0.50
    assert "PREMIUM alternative" in recs[0]["reasoning"]


def test_safer_alternatives():
    candidates = [
        {
            "locality_id": "1", "name": "Less Safe Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 4000.0, "education_score": 40.0, "healthcare_score": 40.0,
                             "lifestyle_score": 40.0, "connectivity_score": 50.0},
            "normalized_features": {"price_per_sqft": 0.4}
        },
        {
            "locality_id": "2", "name": "Safer Loc", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 5000.0, "education_score": 80.0, "healthcare_score": 80.0,
                             "lifestyle_score": 80.0, "connectivity_score": 50.0},
            "normalized_features": {"price_per_sqft": 0.5}
        }
    ]

    recs = calculate_safer_localities(candidates[0], candidates)
    assert len(recs) == 1
    assert recs[0]["recommended_locality_id"] == "2"
    assert recs[0]["recommendation_type"] == "SAFER"
    assert recs[0]["feature_contribution"]["safety_gain"] > 0
    assert "SAFER locality" in recs[0]["reasoning"]


def test_better_connected_alternatives():
    candidates = [
        {
            "locality_id": "1", "name": "Poor Connection", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 4000.0, "education_score": 50.0, "healthcare_score": 50.0,
                             "lifestyle_score": 50.0, "connectivity_score": 30.0},
            "normalized_features": {"price_per_sqft": 0.4}
        },
        {
            "locality_id": "2", "name": "Great Connection", "city": "CBE", "state": "TN",
            "raw_features": {"price_per_sqft": 4000.0, "education_score": 50.0, "healthcare_score": 50.0,
                             "lifestyle_score": 50.0, "connectivity_score": 90.0},
            "normalized_features": {"price_per_sqft": 0.4}
        }
    ]

    recs = calculate_better_connected_localities(candidates[0], candidates)
    assert len(recs) == 1
    assert recs[0]["recommended_locality_id"] == "2"
    assert recs[0]["recommendation_type"] == "BETTER_CONNECTED"
    assert recs[0]["feature_contribution"]["connectivity_gain"] == 60.0
    assert "BETTER_CONNECTED alternative" in recs[0]["reasoning"]

