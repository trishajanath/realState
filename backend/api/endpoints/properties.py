from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from motor.motor_asyncio import AsyncIOMotorDatabase
from uuid import UUID
from decimal import Decimal
from typing import Optional

from core.database import get_db_session, get_mongo_db
from schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse, PropertyListResponse
from services.property import PropertyService

router = APIRouter()


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    schema: PropertyCreate,
    db: AsyncSession = Depends(get_db_session),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    """
    Creates a new real estate property listing in PostgreSQL, triggers Gemini AI
    to generate description/deal scores, and syncs the listing to the MongoDB search index.
    """
    service = PropertyService(db, mongo_db)
    return await service.create_property(schema)


@router.get("", response_model=PropertyListResponse)
async def list_properties(
    locality_id: Optional[UUID] = Query(None, description="Filter by Locality UUID"),
    property_type: Optional[str] = Query(None, description="Filter by Property Type"),
    min_price: Optional[Decimal] = Query(None, description="Filter by Minimum Price limit"),
    max_price: Optional[Decimal] = Query(None, description="Filter by Maximum Price limit"),
    search: Optional[str] = Query(None, description="Full-text search matching title, locality, and description in MongoDB"),
    skip: int = Query(0, ge=0, description="Number of listings to skip"),
    limit: int = Query(20, ge=1, le=100, description="Limit of listings to fetch"),
    db: AsyncSession = Depends(get_db_session),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    """
    Retrieves property listings with pagination. Supports traditional SQL filters 
    (price ranges, property types, localities) or hybrid MongoDB full-text search.
    """
    service = PropertyService(db, mongo_db)
    results, total = await service.list_properties(
        locality_id=locality_id,
        property_type=property_type,
        min_price=min_price,
        max_price=max_price,
        search=search,
        skip=skip,
        limit=limit
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "results": results
    }


@router.get("/{id}", response_model=PropertyResponse)
async def get_property(
    id: UUID,
    db: AsyncSession = Depends(get_db_session),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    """
    Retrieves a single property listing details by its UUID.
    """
    service = PropertyService(db, mongo_db)
    prop = await service.get_property(id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {id} not found."
        )
    return prop


@router.put("/{id}", response_model=PropertyResponse)
async def update_property(
    id: UUID,
    schema: PropertyUpdate,
    db: AsyncSession = Depends(get_db_session),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    """
    Updates an existing property listing, recomputing coordinates and syncing 
    the search index document.
    """
    service = PropertyService(db, mongo_db)
    prop = await service.update_property(id, schema)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {id} not found."
        )
    return prop


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    id: UUID,
    db: AsyncSession = Depends(get_db_session),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    """
    Deletes a property listing from both PostgreSQL relational database 
    and the MongoDB search index.
    """
    service = PropertyService(db, mongo_db)
    deleted = await service.delete_property(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {id} not found."
        )
    return None
