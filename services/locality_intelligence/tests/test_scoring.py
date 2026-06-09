import pytest
from scoring import (
    calculate_education_score,
    calculate_healthcare_score,
    calculate_lifestyle_score,
    calculate_connectivity_score,
    calculate_investment_score,
    calculate_locality_scores
)


def test_education_scoring():
    # Zero case
    score, exp = calculate_education_score(0.0)
    assert score == 0.0
    assert "Schools density is 0.00" in exp

    # Normal case: 2 schools per sq km
    score, exp = calculate_education_score(2.0)
    assert score == 40.0

    # Cap case: 6 schools per sq km (Formula limit 5)
    score, exp = calculate_education_score(6.0)
    assert score == 100.0


def test_healthcare_scoring():
    score, exp = calculate_healthcare_score(1.0)
    assert score == 25.0

    score, exp = calculate_healthcare_score(5.0)
    assert score == 100.0


def test_lifestyle_scoring():
    # 2 restaurants, 1 gym, 0.5 parks per sq km
    # (2 * 4) + (1 * 10) + (0.5 * 20) = 8 + 10 + 10 = 28
    score, exp = calculate_lifestyle_score(2.0, 1.0, 0.5)
    assert score == 28.0

    # High densities cap at 100
    score, _ = calculate_lifestyle_score(15.0, 10.0, 5.0)
    assert score == 100.0


def test_connectivity_scoring():
    # Very close transit links (1km railway, 2km airport, 0.5km bus, 90 highway score)
    # railway km * 5.0 -> 5.0 points off (95.0)
    # airport km * 2.5 -> 5.0 points off (95.0)
    # bus km * 10.0 -> 5.0 points off (95.0)
    # composite: 0.3 * 95 + 0.3 * 95 + 0.2 * 95 + 0.2 * 90 = 28.5 + 28.5 + 19 + 18 = 94.0
    score, exp = calculate_connectivity_score(1000.0, 2000.0, 500.0, 90.0)
    assert score == 94.0
    assert "Airport is 2.0km away" in exp


def test_investment_scoring():
    # Rental yield 4.5%, price growth 5.5% (simulated in metrics), 3km IT park, 4km Industrial, 10 listings
    # yield score: 4.5 * 15 = 67.5
    # growth score: 5.5 * 10 = 55.0
    # IT park: 100 - (3 * 4) = 88.0
    # Industrial: 100 - (4 * 4) = 84.0
    # velocity: 10 * 5 = 50.0
    # weighted: 0.25 * 67.5 + 0.15 * 55.0 + 0.25 * 88.0 + 0.20 * 84.0 + 0.15 * 50.0
    # = 16.875 + 8.25 + 22.0 + 16.8 + 7.5 = 71.425 -> 71.43
    score, exp = calculate_investment_score(4.5, 5.5, 3000.0, 4000.0, 10.0)
    assert score == 71.42
    assert "Rental Yield estimate of 4.50%" in exp


def test_overall_locality_scoring():
    class MockMetrics:
        def __init__(self):
            self.locality_id = "test-id"
            self.schools_per_sq_km = 3.0
            self.hospitals_per_sq_km = 2.0
            self.restaurants_per_sq_km = 5.0
            self.gyms_per_sq_km = 2.0
            self.parks_per_sq_km = 1.0
            self.nearest_railway_station = {"distance_meters": 1500.0}
            self.nearest_airport = {"distance_meters": 8000.0}
            self.nearest_bus_terminal = {"distance_meters": 1200.0}
            self.highway_access_score = 80.0
            self.rental_yield_estimate = 4.0
            self.listing_velocity = 8.0
            self.it_park_proximity = 4000.0
            self.industrial_corridor_proximity = 6000.0

    metrics = MockMetrics()
    scores, explanations = calculate_locality_scores(metrics)

    assert scores["education_score"] == 60.0
    assert scores["healthcare_score"] == 50.0
    assert scores["overall_livability_score"] > 0.0
    assert "education" in explanations
    assert "connectivity" in explanations
