import os
import sys
import asyncio
from datetime import datetime, timezone
from decimal import Decimal
import structlog
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from geoalchemy2.elements import WKTElement

# 1. Setup Python paths to allow relative imports
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))
sys.path.insert(0, os.path.join(ROOT_DIR, "services", "scraper"))
sys.path.insert(0, os.path.join(ROOT_DIR, "services", "locality_intelligence"))

# Configure clean logging
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(colors=True)
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger("scraper.ingest")

# Load environment variables manually if running as direct script
from dotenv import load_dotenv
load_dotenv(os.path.join(ROOT_DIR, ".env"))

# Import models, repository and AI service
from backend.models.models import Property, Locality, LocalityMetrics, LocalityScores
from backend.services.ai import AIService
from backend.repositories.mongo_search import MongoSearchRepository

# Import scraper modules
from pipeline import ScraperPipeline
from storage import MongoScraperStorage
from providers.nn_acres import NinetyNineAcresProvider, NinetyNineAcresParser, NinetyNineAcresNormalizer
from providers.magic_bricks import MagicBricksProvider, MagicBricksParser, MagicBricksNormalizer

# Import locality intelligence jobs
from services.locality_intelligence.jobs import run_nightly_aggregation, run_weekly_scoring

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres_secure_password_coimbatore@localhost:5432/realstate_db"
)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "realstate_mongo")

# Coords mapping for Coimbatore localities to initialize centroids
LOCALITY_COORDS = {
    "Saravanampatti": (11.0797, 77.0011),
    "Peelamedu": (11.0284, 77.0028),
    "Kalapatti": (11.0655, 77.0422),
    "Singanallur": (11.0016, 77.0264),
    "Saibaba Colony": (11.0213, 76.9458),
    "RS Puram": (11.0112, 76.9458),
    "Gandhipuram": (11.0183, 76.9691)
}


