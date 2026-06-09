from datetime import datetime
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from main import app, database, cache_manager
from models import Locality, LocalityMetrics, LocalityScores, LocalityPriceHistory


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_db():
    session = MagicMock()
    session.execute = AsyncMock()
    return session


@pytest.mark.asyncio
async def test_get_localities(client, mock_db):
    locality = Locality(
        id=uuid4(),
        name="RS Puram",
        city="Coimbatore",
        state="Tamil Nadu",
        location=None
    )
    
    # Mock database output
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [locality]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    response = client.get("/localities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "RS Puram"
    
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_locality_by_id(client, mock_db):
    loc_id = uuid4()
    locality = Locality(
        id=loc_id,
        name="Gandhipuram",
        city="Coimbatore",
        state="Tamil Nadu",
        location=None
    )
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = locality
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    response = client.get(f"/localities/{loc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(loc_id)
    assert data["name"] == "Gandhipuram"
    
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_locality_metrics_cached(client):
    loc_id = uuid4()
    mock_metrics_data = {
        "locality_id": str(loc_id),
        "property": {"property_inventory": 45, "avg_property_price": 7500000.0},
        "amenities": {"schools_per_sq_km": 2.5},
        "accessibility": {"highway_access_score": 85.0},
        "infrastructure": {"metro_proximity": 4500.0},
        "updated_at": "2026-06-09T23:30:00Z"
    }

    with patch.object(cache_manager, "get", AsyncMock(return_value=mock_metrics_data)):
        response = client.get(f"/localities/{loc_id}/metrics")
        assert response.status_code == 200
        data = response.json()
        assert data["property"]["property_inventory"] == 45
        assert data["amenities"]["schools_per_sq_km"] == 2.5


@pytest.mark.asyncio
async def test_get_locality_scores(client, mock_db):
    loc_id = uuid4()
    scores = LocalityScores(
        locality_id=loc_id,
        education_score=85.0,
        healthcare_score=75.0,
        lifestyle_score=90.0,
        connectivity_score=80.0,
        investment_score=92.0,
        updated_at=datetime.utcnow()
    )

    metrics = LocalityMetrics(
        locality_id=loc_id,
        schools_per_sq_km=4.25,
        hospitals_per_sq_km=2.25,
        restaurants_per_sq_km=15.0,
        gyms_per_sq_km=3.0,
        parks_per_sq_km=1.5,
        nearest_railway_station=None,
        nearest_airport=None,
        nearest_bus_terminal=None,
        highway_access_score=80.0,
        rental_yield_estimate=4.5,
        listing_velocity=12.0,
        it_park_proximity=2500.0,
        industrial_corridor_proximity=6000.0
    )

    # Mock DB query results for score and metrics
    mock_result_scores = MagicMock()
    mock_result_scores.scalars.return_value.first.return_value = scores
    
    mock_result_metrics = MagicMock()
    mock_result_metrics.scalars.return_value.first.return_value = metrics
    
    mock_db.execute.side_effect = [mock_result_scores, mock_result_metrics]

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)), \
         patch.object(cache_manager, "set", AsyncMock()) as mock_cache_set:
         
        response = client.get(f"/localities/{loc_id}/scores")
        assert response.status_code == 200
        data = response.json()
        assert data["education_score"] == 85.0
        assert data["investment_score"] == 92.0
        assert "education" in data["explanations"]
        assert mock_cache_set.called

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_locality_price_history(client, mock_db):
    loc_id = uuid4()
    history = LocalityPriceHistory(
        locality_id=loc_id,
        year=2026,
        quarter=2,
        avg_price_per_sqft=4500.0,
        median_price_per_sqft=4200.0
    )

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [history]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)):
        response = client.get(f"/localities/{loc_id}/history")
        assert response.status_code == 200
        data = response.json()
        assert len(data["history"]) == 1
        assert data["history"][0]["year"] == 2026
        assert data["history"][0]["quarter"] == 2

    app.dependency_overrides.clear()


def test_health_endpoint(client, mock_db):
    app.dependency_overrides[database.get_db_session] = lambda: mock_db
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "postgres" in data["services"]
    app.dependency_overrides.clear()
