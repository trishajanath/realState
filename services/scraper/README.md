# Generic Scraper Framework

This directory houses a modular, extensible scraper pipeline framework designed to safely extract, parse, normalize, and persist property listing data into MongoDB.

---

## Architecture Overview

The framework decouples data collection steps into four primary roles:

1. **`Provider` (`BaseProvider`)**: Interacts with target servers/HTTP APIs. Fetches the raw string/payload and handles rate limits, user-agents, and connection retries.
2. **`Parser` (`BaseParser`)**: Parses raw inputs (like HTML or API responses) to extract structured, unvalidated dictionaries containing basic property listing parameters.
3. **`Normalizer` (`BaseNormalizer`)**: Sanitizes text, converts data types (e.g. string prices to Decimals), and validates data schemas using Pydantic models.
4. **`Storage` (`BaseStorage`)**: Persists both raw payloads and normalized listings to MongoDB collections. It also handles failure logging for errors in the pipeline.

---

## How to Add a New Scraper Provider

To support a new real estate source (e.g., MagicBricks, 99acres), perform the following steps:

### Step 1: Create a Provider Class
Inherit from `BaseProvider` in `interfaces.py` and implement the `fetch_raw()` method:
```python
from interfaces import BaseProvider

class MagicBricksProvider(BaseProvider):
    async def fetch_raw(self, target_url: str) -> str:
        # Fetch logic using httpx or selenium
        return raw_html_response
```

### Step 2: Create a Parser Class
Inherit from `BaseParser` and implement the `parse_raw()` method:
```python
from interfaces import BaseParser

class MagicBricksParser(BaseParser):
    def parse_raw(self, raw_data: str) -> dict:
        # Parse logic (BeautifulSoup / select selectors)
        return {"title": parsed_title, "price": parsed_price}
```

### Step 3: Create a Normalizer Class
Inherit from `BaseNormalizer` and implement the `normalize()` method:
```python
from interfaces import BaseNormalizer

class MagicBricksNormalizer(BaseNormalizer):
    def normalize(self, parsed_data: dict) -> dict:
        # Standardize types and return dictionary mapping standard schema
        return normalized_record
```

### Step 4: Register & Run inside a Pipeline
Pass the newly created instances to the `ScraperPipeline` orchestrator:
```python
from pipeline import ScraperPipeline
from storage import MongoScraperStorage

pipeline = ScraperPipeline(
    provider=MagicBricksProvider(source_name="magicbricks"),
    parser=MagicBricksParser(),
    normalizer=MagicBricksNormalizer(),
    storage=MongoScraperStorage(db)
)

await pipeline.run("https://magicbricks.com/coimbatore-properties...")
```
---

## Logging and Outage/Failure Monitoring
All errors (like HTTP 403 blocks, layout drifts causing parser misses, schema validation errors) are captured. The orchestrator automatically:
1. Emits a structured logger error via `structlog`.
2. Stores a detailed error document (containing step, stack trace, timestamp, raw payload context) in the MongoDB `scraper_failures` collection.
