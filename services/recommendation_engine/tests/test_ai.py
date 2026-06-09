import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from ai import AIService


@pytest.mark.asyncio
async def test_ai_service_initialization():
    service = AIService()
    assert service.endpoint is not None


@pytest.mark.asyncio
async def test_ai_service_generate_recommendations_success():
    service = AIService()
    service.api_key = "test_key"
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                '[\n'
                                '  {\n'
                                '    "recommended_locality_id": "recommended-uuid-1",\n'
                                '    "score": 0.95,\n'
                                '    "reasoning": "Peelamedu has great schools.",\n'
                                '    "feature_contribution": {"education_score": 0.8}\n'
                                '  }\n'
                                ']'
                            )
                        }
                    ]
                }
            }
        ]
    }

    target = {
        "locality_id": "target-uuid",
        "name": "RS Puram",
        "raw_features": {"price_per_sqft": 6000.0}
    }
    candidates = [
        target,
        {
            "locality_id": "recommended-uuid-1",
            "name": "Peelamedu",
            "raw_features": {"price_per_sqft": 5000.0}
        }
    ]

    with patch("httpx.AsyncClient.post", AsyncMock(return_value=mock_response)):
        recs = await service.generate_recommendations(target, candidates, "SIMILAR")
        assert recs is not None
        assert len(recs) == 1
        assert recs[0]["recommended_locality_id"] == "recommended-uuid-1"
        assert recs[0]["score"] == 0.95
        assert recs[0]["recommendation_type"] == "SIMILAR"
        assert recs[0]["feature_contribution"]["education_score"] == 0.8


@pytest.mark.asyncio
async def test_ai_service_generate_recommendations_markdown_wrapper():
    service = AIService()
    service.api_key = "test_key"
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                '```json\n'
                                '[\n'
                                '  {\n'
                                '    "recommended_locality_id": "recommended-uuid-1",\n'
                                '    "score": 0.85,\n'
                                '    "reasoning": "Peelamedu matches connectivity.",\n'
                                '    "feature_contribution": {}\n'
                                '  }\n'
                                ']\n'
                                '```'
                            )
                        }
                    ]
                }
            }
        ]
    }

    target = {
        "locality_id": "target-uuid",
        "name": "RS Puram",
        "raw_features": {}
    }
    candidates = [
        target,
        {
            "locality_id": "recommended-uuid-1",
            "name": "Peelamedu",
            "raw_features": {}
        }
    ]

    with patch("httpx.AsyncClient.post", AsyncMock(return_value=mock_response)):
        recs = await service.generate_recommendations(target, candidates, "SIMILAR")
        assert recs is not None
        assert len(recs) == 1
        assert recs[0]["recommended_locality_id"] == "recommended-uuid-1"
        assert recs[0]["score"] == 0.85


@pytest.mark.asyncio
async def test_ai_service_empty_or_failed():
    service = AIService()
    service.api_key = "test_key"

    mock_response = MagicMock()
    mock_response.status_code = 500

    target = {
        "locality_id": "target-uuid",
        "name": "RS Puram",
        "raw_features": {}
    }
    candidates = [
        target,
        {
            "locality_id": "recommended-uuid-1",
            "name": "Peelamedu",
            "raw_features": {}
        }
    ]

    with patch("httpx.AsyncClient.post", AsyncMock(side_effect=Exception("API timeout"))):
        recs = await service.generate_recommendations(target, candidates, "SIMILAR")
        assert recs is None
