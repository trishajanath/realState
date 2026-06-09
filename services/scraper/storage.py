from datetime import datetime, timezone
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from interfaces import BaseStorage
import structlog

scraper_logger = structlog.get_logger("scraper.storage")


class MongoScraperStorage(BaseStorage):
    """
    MongoDB persistence manager for the scraper pipeline.
    Saves raw page outputs, parsed data payloads, and records trace logs for failures.
    """
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.listings_collection = db["scraped_raw_listings"]
        self.failures_collection = db["scraper_failures"]

    async def save_payload(
        self,
        source: str,
        raw_payload: str,
        parsed_payload: Dict[str, Any]
    ) -> None:
        """
        Saves raw html/string response, the extracted parsed dictionary, 
        source metadata, and extraction timestamp.
        """
        document = {
            "source": source,
            "raw_payload": raw_payload,
            "parsed_payload": parsed_payload,
            "extracted_at": datetime.now(timezone.utc)
        }
        
        try:
            result = await self.listings_collection.insert_one(document)
            scraper_logger.info(
                "Successfully saved scraped payload to MongoDB",
                source=source,
                document_id=str(result.inserted_id)
            )
        except Exception as e:
            scraper_logger.error(
                "Failed to save scraped payload to MongoDB",
                source=source,
                error=str(e)
            )
            raise e

    async def log_failure(
        self,
        source: str,
        stage: str,
        error_message: str,
        stack_trace: str,
        raw_payload: Optional[str] = None
    ) -> None:
        """
        Records scraper pipeline failures in the database for SRE alerting/monitoring.
        """
        document = {
            "source": source,
            "stage": stage, # 'fetching', 'parsing', 'normalizing', etc.
            "error_message": error_message,
            "stack_trace": stack_trace,
            "raw_payload": raw_payload,
            "failed_at": datetime.now(timezone.utc)
        }
        
        try:
            result = await self.failures_collection.insert_one(document)
            scraper_logger.error(
                "Scraper pipeline failure logged to database",
                source=source,
                stage=stage,
                failure_log_id=str(result.inserted_id)
            )
        except Exception as e:
            # Fallback console log if MongoDB write fails
            scraper_logger.critical(
                "Failed to log pipeline failure to MongoDB!",
                source=source,
                stage=stage,
                error=str(e)
            )
