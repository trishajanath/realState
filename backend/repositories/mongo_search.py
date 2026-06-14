from typing import List, Optional
from uuid import UUID
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.logging import logger


class MongoSearchRepository:
    """
    Acts as the Search Engine index repository in MongoDB, supporting indexing 
    and full-text relevance search.
    """
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["properties_search"]

    async def ensure_indexes(self):
        """
        Creates a text index on property text fields for full-text search.
        """
        try:
            # Drop old text index if it exists to prevent conflict on field list changes
            try:
                indexes = await self.collection.index_information()
                if "idx_properties_text_search" in indexes:
                    await self.collection.drop_index("idx_properties_text_search")
                    logger.info("Dropped old MongoDB text search index in repository.")
            except Exception as e:
                logger.warning("Could not check/drop old text index in repository", error=str(e))

            # Create compound text index
            await self.collection.create_index(
                [
                    ("title", "text"),
                    ("locality.name", "text"),
                    ("property_type", "text"),
                    ("listing_type", "text"),
                    ("ai_description", "text")
                ],
                name="idx_properties_text_search"
            )
            logger.info("MongoDB text indexes verified successfully.")
        except Exception as e:
            logger.error("Failed to create MongoDB text search indexes", error=str(e))

    async def index_property(self, property_id: UUID, document: dict) -> None:
        """
        Saves or updates a property listing document in the search index.
        """
        # Ensure ID is saved as string for compatibility
        doc_id = str(property_id)
        document["id"] = doc_id
        
        # Upsert operation
        await self.collection.replace_one(
            {"id": doc_id},
            document,
            upsert=True
        )
        logger.info("Property listing indexed in MongoDB", property_id=doc_id)

    async def delete_property(self, property_id: UUID) -> None:
        """
        Removes a property document from the search index.
        """
        doc_id = str(property_id)
        await self.collection.delete_one({"id": doc_id})
        logger.info("Property listing deleted from MongoDB search index", property_id=doc_id)

    async def search_properties_ids(self, query: str, limit: int = 20, skip: int = 0) -> List[UUID]:
        """
        Performs full-text relevance search and returns matching property UUIDs.
        """
        await self.ensure_indexes()
        
        # Query MongoDB using the $text index, sorting by text score relevance
        cursor = self.collection.find(
            {"$text": {"$search": query}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).skip(skip).limit(limit)

        matched_ids = []
        async for doc in cursor:
            try:
                matched_ids.append(UUID(doc["id"]))
            except Exception as e:
                logger.error("Failed to parse UUID from indexed document", doc_id=doc.get("id"), error=str(e))
                
        return matched_ids
