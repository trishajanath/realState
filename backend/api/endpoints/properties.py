from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from uuid import UUID
from decimal import Decimal
from typing import Optional, Literal

from core.database import get_mongo_db
from schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse, PropertyListResponse
from services.property import PropertyService

router = APIRouter()


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    schema: PropertyCreate,
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = PropertyService(mongo_db)
    return await service.create_property(schema)


@router.get("", response_model=PropertyListResponse)
async def list_properties(
    locality_id: Optional[UUID] = Query(None, description="Filter by Locality UUID"),
    property_type: Optional[str] = Query(None, description="Property type: Apartment, Villa, Independent House, Plot"),
    listing_type: Optional[str] = Query(None, description="Listing type: Sale, Rent"),
    min_price: Optional[Decimal] = Query(None, description="Minimum price in INR"),
    max_price: Optional[Decimal] = Query(None, description="Maximum price in INR"),
    min_bedrooms: Optional[int] = Query(None, ge=0, description="Minimum number of bedrooms"),
    max_bedrooms: Optional[int] = Query(None, ge=0, description="Maximum number of bedrooms"),
    search: Optional[str] = Query(None, description="Full-text search on title, locality, and description"),
    sort_by: Optional[Literal["price", "area_sqft", "bedrooms"]] = Query(None, description="Sort field"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("asc", description="Sort direction"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = PropertyService(mongo_db)
    results, total = await service.list_properties(
        locality_id=locality_id,
        property_type=property_type,
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        max_bedrooms=max_bedrooms,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit,
    )
    return {"total": total, "skip": skip, "limit": limit, "results": results}


@router.get("/{id}", response_model=PropertyResponse)
async def get_property(
    id: UUID,
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = PropertyService(mongo_db)
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
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = PropertyService(mongo_db)
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
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    service = PropertyService(mongo_db)
    deleted = await service.delete_property(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {id} not found."
        )
    return None
