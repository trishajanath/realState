from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

from core.database import get_mongo_db
from schemas.locality import LocalityResponse, LocalityMetricsResponse, LocalityScoresResponse, RecommendationItemResponse
from services.locality_service import LocalityService

router = APIRouter()


@router.get("", response_model=List[LocalityResponse])
async def list_localities(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = LocalityService(mongo_db)
    return await service.list_localities(skip=skip, limit=limit)


@router.get("/{locality_id}", response_model=LocalityResponse)
async def get_locality(
    locality_id: str,
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = LocalityService(mongo_db)
    loc = await service.get_locality(locality_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Locality not found")
    return loc


@router.get("/{locality_id}/metrics", response_model=LocalityMetricsResponse)
async def get_locality_metrics(
    locality_id: str,
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = LocalityService(mongo_db)
    metrics = await service.get_metrics(locality_id)
    if not metrics:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metrics not found for this locality")
    return metrics


@router.get("/{locality_id}/scores", response_model=LocalityScoresResponse)
async def get_locality_scores(
    locality_id: str,
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = LocalityService(mongo_db)
    scores = await service.get_scores(locality_id)
    if not scores:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scores not found for this locality")
    return scores


@router.get("/{locality_id}/recommendations", response_model=List[RecommendationItemResponse])
async def get_locality_recommendations(
    locality_id: str,
    type: Optional[str] = Query(None, description="Filter by recommendation type: similar, CHEAPER, PREMIUM, HIGH_GROWTH, FAMILY_FRIENDLY"),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = LocalityService(mongo_db)
    return await service.get_recommendations(locality_id, rec_type=type)


@router.get("/{locality_id}/amenities")
async def get_locality_amenities(
    locality_id: str,
    category: Optional[str] = Query(None, description="Filter by category: school, hospital, restaurant, gym, park"),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = LocalityService(mongo_db)
    return await service.get_amenities(locality_id, category=category)
