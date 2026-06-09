import sys
import logging
import structlog
from prometheus_client import Counter, Summary

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
# Total count of requests by endpoint, HTTP status code
locality_requests_total = Counter(
    "locality_intelligence_requests_total",
    "Total API requests processed by Locality Intelligence Service",
    ["method", "endpoint", "status"]
)

# Latency summary of nightly and weekly aggregation jobs in seconds
job_duration_seconds = Summary(
    "locality_intelligence_job_duration_seconds",
    "Time spent running locality intelligence background jobs",
    ["job_name"]
)
