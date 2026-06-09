import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

from jobs import run_nightly_recommendation_recomputation
import models
from caching import cache_manager


@pytest.mark.asyncio
async def test_run_nightly_recommendation_recomputation(mock_db):
    locality_id_1 = uuid4()
    locality_id_2 = uuid4()

    loc1 = models.Locality(id=locality_id_1, name="Peelamedu", city="Coimbatore", state="Tamil Nadu")
    loc2 = models.Locality(id=locality_id_2, name="RS Puram", city="Coimbatore", state="Tamil Nadu")

    metrics1 = models.LocalityMetrics(
        locality_id=locality_id_1,
        median_price_per_sqft=4500.0,
        property_inventory=25,
        rental_yield_estimate=3.8
    )
    metrics2 = models.LocalityMetrics(
        locality_id=locality_id_2,
        median_price_per_sqft=5500.0,
        property_inventory=40,
        rental_yield_estimate=3.2
    )

    scores1 = models.LocalityScores(
        locality_id=locality_id_1,
        education_score=75.0,
        healthcare_score=80.0,
        lifestyle_score=85.0,
        connectivity_score=70.0,
        investment_score=75.0
    )
    scores2 = models.LocalityScores(
        locality_id=locality_id_2,
        education_score=85.0,
        healthcare_score=85.0,
        lifestyle_score=90.0,
        connectivity_score=85.0,
        investment_score=80.0
    )

    # 1. Mock select query for all localities
    mock_res_locs = MagicMock()
    mock_res_locs.scalars.return_value.all.return_value = [loc1, loc2]

    # 2. Mock queries for metrics and scores inside loop
    # Return metrics1, scores1, metrics2, scores2 sequentially
    mock_res_m1 = MagicMock()
    mock_res_m1.scalars.return_value.first.return_value = metrics1

    mock_res_s1 = MagicMock()
    mock_res_s1.scalars.return_value.first.return_value = scores1

    mock_res_m2 = MagicMock()
    mock_res_m2.scalars.return_value.first.return_value = metrics2

    mock_res_s2 = MagicMock()
    mock_res_s2.scalars.return_value.first.return_value = scores2

    # 3. Mock query for previous successful runs (None)
    mock_res_runs = MagicMock()
    mock_res_runs.scalars.return_value.first.return_value = None

    # 4. Mock query for stale recommendations count (returns empty list)
    mock_res_stale = MagicMock()
    mock_res_stale.scalars.return_value.all.return_value = []

    # Sequence of executions
    mock_db.execute.side_effect = [
        mock_res_locs,   # Query all localities
        mock_res_m1,     # metrics for loc1
        mock_res_s1,     # scores for loc1
        mock_res_m2,     # metrics for loc2
        mock_res_s2,     # scores for loc2
        mock_res_runs,   # query previous successful runs
        mock_res_stale,  # query stale recommendations
        MagicMock()      # delete statement execution
    ]

    with patch.object(cache_manager, "clear_recommendation_cache", AsyncMock()) as mock_clear_cache:
        await run_nightly_recommendation_recomputation(mock_db)

        # Check updates persisted
        assert mock_db.commit.called
        assert mock_db.add.called
        
        # Verify cached entries eviction
        assert mock_clear_cache.call_count == 2
        mock_clear_cache.assert_any_call(str(locality_id_1))
        mock_clear_cache.assert_any_call(str(locality_id_2))
