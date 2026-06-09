import sys
import logging
import structlog
from prometheus_client import Counter, Summary, Histogram

# 1. Structured Logging Configuration
def configure_logging(log_level: str = "INFO"):
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper(), logging.INFO)
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.format_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(colors=True)
        ],
        logger_factory=structlog.PrintLoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        cache_logger_on_first_use=True
    )


# 2. Prometheus Metrics Declarations
amenity_requests_total = Counter(
    "amenity_intelligence_requests_total",
    "Total API requests processed by Amenity Intelligence Service",
    ["method", "endpoint", "status"]
)

amenity_ingestion_failures_total = Counter(
    "amenity_ingestion_failures_total",
    "Total ingestion pipeline failures in Amenity Intelligence Service",
    ["stage", "reason"]
)

amenity_duplicates_detected_total = Counter(
    "amenity_duplicates_detected_total",
    "Total duplicate amenities detected and merged/resolved"
)

amenity_geo_query_latency_seconds = Histogram(
    "amenity_geo_query_latency_seconds",
    "Geospatial radial query latency in seconds",
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
)
