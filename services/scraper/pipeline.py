import traceback
from typing import Optional
import structlog

from interfaces import BaseProvider, BaseParser, BaseNormalizer, BaseStorage

pipeline_logger = structlog.get_logger("scraper.pipeline")


class ScraperPipeline:
    """
    Coordinates data extraction pipeline execution.
    Handles stage-specific errors and persists failures for system observability.
    """
    def __init__(
        self,
        provider: BaseProvider,
        parser: BaseParser,
        normalizer: BaseNormalizer,
        storage: BaseStorage
    ):
        self.provider = provider
        self.parser = parser
        self.normalizer = normalizer
        self.storage = storage
        self.source = provider.source_name

    async def run(self, target_url: str) -> bool:
        """
        Executes the scraper pipeline sequentially.
        Returns True if successful, False if any stage failed.
        """
        raw_payload = None
        parsed_payload = None
        normalized_payload = None

        # Stage 1: Data Fetching (Provider)
        pipeline_logger.info("Scraper pipeline fetching started", source=self.source, url=target_url)
        try:
            raw_payload = await self.provider.fetch_raw(target_url)
        except Exception as e:
            err_msg = str(e)
            stack = traceback.format_exc()
            pipeline_logger.error("Scraper pipeline fetching failed", source=self.source, error=err_msg)
            
            await self.storage.log_failure(
                source=self.source,
                stage="fetching",
                error_message=err_msg,
                stack_trace=stack,
                raw_payload=None
            )
            return False

        # Stage 2: Data Parsing (Parser)
        pipeline_logger.info("Scraper pipeline parsing started", source=self.source)
        try:
            parsed_payload = self.parser.parse_raw(raw_payload)
        except Exception as e:
            err_msg = str(e)
            stack = traceback.format_exc()
            pipeline_logger.error("Scraper pipeline parsing failed", source=self.source, error=err_msg)
            
            await self.storage.log_failure(
                source=self.source,
                stage="parsing",
                error_message=err_msg,
                stack_trace=stack,
                raw_payload=raw_payload
            )
            return False

        # Stage 3: Schema Normalization (Normalizer)
        pipeline_logger.info("Scraper pipeline normalization started", source=self.source)
        try:
            normalized_payload = self.normalizer.normalize(parsed_payload)
        except Exception as e:
            err_msg = str(e)
            stack = traceback.format_exc()
            pipeline_logger.error("Scraper pipeline normalization failed", source=self.source, error=err_msg)
            
            await self.storage.log_failure(
                source=self.source,
                stage="normalizing",
                error_message=err_msg,
                stack_trace=stack,
                raw_payload=raw_payload
            )
            return False

        # Stage 4: Persistance (Storage)
        pipeline_logger.info("Scraper pipeline storage started", source=self.source)
        try:
            await self.storage.save_payload(
                source=self.source,
                raw_payload=raw_payload,
                parsed_payload=normalized_payload
            )
        except Exception as e:
            err_msg = str(e)
            stack = traceback.format_exc()
            pipeline_logger.error("Scraper pipeline storage failed", source=self.source, error=err_msg)
            
            await self.storage.log_failure(
                source=self.source,
                stage="storage",
                error_message=err_msg,
                stack_trace=stack,
                raw_payload=raw_payload
            )
            return False

        pipeline_logger.info("Scraper pipeline completed successfully", source=self.source)
        return True
