from uuid import UUID, uuid4
from typing import List, Tuple, Optional, Literal
from decimal import Decimal
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.logging import logger
from repositories.mongo_search import MongoSearchRepository
from services.ai import AIService
from schemas.property import PropertyCreate, PropertyUpdate

_PROJ = {"_id": 0}


class PropertyService:
    def __init__(self, mongo_db: AsyncIOMotorDatabase):
        self.mongo_repo = MongoSearchRepository(mongo_db)
        self.ai_service = AIService()

    async def create_property(self, schema: PropertyCreate) -> dict:
        locality_name = schema.city
        price_val = float(schema.price)
        area_val = float(schema.area_sqft)

        ai_description = await self.ai_service.generate_property_description(
            title=schema.title,
            property_type=schema.property_type,
            listing_type=schema.listing_type,
            price=price_val,
            area_sqft=area_val,
            locality_name=locality_name,
        )
        ai_rating = await self.ai_service.evaluate_property_deal(
            property_type=schema.property_type,
            price=price_val,
            area_sqft=area_val,
            locality_name=locality_name,
        )

        prop_id = uuid4()
        mongo_doc = {
            "id": str(prop_id),
            "title": schema.title,
            "property_type": schema.property_type,
            "listing_type": schema.listing_type,
            "price": price_val,
            "area_sqft": area_val,
            "bedrooms": schema.bedrooms,
            "bathrooms": schema.bathrooms,
            "latitude": schema.latitude,
            "longitude": schema.longitude,
            "locality_id": str(schema.locality_id) if schema.locality_id else None,
            "locality_name": locality_name,
            "city": schema.city,
            "state": schema.state,
            "source": schema.source or "Manual",
            "listing_url": schema.listing_url,
            "images": schema.images or [],
            "ai_description": ai_description or "",
            "ai_investment_rating": ai_rating or "",
            "locality": {
                "id": str(schema.locality_id) if schema.locality_id else None,
                "name": locality_name,
                "city": schema.city,
                "state": schema.state,
            },
        }
        await self.mongo_repo.index_property(prop_id, mongo_doc)
        return mongo_doc

    async def get_property(self, property_id: UUID) -> Optional[dict]:
        return await self.mongo_repo.collection.find_one({"id": str(property_id)}, _PROJ)

    async def list_properties(
        self,
        locality_id: Optional[UUID] = None,
        property_type: Optional[str] = None,
        listing_type: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        min_bedrooms: Optional[int] = None,
        max_bedrooms: Optional[int] = None,
        search: Optional[str] = None,
        sort_by: Optional[Literal["price", "area_sqft", "bedrooms"]] = None,
        sort_order: Optional[Literal["asc", "desc"]] = "asc",
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query: dict = {}

        if search:
            query["$text"] = {"$search": search}
        if locality_id:
            query["locality_id"] = str(locality_id)
        if property_type:
            query["property_type"] = {"$regex": f"^{property_type}$", "$options": "i"}
        if listing_type:
            query["listing_type"] = {"$regex": f"^{listing_type}$", "$options": "i"}

        price_filter: dict = {}
        if min_price:
            price_filter["$gte"] = float(min_price)
        if max_price:
            price_filter["$lte"] = float(max_price)
        if price_filter:
            query["price"] = price_filter

        bedroom_filter: dict = {}
        if min_bedrooms is not None:
            bedroom_filter["$gte"] = min_bedrooms
        if max_bedrooms is not None:
            bedroom_filter["$lte"] = max_bedrooms
        if bedroom_filter:
            query["bedrooms"] = bedroom_filter

        direction = 1 if sort_order == "asc" else -1

        if search:
            sort_spec: list = [("score", {"$meta": "textScore"})]
            cursor = self.mongo_repo.collection.find(
                query, {**_PROJ, "score": {"$meta": "textScore"}}
            ).sort(sort_spec).skip(skip).limit(limit)
        elif sort_by:
            cursor = self.mongo_repo.collection.find(query, _PROJ).sort(sort_by, direction).skip(skip).limit(limit)
        else:
            cursor = self.mongo_repo.collection.find(query, _PROJ).skip(skip).limit(limit)

        results = await cursor.to_list(length=limit)
        total = await self.mongo_repo.collection.count_documents(query)
        return results, total

    async def update_property(self, property_id: UUID, schema: PropertyUpdate) -> Optional[dict]:
        doc = await self.mongo_repo.collection.find_one({"id": str(property_id)}, _PROJ)
        if not doc:
            return None

        data = schema.model_dump(exclude_unset=True)
        for k, v in data.items():
            if k == "locality_id" and v:
                doc["locality_id"] = str(v)
                doc["locality"] = {
                    "id": str(v),
                    "name": doc.get("locality", {}).get("name", "Coimbatore"),
                    "city": doc.get("city", "Coimbatore"),
                    "state": doc.get("state", "Tamil Nadu"),
                }
            elif isinstance(v, Decimal):
                doc[k] = float(v)
            elif v is not None:
                doc[k] = v

        await self.mongo_repo.index_property(property_id, doc)
        return doc

    async def delete_property(self, property_id: UUID) -> bool:
        res = await self.mongo_repo.collection.delete_one({"id": str(property_id)})
        return res.deleted_count > 0
