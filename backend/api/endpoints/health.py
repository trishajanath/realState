import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.database import get_mongo_db
from core.logging import logger

router = APIRouter()

# Global start time to track uptime
START_TIME = time.time()

class HealthStatus(BaseModel):
    status: str = Field(..., description="Overall health of the application ('healthy' or 'unhealthy')")
    mongodb: str = Field(..., description="Health status of MongoDB ('healthy' or 'unhealthy')")
    timestamp: float = Field(..., description="Epoch timestamp of the request")
    uptime_seconds: float = Field(..., description="Seconds since application startup")

@router.get("", response_model=HealthStatus, status_code=status.HTTP_200_OK)
async def check_health(
    mongo: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    """
    Verifies connection to MongoDB and monitors backend uptime.
    Returns 503 Service Unavailable if MongoDB is down.
    """
    mongodb_status = "unhealthy"

    # Verify MongoDB connection
    try:
        # Run admin database ping command
        ping_response = await mongo.client.admin.command("ping")
        if ping_response.get("ok") == 1.0:
            mongodb_status = "healthy"
    except Exception as e:
        logger.error("MongoDB health check failure", error=str(e))

    is_healthy = mongodb_status == "healthy"
    overall_status = "healthy" if is_healthy else "unhealthy"

    health_report = HealthStatus(
        status=overall_status,
        mongodb=mongodb_status,
        timestamp=time.time(),
        uptime_seconds=time.time() - START_TIME
    )

    if not is_healthy:
        # 503 status notifies orchestration layers (e.g. Docker, Kubernetes) of unhealthiness
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_report.model_dump()
        )

    return health_report
