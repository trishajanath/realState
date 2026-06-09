import json
from typing import Optional, Any
import redis.asyncio as aioredis
from config import settings
import structlog

logger = structlog.get_logger("recommendation.cache")


class RedisCacheManager:
    """
    Asynchronous Redis connection manager.
    Catches connection failures and bypasses cache lookups to remain resilient.
    """
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.client: Optional[aioredis.Redis] = None
        self._connected = False

    async def connect(self) -> None:
        try:
            logger.info("Connecting to Redis cache store", url=self.redis_url)
            self.client = aioredis.from_url(self.redis_url, decode_responses=True, socket_connect_timeout=2.0)
            await self.client.ping()
            self._connected = True
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning("Redis cache offline. Bypassing caching operations.", reason=str(e))
            self.client = None
            self._connected = False

    async def get(self, key: str) -> Optional[Any]:
        if not self._connected or not self.client:
            return None
        try:
            val = await self.client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.error("Failed to read from Redis cache", key=key, error=str(e))
        return None

    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        if not self._connected or not self.client:
            return
        try:
            serialized = json.dumps(value)
            await self.client.set(key, serialized, ex=ttl)
        except Exception as e:
            logger.error("Failed to write to Redis cache", key=key, error=str(e))

    async def delete(self, key: str) -> None:
        if not self._connected or not self.client:
            return
        try:
            await self.client.delete(key)
        except Exception as e:
            logger.error("Failed to delete from Redis cache", key=key, error=str(e))

    async def clear_recommendation_cache(self, locality_id: str) -> None:
        """
        Invalidates cached endpoints for a given locality.
        """
        # Similar cache keys
        await self.delete(f"recommendation:{locality_id}:similar")
        await self.delete(f"recommendation:{locality_id}:similar:llm")

        # Alternatives cache keys
        alt_types = ["CHEAPER", "PREMIUM", "HIGH_GROWTH", "FAMILY_FRIENDLY", "SAFER", "BETTER_CONNECTED"]
        for t in alt_types:
            await self.delete(f"recommendation:{locality_id}:alternatives:{t}")
            await self.delete(f"recommendation:{locality_id}:alternatives:{t}:llm")

    async def disconnect(self) -> None:
        if self.client:
            await self.client.aclose()
            logger.info("Disconnected from Redis cache store.")


cache_manager = RedisCacheManager(settings.REDIS_URL)
