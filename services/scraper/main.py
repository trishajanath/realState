import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import structlog
from typing import Optional, Dict, Any

from pipeline import ScraperPipeline
from storage import MongoScraperStorage
from providers.sample import SampleProvider, SampleParser, SampleNormalizer
from providers.nn_acres import NinetyNineAcresProvider, NinetyNineAcresParser, NinetyNineAcresNormalizer
from providers.magic_bricks import MagicBricksProvider, MagicBricksParser, MagicBricksNormalizer

# Configure clean logging
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(colors=True)
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger("scraper.runner")


class MockScraperStorage:
    """
    Mock storage fallback that prints logs instead of writing to MongoDB.
    Allows validation checks when DB engines are offline.
    """
    async def save_payload(
        self,
        source: str,
        raw_payload: str,
        parsed_payload: Dict[str, Any]
    ) -> None:
        logger.info(
            "[MOCK STORAGE] save_payload triggered",
            source=source,
            parsed_keys=list(parsed_payload.keys()),
            listing_title=parsed_payload.get("title"),
            price=parsed_payload.get("price"),
            locality=parsed_payload.get("locality")
        )

    async def log_failure(
        self,
        source: str,
        stage: str,
        error_message: str,
        stack_trace: str,
        raw_payload: Optional[str] = None
    ) -> None:
        logger.error(
            "[MOCK STORAGE] log_failure triggered",
            source=source,
            stage=stage,
            error_message=error_message
        )


async def run_pipeline():
    # Load configuration
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "realstate_mongo")

    logger.info("Initializing Scraper Pipeline Runner", mongo_url=mongo_url, db_name=db_name)

    # Initialize persistence engine (MongoDB or mock fallback)
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=1500)
        # Check connection readiness
        await client.admin.command("ping")
        db = client[db_name]
        storage = MongoScraperStorage(db)
        logger.info("Connected to MongoDB search index successfully.")
    except Exception as e:
        logger.warning(
            "Could not connect to MongoDB server. Falling back to MockStorage for local validation.",
            reason=str(e)
        )
        storage = MockScraperStorage()

    # ==========================================
    # 1. RUN MOCK SAMPLE PIPELINE
    # ==========================================
    logger.info("\n=== RUNNING MOCK SAMPLE PIPELINE ===")
    sample_pipeline = ScraperPipeline(SampleProvider(), SampleParser(), SampleNormalizer(), storage)
    
    logger.info("TEST CASE 1.1: Success")
    await sample_pipeline.run("https://coimbatore.sample-listings.in/apartments/rs-puram")
    
    logger.info("TEST CASE 1.2: Fetch Failure")
    await sample_pipeline.run("https://coimbatore.sample-listings.in/apartments/fail-connection")
    
    logger.info("TEST CASE 1.3: Parse Failure")
    await sample_pipeline.run("https://coimbatore.sample-listings.in/apartments/corrupt-layout")

    # ==========================================
    # 2. RUN 99ACRES PIPELINE
    # ==========================================
    logger.info("\n=== RUNNING 99ACRES PIPELINE ===")
    nn_pipeline = ScraperPipeline(
        NinetyNineAcresProvider(),
        NinetyNineAcresParser(),
        NinetyNineAcresNormalizer(),
        storage
    )

    logger.info("TEST CASE 2.1: Success (RS Puram)")
    await nn_pipeline.run("https://www.99acres.com/mock-listing-rs-puram-apartment")

    logger.info("TEST CASE 2.2: Success (Gandhipuram)")
    await nn_pipeline.run("https://www.99acres.com/mock-listing-gandhipuram-house")

    logger.info("TEST CASE 2.3: Fetch Failure (Network Error)")
    await nn_pipeline.run("https://www.99acres.com/fail-network")

    logger.info("TEST CASE 2.4: Parse Layout Failure (Corrupt HTML)")
    await nn_pipeline.run("https://www.99acres.com/mock-corrupt")

    logger.info("TEST CASE 2.5: Robots.txt Disallow Rule Block")
    provider_with_robots = NinetyNineAcresProvider()
    provider_with_robots._robots_cached = "User-agent: *\nDisallow: /disallowed-path\n"
    provider_with_robots._robots_fetched = True
    nn_pipeline_robots = ScraperPipeline(
        provider_with_robots,
        NinetyNineAcresParser(),
        NinetyNineAcresNormalizer(),
        storage
    )
    await nn_pipeline_robots.run("https://www.99acres.com/disallowed-path")

    # ==========================================
    # 3. RUN MAGICBRICKS PIPELINE
    # ==========================================
    logger.info("\n=== RUNNING MAGICBRICKS PIPELINE ===")
    mb_pipeline = ScraperPipeline(
        MagicBricksProvider(),
        MagicBricksParser(),
        MagicBricksNormalizer(),
        storage
    )

    logger.info("TEST CASE 3.1: Success (RS Puram)")
    await mb_pipeline.run("https://www.magicbricks.com/mock-listing-rs-puram-flat")

    logger.info("TEST CASE 3.2: Success (Gandhipuram)")
    await mb_pipeline.run("https://www.magicbricks.com/mock-listing-gandhipuram-villa")

    logger.info("TEST CASE 3.3: Fetch Failure (Network Error)")
    await mb_pipeline.run("https://www.magicbricks.com/fail-network")

    logger.info("TEST CASE 3.4: Parse Layout Failure (Corrupt HTML)")
    await mb_pipeline.run("https://www.magicbricks.com/mock-corrupt")


if __name__ == "__main__":
    asyncio.run(run_pipeline())