async def ingest():
    logger.info("Initializing Ingestion Pipeline to PostgreSQL and MongoDB", db_url=DATABASE_URL.split("@")[-1])

    # 1. Setup Postgres Async Session
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    # 2. Setup MongoDB search index connection
    mongo_client = AsyncIOMotorClient(MONGODB_URL)
    mongo_db = mongo_client[MONGODB_DB_NAME]
    mongo_search_repo = MongoSearchRepository(mongo_db)

    # 3. List of mock urls for Coimbatore properties
    urls = [
        # 99acres URLs
        ("99acres", "https://www.99acres.com/mock-listing-rs-puram-apartment"),
        ("99acres", "https://www.99acres.com/mock-listing-gandhipuram-house"),
        ("99acres", "https://www.99acres.com/mock-listing-peelamedu-apartment"),
        ("99acres", "https://www.99acres.com/mock-listing-saravanampatti-villa"),
        ("99acres", "https://www.99acres.com/mock-listing-saibaba-colony-villa"),
        ("99acres", "https://www.99acres.com/mock-listing-singanallur-apartment"),
        ("99acres", "https://www.99acres.com/mock-listing-kalapatti-apartment"),
        # MagicBricks URLs
        ("magicbricks", "https://www.magicbricks.com/mock-listing-rs-puram-flat"),
        ("magicbricks", "https://www.magicbricks.com/mock-listing-gandhipuram-villa"),
        ("magicbricks", "https://www.magicbricks.com/mock-listing-peelamedu-flat"),
        ("magicbricks", "https://www.magicbricks.com/mock-listing-saravanampatti-flat"),
        ("magicbricks", "https://www.magicbricks.com/mock-listing-saibaba-colony-flat"),
        ("magicbricks", "https://www.magicbricks.com/mock-listing-singanallur-flat"),
        ("magicbricks", "https://www.magicbricks.com/mock-listing-kalapatti-flat")
    ]

    # Initialize AI service
    ai_service = AIService()

    # 4. Ingestion Process
    async with AsyncSessionLocal() as session:
        for idx, (source, url) in enumerate(urls):
            logger.info("Scraping and Ingesting listing", index=idx+1, url=url, source=source)
            try:
                # Setup specific pipeline instances
                if source == "99acres":
                    provider = NinetyNineAcresProvider()
                    parser = NinetyNineAcresParser()
                    normalizer = NinetyNineAcresNormalizer()
                else:
                    provider = MagicBricksProvider()
                    parser = MagicBricksParser()
                    normalizer = MagicBricksNormalizer()

                # Execute pipeline extraction
                raw = await provider.fetch_raw(url)
                parsed = parser.parse_raw(raw)
                normalized = normalizer.normalize(parsed)

                locality_name = normalized.get("locality", "Gandhipuram")
                title = normalized.get("title", "")
                price = normalized.get("price", 0.0)
                area = normalized.get("area_sqft", 0.0)

                # Fetch or create Locality
                loc_query = select(Locality).where(Locality.name == locality_name)
                loc_res = await session.execute(loc_query)
                locality = loc_res.scalars().first()

                if not locality:
                    logger.info("Creating new Coimbatore locality record", name=locality_name)
                    lat, lon = LOCALITY_COORDS.get(locality_name, (11.0183, 76.9691))
                    geom = WKTElement(f"POINT({lon} {lat})", srid=4326)
                    locality = Locality(
                        name=locality_name,
                        city="Coimbatore",
                        state="Tamil Nadu",
                        location=geom
                    )
                    session.add(locality)
                    await session.commit()
                    await session.refresh(locality)

                # Check if property already exists
                prop_query = select(Property).where(
                    Property.title == title,
                    Property.locality_id == locality.id
                )
                prop_res = await session.execute(prop_query)
                existing_prop = prop_res.scalars().first()

                if existing_prop:
                    logger.info("Property listing already exists in database, skipping insertion", title=title)
                    continue

                # Trigger Gemini LLM evaluation & descriptions
                logger.info("Generating AI marketing description and rating reviews via Gemini", title=title)
                ai_description = await ai_service.generate_property_description(
                    title=title,
                    property_type=normalized.get("property_type", "Apartment"),
                    listing_type=normalized.get("listing_type", "Sale"),
                    price=price,
                    area_sqft=area,
                    locality_name=locality.name
                )
                ai_rating = await ai_service.evaluate_property_deal(
                    property_type=normalized.get("property_type", "Apartment"),
                    price=price,
                    area_sqft=area,
                    locality_name=locality.name
                )

                lat = normalized.get("latitude") or LOCALITY_COORDS.get(locality_name, (11.0183, 76.9691))[0]
                lon = normalized.get("longitude") or LOCALITY_COORDS.get(locality_name, (11.0183, 76.9691))[1]
                geom = WKTElement(f"POINT({lon} {lat})", srid=4326)

                db_property = Property(
                    title=title,
                    property_type=normalized.get("property_type", "Apartment"),
                    listing_type=normalized.get("listing_type", "Sale"),
                    price=Decimal(str(price)),
                    area_sqft=Decimal(str(area)),
                    bedrooms=normalized.get("bedrooms"),
                    bathrooms=normalized.get("bathrooms"),
                    latitude=lat,
                    longitude=lon,
                    location=geom,
                    locality_id=locality.id,
                    city="Coimbatore",
                    state="Tamil Nadu",
                    source=source,
                    listing_url=url,
                    ai_description=ai_description,
                    ai_investment_rating=ai_rating
                )

                session.add(db_property)
                await session.commit()
                await session.refresh(db_property)

                # Sync search index in MongoDB
                mongo_doc = {
                    "title": db_property.title,
                    "property_type": db_property.property_type,
                    "listing_type": db_property.listing_type,
                    "price": float(db_property.price),
                    "area_sqft": float(db_property.area_sqft),
                    "locality_name": locality.name,
                    "description": db_property.ai_description or ""
                }
                await mongo_search_repo.index_property(db_property.id, mongo_doc)
                logger.info("Successfully ingested property listing", title=title, locality=locality.name)

            except Exception as e:
                logger.error("Failed to ingest URL", url=url, error=str(e))
                await session.rollback()

        # 5. Execute Locality Aggregations to calculate dynamic Relative Prices, appreciation, and infra scoring
        logger.info("\n=== RUNNING NIGHTLY METRICS AGGREGATION JOB ===")
        await run_nightly_aggregation(session)

        logger.info("\n=== RUNNING WEEKLY SCORING RECOMPUTATION JOB ===")
        await run_weekly_scoring(session)

    await engine.dispose()
    logger.info("Ingestion process completed successfully.")


if __name__ == "__main__":
    asyncio.run(ingest())
