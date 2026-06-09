import pytest
from datetime import datetime, timezone
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch
from main import app, database, cache_manager
import models


@pytest.mark.asyncio
async def test_get_similar_localities(client, mock_db):
    target_id = uuid4()
    recommended_id = uuid4()
    
    rec = models.LocalityRecommendation(
        target_locality_id=target_id,
        recommended_locality_id=recommended_id,
        recommendation_type="SIMILAR",
        score=0.9254,
        reasoning="Peelamedu is similar because of scores.",
        feature_contribution={"price": 0.9},
        created_at=datetime.now(timezone.utc)
    )
    
    # Mock join query returning (Recommendation, name, city, state)
    mock_result = MagicMock()
    mock_result.all.return_value = [(rec, "Peelamedu", "Coimbatore", "Tamil Nadu")]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)), \
         patch.object(cache_manager, "set", AsyncMock()) as mock_cache_set:
         
        response = client.get(f"/localities/{target_id}/similar")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Peelamedu"
        assert data[0]["score"] == 0.9254
        assert data[0]["recommendation_type"] == "SIMILAR"
        assert mock_cache_set.called

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_locality_alternatives(client, mock_db):
    target_id = uuid4()
    recommended_id = uuid4()
    
    rec = models.LocalityRecommendation(
        target_locality_id=target_id,
        recommended_locality_id=recommended_id,
        recommendation_type="CHEAPER",
        score=0.8875,
        reasoning="PSG Ave is cheaper.",
        feature_contribution={"price_savings": 0.20},
        created_at=datetime.now(timezone.utc)
    )
    
    mock_result = MagicMock()
    mock_result.all.return_value = [(rec, "PSG Avenue", "Coimbatore", "Tamil Nadu")]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)), \
         patch.object(cache_manager, "set", AsyncMock()):
         
        response = client.get(f"/localities/{target_id}/alternatives?type=CHEAPER")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "PSG Avenue"
        assert data[0]["recommendation_type"] == "CHEAPER"
        assert data[0]["score"] == 0.8875

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_recommendation_metadata(client, mock_db):
    target_id = uuid4()
    
    run = models.RecommendationRun(
        run_timestamp=datetime.now(timezone.utc),
        status="SUCCESS",
        features_summary={"price": {"mean": 4500.0, "std": 500.0}}
    )

    # Sequence of mocks:
    # 1. Query last successful run
    mock_res_run = MagicMock()
    mock_res_run.scalars.return_value.first.return_value = run

    # 2. Total active recommendations
    mock_res_count = MagicMock()
    mock_res_count.scalar_one.return_value = 150

    # 3. Stale count
    mock_res_stale = MagicMock()
    mock_res_stale.scalar_one.return_value = 12

    mock_db.execute.side_effect = [mock_res_run, mock_res_count, mock_res_stale]

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    response = client.get(f"/localities/{target_id}/recommendation-metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["total_recommendations_count"] == 150
    assert data["stale_count"] == 12
    assert "price" in data["feature_drift_metrics"]

    app.dependency_overrides.clear()


def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "recommendation_requests_total" in response.text


@pytest.mark.asyncio
async def test_health_endpoint(client, mock_db):
    app.dependency_overrides[database.get_db_session] = lambda: mock_db
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "postgres" in data["services"]
    assert "redis" in data["services"]
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_locality_alternatives_advanced(client, mock_db):
    target_id = uuid4()
    recommended_id = uuid4()
    
    rec_safer = models.LocalityRecommendation(
        target_locality_id=target_id,
        recommended_locality_id=recommended_id,
        recommendation_type="SAFER",
        score=0.85,
        reasoning="Safer alternative.",
        feature_contribution={},
        created_at=datetime.now(timezone.utc)
    )
    
    mock_result = MagicMock()
    mock_result.all.return_value = [(rec_safer, "Safer Neighborhood", "Coimbatore", "Tamil Nadu")]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)), \
         patch.object(cache_manager, "set", AsyncMock()):
         
        response = client.get(f"/localities/{target_id}/alternatives?type=SAFER")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["recommendation_type"] == "SAFER"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_similar_localities_llm_on_the_fly(client, mock_db):
    target_id = uuid4()
    recommended_id = uuid4()

    # DB query returns empty list for LLM
    mock_result_empty = MagicMock()
    mock_result_empty.all.return_value = []
    
    mock_db.execute.return_value = mock_result_empty
    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    # Setup mock localities for feature extraction
    loc1 = models.Locality(id=target_id, name="RS Puram", city="Coimbatore", state="Tamil Nadu")
    loc2 = models.Locality(id=recommended_id, name="Peelamedu", city="Coimbatore", state="Tamil Nadu")
    
    mock_all_features = [
        {"locality_id": target_id, "name": "RS Puram", "city": "Coimbatore", "state": "Tamil Nadu", "raw_features": {}},
        {"locality_id": recommended_id, "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu", "raw_features": {}}
    ]

    llm_recs = [
        {
            "target_locality_id": target_id,
            "recommended_locality_id": str(recommended_id),
            "recommendation_type": "SIMILAR",
            "score": 0.90,
            "reasoning": "Matching scores.",
            "feature_contribution": {}
        }
    ]

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)), \
         patch.object(cache_manager, "set", AsyncMock()), \
         patch("main.get_all_locality_feature_vectors", AsyncMock(return_value=mock_all_features)), \
         patch("ai.ai_service.generate_recommendations", AsyncMock(return_value=llm_recs)):
         
        response = client.get(f"/localities/{target_id}/similar?use_llm=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Peelamedu"
        assert data[0]["score"] == 0.90
        assert mock_db.commit.called

    app.dependency_overrides.clear()

