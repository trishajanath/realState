from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.logging import logger


class LocalityService:
    def __init__(self, mongo_db: AsyncIOMotorDatabase):
        self._db = mongo_db
        self.localities = mongo_db["localities"]
        self.metrics = mongo_db["locality_metrics"]
        self.scores = mongo_db["locality_scores"]
        self.amenities = mongo_db["amenities"]
        self.recommendations = mongo_db["locality_recommendations"]
        self.news = mongo_db["locality_news"]

    async def list_localities(self, skip: int = 0, limit: int = 50) -> List[dict]:
        cursor = self.localities.find({}, {"_id": 0}).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_locality(self, locality_id: str) -> Optional[dict]:
        return await self.localities.find_one({"id": locality_id}, {"_id": 0})

    async def get_metrics(self, locality_id: str) -> Optional[dict]:
        return await self.metrics.find_one({"locality_id": locality_id}, {"_id": 0})

    async def get_scores(self, locality_id: str) -> Optional[dict]:
        return await self.scores.find_one({"locality_id": locality_id}, {"_id": 0})

    async def get_amenities(self, locality_id: str, category: Optional[str] = None) -> List[dict]:
        query: Dict[str, Any] = {"locality_id": locality_id}
        if category:
            query["category"] = category
        cursor = self.amenities.find(query, {"_id": 0})
        return await cursor.to_list(length=200)

    async def list_all_amenities(self, locality_id: Optional[str] = None, category: Optional[str] = None) -> List[dict]:
        query: Dict[str, Any] = {}
        if locality_id:
            query["locality_id"] = locality_id
        if category:
            query["category"] = category
        cursor = self.amenities.find(query, {"_id": 0})
        return await cursor.to_list(length=500)

    async def get_recommendations(self, locality_id: str, rec_type: Optional[str] = None) -> List[dict]:
        query: Dict[str, Any] = {"locality_id": locality_id}
        if rec_type:
            query["recommendation_type"] = rec_type.lower()
        cursor = self.recommendations.find(query, {"_id": 0})
        docs = await cursor.to_list(length=100)
        results = []
        for doc in docs:
            results.extend(doc.get("items", []))
        return results

    async def get_dashboard_data(self) -> List[dict]:
        """Return all localities with embedded metrics and scores for the home page."""
        localities = await self.list_localities()
        result = []
        for loc in localities:
            metrics = await self.get_metrics(loc["id"])
            scores = await self.get_scores(loc["id"])
            result.append({**loc, "metrics": metrics, "scores": scores})
        return result

    async def get_news(self, locality_id: Optional[str] = None, category: Optional[str] = None) -> List[dict]:
        """Return infrastructure projects and news items, optionally filtered by locality name."""
        query: Dict[str, Any] = {}
        if category:
            query["category"] = category

        cursor = self.news.find(query, {"_id": 0}).sort("published_at", -1)
        docs = await cursor.to_list(length=200)

        if locality_id:
            # Find the locality name so we can filter by corridor mentions
            loc = await self.get_locality(locality_id)
            if loc:
                name = loc.get("name", "")
                docs = [
                    d for d in docs
                    if name in d.get("affected_localities", []) or name in d.get("corridors", [])
                ]

        return docs
