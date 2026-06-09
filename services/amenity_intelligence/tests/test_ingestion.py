import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from ingestion import IngestionPipeline
from models import Amenity


def test_normalizer():
    pipeline = IngestionPipeline(session=MagicMock())
    raw = {
        "name": "   Sree Ram Cafe   ",
        "category": "Cafes",
        "latitude": "11.012",
        "longitude": "76.980",
        "address": " Gandhipuram Road  ",
        "source": "openstreetmap",
        "confidence_score": "0.95"
    }

    normalized = pipeline.normalize(raw)
    assert normalized["name"] == "Sree Ram Cafe"
    assert normalized["category"] == "cafe"
    assert normalized["latitude"] == 11.012
    assert normalized["longitude"] == 76.980
    assert normalized["address"] == "Gandhipuram Road"
    assert normalized["confidence_score"] == 0.95


def test_validator_raises_error():
    pipeline = IngestionPipeline(session=MagicMock())

    # Empty name
    with pytest.raises(ValueError, match="Name cannot be empty"):
        pipeline.validate({"name": "", "category": "park", "latitude": 11.0, "longitude": 76.9})

    # Unsupported category
    with pytest.raises(ValueError, match="Unsupported category"):
        pipeline.validate({"name": "Park", "category": "theme_park", "latitude": 11.0, "longitude": 76.9})

    # Out of range coordinates
    with pytest.raises(ValueError, match="Coordinates out of range"):
        pipeline.validate({"name": "Park", "category": "park", "latitude": 95.0, "longitude": 76.9})

    # Distance too far from Coimbatore (> 100km)
    with pytest.raises(ValueError, match="too far from Coimbatore"):
        pipeline.validate({"name": "Park", "category": "park", "latitude": 13.0827, "longitude": 80.2707})  # Chennai


@pytest.mark.asyncio
async def test_ingest_creation(mock_db):
    pipeline = IngestionPipeline(session=mock_db)

    # 1. Mock deduplicate database query (returns no candidates)
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    payload = {
        "name": "RS Puram Library Park",
        "category": "park",
        "latitude": 11.018,
        "longitude": 76.945,
        "source": "scraper"
    }

    amenity = await pipeline.ingest(payload)
    
    assert amenity is not None
    assert amenity.name == "RS Puram Library Park"
    assert amenity.category == "park"
    assert mock_db.add.called
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_ingest_duplicate_merge(mock_db):
    pipeline = IngestionPipeline(session=mock_db)
    
    existing = Amenity(
        id="88888888-8888-8888-8888-888888888888",
        name="Peelamedu Gym Center",
        category="gym",
        latitude=11.025,
        longitude=77.001,
        address="First Ave",
        confidence_score=0.7,
        source="manual"
    )

    # Mock DB select returns the existing record
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [existing]
    mock_db.execute.return_value = mock_result

    # Payload with better confidence, new address, and new source
    payload = {
        "name": "Peelamedu Gym",
        "category": "gym",
        "latitude": 11.025,
        "longitude": 77.001,
        "address": "First Ave, Peelamedu",
        "source": "openstreetmap",
        "confidence_score": 0.9
    }

    updated = await pipeline.ingest(payload)
    
    assert updated is not None
    assert updated.id == existing.id
    # Address should be merged/updated because it was different/longer
    assert updated.address == "First Ave, Peelamedu"
    # Confidence score should pick the higher one
    assert updated.confidence_score == 0.9
    # Source should append
    assert "openstreetmap" in updated.source
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_ingest_incident_logging(mock_db):
    pipeline = IngestionPipeline(session=mock_db)
    
    # Bad payload that will trigger validator exception
    bad_payload = {
        "name": "",  # triggers name empty error
        "category": "gym",
        "latitude": 11.025,
        "longitude": 77.001,
        "source": "web_portal"
    }

    # Patch log_incident_to_file to check call without write errors
    with patch.object(pipeline, "log_incident_to_file") as mock_log_file:
        with pytest.raises(ValueError):
            await pipeline.ingest(bad_payload)
        
        mock_log_file.assert_called_once()
        args, kwargs = mock_log_file.call_args
        assert args[0] == "web_portal"  # source
        assert args[1] == "validator"   # stage
        assert "Validation failed" in args[3]  # error message
