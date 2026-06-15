from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from core.database import get_mongo_db
from services.locality_service import LocalityService

router = APIRouter()


@router.get("")
async def list_news(
    category: Optional[str] = Query(None, description="Filter: infrastructure, real_estate"),
    locality: Optional[str] = Query(None, description="Filter by locality name"),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db),
):
    """Return all infrastructure projects and news items, newest first."""
    service = LocalityService(mongo_db)
    docs = await service.get_news(category=category)
    if locality:
        docs = [d for d in docs if locality in d.get("affected_localities", []) or locality in d.get("corridors", [])]
    return docs
