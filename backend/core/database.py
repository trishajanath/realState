from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings
from core.logging import logger

# --- MongoDB Setup ---
mongo_log_url = settings.MONGODB_URL.split("@")[-1] if "@" in settings.MONGODB_URL else settings.MONGODB_URL
logger.info("Initializing MongoDB Async client", url=mongo_log_url)
mongo_client = AsyncIOMotorClient(
    settings.MONGODB_URL,
    uuidRepresentation="standard",
    serverSelectionTimeoutMS=5000, # 5 seconds timeout
)
mongo_db = mongo_client[settings.MONGODB_DB_NAME]

def get_mongo_db():
    """
    FastAPI dependency injection provider for MongoDB.
    """
    return mongo_db
