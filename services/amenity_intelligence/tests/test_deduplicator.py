import pytest
from deduplicator import jaro_winkler_similarity, calculate_haversine_distance, find_duplicate


def test_jaro_winkler_similarity():
    # Exact cases
    assert jaro_winkler_similarity("RS Puram School", "rs puram school") == 1.0
    assert jaro_winkler_similarity("", "") == 0.0

    # High similarity cases (Jaro-Winkler >= 0.82)
    sim1 = jaro_winkler_similarity("Kovai Hospital", "Kovai Medical Hospital")
    assert sim1 >= 0.80

    sim2 = jaro_winkler_similarity("Fun Republic Mall", "Fun Mall")
    assert sim2 >= 0.75

    # Dissimilar cases
    sim3 = jaro_winkler_similarity("PSG College", "KMCH Clinic")
    assert sim3 < 0.60


def test_haversine_distance():
    # Coimbatore city center coordinate (approx)
    lat1, lon1 = 11.0168, 76.9558
    # Coordinate ~100m away
    lat2, lon2 = 11.0168, 76.9567
    
    dist = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    assert 90.0 <= dist <= 110.0

    # Same coordinate distance is 0
    assert calculate_haversine_distance(lat1, lon1, lat1, lon1) == 0.0


def test_find_duplicate():
    candidates = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "Peelamedu Clinic",
            "category": "clinic",
            "latitude": 11.025,
            "longitude": 77.001,
            "address": "Avinashi Road",
            "confidence_score": 0.8
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "name": "PSG Hospital",
            "category": "hospital",
            "latitude": 11.028,
            "longitude": 77.003,
            "address": "Peelamedu",
            "confidence_score": 0.9
        }
    ]

    # Duplicate CASE A: Same coordinates, similar name, same category
    dup1 = find_duplicate(
        incoming_name="Peelamedu Medical Clinic",
        incoming_category="clinic",
        incoming_lat=11.025,
        incoming_lon=77.001,
        candidates=candidates
    )
    assert dup1 is not None
    assert dup1["name"] == "Peelamedu Clinic"

    # Duplicate CASE B: Proximity coordinates, similar name, same category
    # Peelamedu coordinate with very slight shift (~5m)
    dup2 = find_duplicate(
        incoming_name="PSG Hospital Peelamedu",
        incoming_category="hospital",
        incoming_lat=11.02802,
        incoming_lon=77.00302,
        candidates=candidates
    )
    assert dup2 is not None
    assert dup2["name"] == "PSG Hospital"

    # CASE C: Dissimilar Name, Same Category (should not match)
    dup3 = find_duplicate(
        incoming_name="KMCH Hospital",
        incoming_category="hospital",
        incoming_lat=11.02805,
        incoming_lon=77.00305,
        candidates=candidates
    )
    assert dup3 is None

    # CASE D: Different Category, Same Name and Coordinate (should not match)
    dup4 = find_duplicate(
        incoming_name="Peelamedu Clinic",
        incoming_category="pharmacy",
        incoming_lat=11.025,
        incoming_lon=77.001,
        candidates=candidates
    )
    assert dup4 is None
