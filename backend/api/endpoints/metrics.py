from fastapi import APIRouter, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Histogram
from pydantic import BaseModel
from core.logging import logger

router = APIRouter()

class ClientMetric(BaseModel):
    metric_name: str
    value_ms: float

CLIENT_LATENCY_METRICS = Histogram(
    "client_latency_seconds",
    "Client-side real estate map latency metrics in seconds",
    ["metric_name"]
)

@router.get("", response_class=Response)
def get_metrics():
    """
    Exposes system metrics in standard Prometheus exposition format.
    Allows external metrics gatherers (Prometheus agents) to scrape telemetry.
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

@router.post("/client")
async def record_client_metric(metric: ClientMetric):
    """
    Records a client-side performance metric in the Prometheus registry.
    """
    try:
        val_sec = metric.value_ms / 1000.0
        CLIENT_LATENCY_METRICS.labels(metric_name=metric.metric_name).observe(val_sec)
        logger.info(
            "Recorded client latency metric",
            metric_name=metric.metric_name,
            value_ms=metric.value_ms
        )
        return {"status": "success"}
    except Exception as e:
        logger.error("Failed to record client metric", error=str(e))
        return {"status": "error", "message": str(e)}
