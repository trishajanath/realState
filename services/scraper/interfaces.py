from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class BaseProvider(ABC):
    """
    Abstract interface for scraping providers.
    Fetches raw unparsed content from a target URL or HTTP resource.
    """
    def __init__(self, source_name: str):
        self.source_name = source_name

    @abstractmethod
    async def fetch_raw(self, target_url: str) -> str:
        """
        Fetches the raw page contents (HTML string, API response JSON, etc.) 
        from the remote source. Raises exceptions on failure.
        """
        pass


class BaseParser(ABC):
    """
    Abstract interface for parsing raw page contents.
    Extracts unstructured data fields from raw inputs.
    """
    @abstractmethod
    def parse_raw(self, raw_data: str) -> Dict[str, Any]:
        """
        Parses raw text data and extracts key property attributes as a dictionary.
        Should raise appropriate parsing exceptions if layout changes break parsing.
        """
        pass


class BaseNormalizer(ABC):
    """
    Abstract interface for data normalization.
    Standardizes schema formats, type casts values, and validates parameters.
    """
    @abstractmethod
    def normalize(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardizes raw data inputs, strips spaces, sanitizes strings, 
        and formats structures to match the target database schemas.
        """
        pass


class BaseStorage(ABC):
    """
    Abstract interface for persistence layers.
    Saves scraped results and failure trace records.
    """
    @abstractmethod
    async def save_payload(
        self,
        source: str,
        raw_payload: str,
        parsed_payload: Dict[str, Any]
    ) -> None:
        """
        Saves the raw payload string alongside the parsed dictionary, 
        recording timestamps and data source identifiers in MongoDB.
        """
        pass

    @abstractmethod
    async def log_failure(
        self,
        source: str,
        stage: str,
        error_message: str,
        stack_trace: str,
        raw_payload: Optional[str] = None
    ) -> None:
        """
        Records details of scraper or parser failure states, tracebacks, 
        and contextual payloads in a diagnostics logging collection.
        """
        pass
