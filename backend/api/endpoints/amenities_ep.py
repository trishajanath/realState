from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

from core.database import get_mongo_db
from schemas.locality import AmenityResponse
from services.locality_service import LocalityService

router = APIRouter()


@router.get("", response_model=List[AmenityResponse])
async def list_amenities(
    locality_id: Optional[str] = Query(None, description="Filter by locality UUID"),
    category: Optional[str] = Query(None, description="Filter by category: school, hospital, restaurant, gym, park"),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = LocalityService(mongo_db)
    return await service.list_all_amenities(locality_id=locality_id, category=category)
