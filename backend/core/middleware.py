import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram

from core.logging import logger

# --- Prometheus Metrics Definitions ---
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total count of HTTP requests processed",
    ["method", "endpoint", "status_code"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency distribution in seconds",
    ["method", "endpoint"]
)


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Middleware that captures request execution metadata, binds request IDs,
    records execution metrics, and outputs structured logs.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate or intercept trace correlation ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Measure processing duration
        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else None
        
        logger.info(
            "Request processing started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=client_ip
        )
        
        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time
            
            # Log completion metrics
            logger.info(
                "Request completed successfully",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_seconds=duration,
                client_ip=client_ip
            )
            
            # Record metrics in the Prometheus registry
            HTTP_REQUESTS_TOTAL.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=str(response.status_code)
            ).inc()
            
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)
            
            # Propagate Request ID back in headers
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            duration = time.perf_counter() - start_time
            
            # Log critical trace details
            logger.error(
                "Request crashed with unhandled exception",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                error=str(e),
                duration_seconds=duration,
                client_ip=client_ip
            )
            
            # Record failed metric
            HTTP_REQUESTS_TOTAL.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code="500"
            ).inc()
            
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)
            
            # Let the exception propagate to global error handlers
            raise e
