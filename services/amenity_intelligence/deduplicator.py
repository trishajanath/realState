import structlog
from typing import Optional, List, Dict, Any
from shapely.geometry import Point
import math

logger = structlog.get_logger("amenity.deduplicator")


def jaro_winkler_similarity(s1: str, s2: str) -> float:
    """
    Computes the Jaro-Winkler similarity between two strings.
    Returns a float between 0.0 and 1.0.
    """
    s1 = s1.strip().lower()
    s2 = s2.strip().lower()

    if not s1 or not s2:
        return 0.0

    if s1 == s2:
        return 1.0

    len1 = len(s1)
    len2 = len(s2)

    if len1 == 0 or len2 == 0:
        return 0.0

    # Max matching distance
    match_distance = max(len1, len2) // 2 - 1
    if match_distance < 0:
        match_distance = 0

    s1_matches = [False] * len1
    s2_matches = [False] * len2

    matches = 0
    transpositions = 0

    # Match identification
    for i in range(len1):
        start = max(0, i - match_distance)
        end = min(len2, i + match_distance + 1)
        for j in range(start, end):
            if not s2_matches[j] and s1[i] == s2[j]:
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break

    if matches == 0:
        return 0.0

    # Transposition count
    k = 0
    for i in range(len1):
        if s1_matches[i]:
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1

    t = transpositions // 2

    # Jaro distance
    jaro = (matches / len1 + matches / len2 + (matches - t) / matches) / 3.0

    # Winkler prefix scaling
    prefix_len = 0
    for i in range(min(4, len1, len2)):
        if s1[i] == s2[i]:
            prefix_len += 1
        else:
            break

    # Standard scale constant p=0.1
    winkler = jaro + prefix_len * 0.1 * (1.0 - jaro)
    return winkler


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes distance in meters between two coordinates on WGS-84 ellipsoid.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def find_duplicate(
    incoming_name: str,
    incoming_category: str,
    incoming_lat: float,
    incoming_lon: float,
    candidates: List[Dict[str, Any]],
    distance_threshold_meters: float = 15.0,
    name_similarity_threshold: float = 0.82
) -> Optional[Dict[str, Any]]:
    """
    Searches candidates for potential duplicates matching the rules:
    - Same category
    - Proximity coordinates (within distance threshold)
    - Name similarity (above threshold) OR exact coordinates with similar name.
    """
    for cand in candidates:
        if cand["category"] != incoming_category:
            continue

        cand_lat = cand["latitude"]
        cand_lon = cand["longitude"]

        # Exact coordinates check
        exact_coordinates = (incoming_lat == cand_lat and incoming_lon == cand_lon)

        # Distance check
        dist = 0.0 if exact_coordinates else calculate_haversine_distance(incoming_lat, incoming_lon, cand_lat, cand_lon)

        if dist > distance_threshold_meters:
            continue

        # Name similarity
        sim = jaro_winkler_similarity(incoming_name, cand["name"])

        # Check conditions
        # Case A: Exact coordinate match and name is somewhat similar
        if exact_coordinates and sim >= 0.70:
            logger.info("Duplicate detected by exact coordinate and similar name", name=incoming_name, similarity=sim)
            return cand

        # Case B: Spatial proximity (within threshold) and high name similarity
        if sim >= name_similarity_threshold:
            logger.info("Duplicate detected by proximity and high name similarity", name=incoming_name, similarity=sim, distance=dist)
            return cand

        # Case C: Very close distance (e.g. < 5m) with basic name match (e.g. > 0.50)
        if dist < 5.0 and sim >= 0.50:
            logger.info("Duplicate detected by close proximity and partial name match", name=incoming_name, similarity=sim, distance=dist)
            return cand

    return None
