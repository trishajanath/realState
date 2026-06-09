from typing import List, Tuple, Optional
from uuid import UUID
from decimal import Decimal
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from geoalchemy2.elements import WKTElement

from models.models import Property
from schemas.property import PropertyCreate, PropertyUpdate


class PropertyRepository:
    """
    Handles all direct PostgreSQL database transactions for Property listings using async sessions.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, schema: PropertyCreate, ai_desc: Optional[str] = None, ai_rating: Optional[str] = None) -> Property:
        data = schema.model_dump()
        
        # Extract coordinates to generate PostGIS Geography WKT
        lat = data.get("latitude")
        lon = data.get("longitude")
        location = None
        if lat is not None and lon is not None:
            # PostGIS uses longitude, latitude order for POINT
            location = WKTElement(f"POINT({lon} {lat})", srid=4326)

        db_property = Property(
            title=data["title"],
            property_type=data["property_type"],
            listing_type=data["listing_type"],
            price=data["price"],
            area_sqft=data["area_sqft"],
            bedrooms=data["bedrooms"],
            bathrooms=data["bathrooms"],
            latitude=lat,
            longitude=lon,
            location=location,
            locality_id=data["locality_id"],
            city=data["city"],
            state=data["state"],
            source=data["source"],
            listing_url=data["listing_url"],
            ai_description=ai_desc,
            ai_investment_rating=ai_rating
        )

        self.db.add(db_property)
        await self.db.commit()
        await self.db.refresh(db_property)
        
        # Load relationships
        return await self.get_by_id(db_property.id)

    async def get_by_id(self, property_id: UUID) -> Optional[Property]:
        stmt = (
            select(Property)
            .options(joinedload(Property.locality))
            .filter(Property.id == property_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_properties(
        self,
        locality_id: Optional[UUID] = None,
        property_type: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Property], int]:
        # Base statements
        stmt = select(Property).options(joinedload(Property.locality))
        count_stmt = select(func.count(Property.id))

        # Apply filters
        filters = []
        if locality_id:
            filters.append(Property.locality_id == locality_id)
        if property_type:
            filters.append(Property.property_type.ilike(property_type))
        if min_price:
            filters.append(Property.price >= min_price)
        if max_price:
            filters.append(Property.price <= max_price)

        if filters:
            stmt = stmt.filter(*filters)
            count_stmt = count_stmt.filter(*filters)

        # Execute count query
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Execute list query with pagination
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        results = result.scalars().all()

        return list(results), total

    async def update(self, property_id: UUID, schema: PropertyUpdate) -> Optional[Property]:
        data = schema.model_dump(exclude_unset=True)
        if not data:
            return await self.get_by_id(property_id)

        # Fetch current record
        db_property = await self.get_by_id(property_id)
        if not db_property:
            return None

        # Re-evaluate PostGIS geography coordinates if changed
        if "latitude" in data or "longitude" in data:
            lat = data.get("latitude", db_property.latitude)
            lon = data.get("longitude", db_property.longitude)
            if lat is not None and lon is not None:
                data["location"] = WKTElement(f"POINT({lon} {lat})", srid=4326)
            else:
                data["location"] = None

        # Apply updates
        for key, val in data.items():
            setattr(db_property, key, val)

        await self.db.commit()
        await self.db.refresh(db_property)
        return await self.get_by_id(property_id)

    async def delete(self, property_id: UUID) -> bool:
        stmt = delete(Property).where(Property.id == property_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0
