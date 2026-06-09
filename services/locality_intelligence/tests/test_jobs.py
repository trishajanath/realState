import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

from jobs import run_weekly_scoring, calculate_centroid_if_needed
from models import Locality, LocalityMetrics, LocalityScores
from caching import cache_manager


@pytest.mark.asyncio
async def test_calculate_centroid_if_needed():
    session = MagicMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()

    locality = Locality(
        id=uuid4(),
        name="Singanallur",
        location=None
    )

    # Mock spatial coordinate query response
    # Return average latitude and longitude (11.002, 76.998)
    mock_result = MagicMock()
    mock_result.fetchone.return_value = (11.002, 76.998)
    session.execute.return_value = mock_result

    centroid = await calculate_centroid_if_needed(session, locality)
    
    assert centroid is not None
    # Verify location POINT properties updated
    assert locality.location is not None
    session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_run_weekly_scoring():
    session = MagicMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()

    locality_id = uuid4()
    locality = Locality(id=locality_id, name="Peelamedu")
    
    metrics = LocalityMetrics(
        locality_id=locality_id,
        schools_per_sq_km=2.0,       # score: 40.0
        hospitals_per_sq_km=1.0,     # score: 25.0
        restaurants_per_sq_km=10.0,  # score: 40.0
        gyms_per_sq_km=0.0,
        parks_per_sq_km=0.0,
        nearest_railway_station=None,
        nearest_airport=None,
        nearest_bus_terminal=None,
        highway_access_score=80.0,
        rental_yield_estimate=3.5,
        listing_velocity=5.0,
        it_park_proximity=2000.0,
        industrial_corridor_proximity=10000.0
    )

    # 1. Mock select query on LocalityMetrics returning list
    mock_result_metrics = MagicMock()
    mock_result_metrics.scalars.return_value.all.return_value = [metrics]
    
    # 2. Mock select query on Locality returning single
    mock_result_loc = MagicMock()
    mock_result_loc.scalar_one.return_value = locality
    
    # 3. Mock select query on LocalityScores (return None -> creation)
    mock_result_scores = MagicMock()
    mock_result_scores.scalars.return_value.first.return_value = None

    # Chain execution returns
    session.execute.side_effect = [mock_result_metrics, mock_result_loc, mock_result_scores]

    with patch.object(cache_manager, "clear_locality_cache", AsyncMock()) as mock_clear_cache:
        await run_weekly_scoring(session)

        # Verify added to database
        assert session.add.called
        session.commit.assert_called()
        
        # Verify cache invalidation cleared keys
        mock_clear_cache.assert_called_once_with(str(locality_id))
