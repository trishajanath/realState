import pytest
from datetime import datetime, timezone
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch
from main import app, database, cache_manager
from models import Amenity


@pytest.mark.asyncio
async def test_get_amenities(client, mock_db):
    amenity = Amenity(
        id=uuid4(),
        name="Peelamedu Matriculation School",
        category="school",
        latitude=11.02,
        longitude=77.01,
        address="Avinashi Road",
        confidence_score=0.9,
        last_verified_at=datetime.now(timezone.utc)
    )

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [amenity]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    response = client.get("/amenities?category=school&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Peelamedu Matriculation School"
    assert data[0]["category"] == "school"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_amenity_by_id(client, mock_db):
    amenity_id = uuid4()
    amenity = Amenity(
        id=amenity_id,
        name="Singanallur Bus Stop",
        category="bus_stop",
        latitude=11.002,
        longitude=76.998,
        address="Trichy Rd",
        confidence_score=0.8,
        last_verified_at=datetime.now(timezone.utc)
    )

    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = amenity
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)), \
         patch.object(cache_manager, "set", AsyncMock()) as mock_cache_set:
         
        response = client.get(f"/amenities/{amenity_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(amenity_id)
        assert data["category"] == "bus_stop"
        assert mock_cache_set.called

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_nearby_amenities_caps(client):
    # Radius too large (>100km / 100,000 meters)
    response = client.get("/amenities/nearby?latitude=11.01&longitude=76.95&radius_meters=150000")
    assert response.status_code == 400
    assert "radius_meters must be positive and capped" in response.json()["detail"]

    # Negative radius
    response = client.get("/amenities/nearby?latitude=11.01&longitude=76.95&radius_meters=-50")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_nearby_amenities_queries(client, mock_db):
    amenity = Amenity(
        id=uuid4(),
        name="Peelamedu Railway Station",
        category="railway_station",
        latitude=11.025,
        longitude=77.012,
        address="Station Rd",
        confidence_score=1.0,
        last_verified_at=datetime.now(timezone.utc)
    )
    distance_meters = 1250.55

    # Mock DB query returning (Amenity, distance) tuple
    mock_result = MagicMock()
    mock_result.all.return_value = [(amenity, distance_meters)]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    with patch.object(cache_manager, "get", AsyncMock(return_value=None)), \
         patch.object(cache_manager, "set", AsyncMock()):
         
        response = client.get("/amenities/nearby?latitude=11.0168&longitude=76.9558&radius_meters=5000&category=railway_station")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Peelamedu Railway Station"
        assert data[0]["distance_meters"] == 1250.55

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ingest_api(client, mock_db):
    amenity_id = uuid4()
    amenity = Amenity(
        id=amenity_id,
        name="KMCH Hospital",
        category="hospital",
        latitude=11.03,
        longitude=77.02,
        address="Avinashi Rd",
        confidence_score=0.9,
        last_verified_at=datetime.now(timezone.utc)
    )

    # Ingestion pipeline mocks: no duplicate found
    mock_execute_res = MagicMock()
    mock_execute_res.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_execute_res

    app.dependency_overrides[database.get_db_session] = lambda: mock_db

    payload = {
        "name": "KMCH Hospital",
        "category": "hospital",
        "latitude": 11.03,
        "longitude": 77.02,
        "address": "Avinashi Rd",
        "source": "openstreetmap",
        "confidence_score": 0.9
    }

    response = client.post("/amenities/ingest", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "KMCH Hospital"
    assert data["category"] == "hospital"

    app.dependency_overrides.clear()


def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "amenity_intelligence_requests_total" in response.text


@pytest.mark.asyncio
async def test_health_endpoint(client, mock_db):
    app.dependency_overrides[database.get_db_session] = lambda: mock_db
    
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "postgres" in data["services"]
    assert "redis" in data["services"]

    app.dependency_overrides.clear()
