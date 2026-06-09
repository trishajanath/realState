import sys
import logging
import structlog
from prometheus_client import Counter, Summary, Histogram, Gauge

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
recommendation_requests_total = Counter(
    "recommendation_requests_total",
    "Total API requests processed by Similar Locality Recommendation Service",
    ["method", "endpoint", "status"]
)

recommendation_generation_failures_total = Counter(
    "recommendation_generation_failures_total",
    "Total recommendation recomputation job failures"
)

recommendation_geo_drift_index = Gauge(
    "recommendation_geo_drift_index",
    "Quantified metric shift representing average feature drift across all features",
    ["feature_name"]
)

recommendation_stale_count = Gauge(
    "recommendation_stale_count",
    "Number of cached recommendations older than 24 hours"
)

recommendation_query_latency_seconds = Histogram(
    "recommendation_query_latency_seconds",
    "Latencies of recommendation API fetch queries",
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0)
)
