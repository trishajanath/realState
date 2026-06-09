from fastapi import APIRouter, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

router = APIRouter()

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
