from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings
from core.logging import logger

# --- PostgreSQL / PostGIS Setup ---
# create_async_engine uses the postgresql+asyncpg driver
postgres_url = settings.postgres_async_url

logger.info("Initializing PostgreSQL async engine", url=postgres_url.split("@")[-1]) # Hide credentials in log
engine = create_async_engine(
    postgres_url,
    echo=False, # Logs will clutter stdout, we handle logging at logger level
    future=True,
    pool_pre_ping=True, # Checks connection health on check-out
    pool_recycle=3600,  # Recycle connections after 1 hour
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency injection provider for PostgreSQL AsyncSession.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# --- MongoDB Setup ---
logger.info("Initializing MongoDB Async client", url=settings.MONGODB_URL)
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
