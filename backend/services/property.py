from uuid import UUID
from typing import List, Tuple, Optional
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.models import Property, Locality
from repositories.property import PropertyRepository
from repositories.mongo_search import MongoSearchRepository
from services.ai import AIService
from schemas.property import PropertyCreate, PropertyUpdate


class PropertyService:
    """
    Coordinates CRUD operations across PostgreSQL/PostGIS, indexes listings 
    for search in MongoDB, and triggers Gemini AI listing optimization.
    """
    def __init__(self, db: AsyncSession, mongo_db: AsyncIOMotorDatabase):
        self.postgres_repo = PropertyRepository(db)
        self.mongo_repo = MongoSearchRepository(mongo_db)
        self.ai_service = AIService()

    async def create_property(self, schema: PropertyCreate) -> Property:
        # 1. Resolve locality name to provide spatial context to Gemini
        locality_name = ""
        if schema.locality_id:
            stmt = select(Locality).filter(Locality.id == schema.locality_id)
            result = await self.postgres_repo.db.execute(stmt)
            locality = result.scalars().first()
            if locality:
                locality_name = locality.name

        # 2. Invoke Gemini AI (handles its own internal fallbacks if API limits are hit)
        price_val = float(schema.price)
        area_val = float(schema.area_sqft)
        
        ai_description = await self.ai_service.generate_property_description(
            title=schema.title,
            property_type=schema.property_type,
            listing_type=schema.listing_type,
            price=price_val,
            area_sqft=area_val,
            locality_name=locality_name or schema.city
        )

        ai_rating = await self.ai_service.evaluate_property_deal(
            property_type=schema.property_type,
            price=price_val,
            area_sqft=area_val,
            locality_name=locality_name or schema.city
        )

        # 3. Save listing record to PostgreSQL (PostGIS POINT is set automatically in repo)
        db_property = await self.postgres_repo.create(
            schema,
            ai_desc=ai_description,
            ai_rating=ai_rating
        )

        # 4. Sync search document index inside MongoDB
        mongo_doc = {
            "title": db_property.title,
            "property_type": db_property.property_type,
            "listing_type": db_property.listing_type,
            "price": float(db_property.price),
            "area_sqft": float(db_property.area_sqft),
            "locality_name": db_property.locality.name if db_property.locality else "",
            "description": db_property.ai_description or ""
        }
        await self.mongo_repo.index_property(db_property.id, mongo_doc)

        return db_property

    async def get_property(self, property_id: UUID) -> Optional[Property]:
        return await self.postgres_repo.get_by_id(property_id)

    async def list_properties(
        self,
        locality_id: Optional[UUID] = None,
        property_type: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Property], int]:
        # If search string is provided, use MongoDB Text Search
        if search:
            # Query MongoDB text index
            matched_ids = await self.mongo_repo.search_properties_ids(
                search,
                limit=limit,
                skip=skip
            )
            if not matched_ids:
                return [], 0

            # Pull fully populated records from PostgreSQL
            stmt = (
                select(Property)
                .options(joinedload(Property.locality))
                .filter(Property.id.in_(matched_ids))
            )
            result = await self.postgres_repo.db.execute(stmt)
            properties = result.scalars().all()

            # Maintain relevance ordering returned from MongoDB search score
            properties_map = {p.id: p for p in properties}
            sorted_properties = [
                properties_map[pid]
                for pid in matched_ids
                if pid in properties_map
            ]

            return sorted_properties, len(sorted_properties)

        # Standard relational database filtering
        return await self.postgres_repo.list_properties(
            locality_id=locality_id,
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
            skip=skip,
            limit=limit
        )

    async def update_property(self, property_id: UUID, schema: PropertyUpdate) -> Optional[Property]:
        # 1. Update relational DB record
        db_property = await self.postgres_repo.update(property_id, schema)
        if not db_property:
            return None

        # 2. Sync search index
        mongo_doc = {
            "title": db_property.title,
            "property_type": db_property.property_type,
            "listing_type": db_property.listing_type,
            "price": float(db_property.price),
            "area_sqft": float(db_property.area_sqft),
            "locality_name": db_property.locality.name if db_property.locality else "",
            "description": db_property.ai_description or ""
        }
        await self.mongo_repo.index_property(db_property.id, mongo_doc)

        return db_property

    async def delete_property(self, property_id: UUID) -> bool:
        # 1. Delete relational entry
        deleted = await self.postgres_repo.delete(property_id)
        if deleted:
            # 2. Delete search index document
            await self.mongo_repo.delete_property(property_id)
        return deleted
