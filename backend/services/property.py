from uuid import UUID
from typing import List, Tuple, Optional
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.logging import logger
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
        locality_record = None
        if schema.locality_id:
            try:
                stmt = select(Locality).filter(Locality.id == schema.locality_id)
                result = await self.postgres_repo.db.execute(stmt)
                locality_record = result.scalars().first()
                if locality_record:
                    locality_name = locality_record.name
            except Exception as e:
                logger.warning("Failed to resolve locality from PostgreSQL", error=str(e))

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

        db_property = None
        try:
            # 3. Save listing record to PostgreSQL (PostGIS POINT is set automatically in repo)
            db_property = await self.postgres_repo.create(
                schema,
                ai_desc=ai_description,
                ai_rating=ai_rating
            )
        except Exception as e:
            logger.warning("PostgreSQL offline during create_property. Bypassing SQL persistence.", error=str(e))

        # 4. Sync search document index inside MongoDB
        prop_id = db_property.id if db_property else schema.locality_id or UUID("00000000-0000-0000-0000-000000000000") # fallback ID
        mongo_doc = {
            "title": db_property.title if db_property else schema.title,
            "property_type": db_property.property_type if db_property else schema.property_type,
            "listing_type": db_property.listing_type if db_property else schema.listing_type,
            "price": float(db_property.price) if db_property else float(schema.price),
            "area_sqft": float(db_property.area_sqft) if db_property else float(schema.area_sqft),
            "bedrooms": db_property.bedrooms if db_property else schema.bedrooms,
            "bathrooms": db_property.bathrooms if db_property else schema.bathrooms,
            "latitude": db_property.latitude if db_property else schema.latitude,
            "longitude": db_property.longitude if db_property else schema.longitude,
            "locality_id": str(db_property.locality_id) if db_property else (str(schema.locality_id) if schema.locality_id else None),
            "city": db_property.city if db_property else schema.city,
            "state": db_property.state if db_property else schema.state,
            "source": db_property.source if db_property else schema.source,
            "listing_url": db_property.listing_url if db_property else schema.listing_url,
            "ai_description": ai_description or "",
            "ai_investment_rating": ai_rating or "",
            "locality": {
                "id": str(schema.locality_id) if schema.locality_id else None,
                "name": locality_name or schema.city,
                "city": schema.city,
                "state": schema.state
            }
        }
        await self.mongo_repo.index_property(prop_id, mongo_doc)

        return db_property if db_property else mongo_doc

    async def get_property(self, property_id: UUID) -> Optional[Property]:
        try:
            return await self.postgres_repo.get_by_id(property_id)
        except Exception as e:
            logger.warning("PostgreSQL offline during get_property. Querying MongoDB directly.", error=str(e))
            doc = await self.mongo_repo.collection.find_one({"id": str(property_id)})
            if doc:
                return doc
            return None

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
            try:
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
            except Exception as e:
                logger.warning("PostgreSQL offline or search error. Querying MongoDB directly.", error=str(e))
                # Fallback to querying MongoDB directly
                query = {"$text": {"$search": search}}
                if locality_id:
                    query["locality_id"] = str(locality_id)
                if property_type:
                    query["property_type"] = {"$regex": f"^{property_type}$", "$options": "i"}
                if min_price:
                    query["price"] = {"$gte": float(min_price)}
                if max_price:
                    if "price" in query:
                        query["price"]["$lte"] = float(max_price)
                    else:
                        query["price"] = {"$lte": float(max_price)}

                cursor = self.mongo_repo.collection.find(query).skip(skip).limit(limit)
                results = await cursor.to_list(length=limit)
                
                # Count total matching
                total = await self.mongo_repo.collection.count_documents(query)
                return results, total

        # Standard relational database filtering
        try:
            return await self.postgres_repo.list_properties(
                locality_id=locality_id,
                property_type=property_type,
                min_price=min_price,
                max_price=max_price,
                skip=skip,
                limit=limit
            )
        except Exception as e:
            logger.warning("PostgreSQL offline during list_properties. Querying MongoDB directly.", error=str(e))
            # Fallback to querying MongoDB directly
            query = {}
            if locality_id:
                query["locality_id"] = str(locality_id)
            if property_type:
                query["property_type"] = {"$regex": f"^{property_type}$", "$options": "i"}
            if min_price:
                query["price"] = {"$gte": float(min_price)}
            if max_price:
                if "price" in query:
                    query["price"]["$lte"] = float(max_price)
                else:
                    query["price"] = {"$lte": float(max_price)}

            cursor = self.mongo_repo.collection.find(query).skip(skip).limit(limit)
            results = await cursor.to_list(length=limit)
            
            # Count total matching
            total = await self.mongo_repo.collection.count_documents(query)
            return results, total

    async def update_property(self, property_id: UUID, schema: PropertyUpdate) -> Optional[Property]:
        try:
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
                "bedrooms": db_property.bedrooms,
                "bathrooms": db_property.bathrooms,
                "latitude": db_property.latitude,
                "longitude": db_property.longitude,
                "locality_id": str(db_property.locality_id) if db_property.locality_id else None,
                "city": db_property.city,
                "state": db_property.state,
                "source": db_property.source,
                "listing_url": db_property.listing_url,
                "ai_description": db_property.ai_description or "",
                "ai_investment_rating": db_property.ai_investment_rating or "",
                "locality": {
                    "id": str(db_property.locality_id) if db_property.locality_id else None,
                    "name": db_property.locality.name if db_property.locality else "",
                    "city": db_property.city,
                    "state": db_property.state
                }
            }
            await self.mongo_repo.index_property(db_property.id, mongo_doc)
            return db_property
        except Exception as e:
            logger.warning("PostgreSQL offline during update_property. Updating MongoDB directly.", error=str(e))
            doc = await self.mongo_repo.collection.find_one({"id": str(property_id)})
            if not doc:
                return None
            data = schema.model_dump(exclude_unset=True)
            for k, v in data.items():
                if k == "locality_id" and v:
                    doc["locality_id"] = str(v)
                    doc["locality"] = {
                        "id": str(v),
                        "name": doc.get("locality", {}).get("name", ""),
                        "city": doc.get("city", "Coimbatore"),
                        "state": doc.get("state", "Tamil Nadu")
                    }
                elif isinstance(v, Decimal):
                    doc[k] = float(v)
                elif v is not None:
                    doc[k] = v
            await self.mongo_repo.index_property(property_id, doc)
            return doc

    async def delete_property(self, property_id: UUID) -> bool:
        try:
            # 1. Delete relational entry
            deleted = await self.postgres_repo.delete(property_id)
            if deleted:
                # 2. Delete search index document
                await self.mongo_repo.delete_property(property_id)
            return deleted
        except Exception as e:
            logger.warning("PostgreSQL offline during delete_property. Deleting from MongoDB directly.", error=str(e))
            await self.mongo_repo.delete_property(property_id)
            return True
