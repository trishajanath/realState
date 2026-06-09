import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.database import get_db_session, get_mongo_db
from core.logging import logger

router = APIRouter()

# Global start time to track uptime
START_TIME = time.time()

class HealthStatus(BaseModel):
    status: str = Field(..., description="Overall health of the application ('healthy' or 'unhealthy')")
    postgres: str = Field(..., description="Health status of PostgreSQL ('healthy' or 'unhealthy')")
    mongodb: str = Field(..., description="Health status of MongoDB ('healthy' or 'unhealthy')")
    timestamp: float = Field(..., description="Epoch timestamp of the request")
    uptime_seconds: float = Field(..., description="Seconds since application startup")

@router.get("", response_model=HealthStatus, status_code=status.HTTP_200_OK)
async def check_health(
    db: AsyncSession = Depends(get_db_session),
    mongo: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    """
    Verifies connection to PostgreSQL and MongoDB and monitors backend uptime.
    Returns 503 Service Unavailable if any required service is down.
    """
    postgres_status = "unhealthy"
    mongodb_status = "unhealthy"

    # 1. Verify PostgreSQL connection
    try:
        # Run standard ping query
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            postgres_status = "healthy"
    except Exception as e:
        logger.error("PostgreSQL health check failure", error=str(e))

    # 2. Verify MongoDB connection
    try:
        # Run admin database ping command
        ping_response = await mongo.client.admin.command("ping")
        if ping_response.get("ok") == 1.0:
            mongodb_status = "healthy"
    except Exception as e:
        logger.error("MongoDB health check failure", error=str(e))

    # Compute overall status
    is_healthy = postgres_status == "healthy" and mongodb_status == "healthy"
    overall_status = "healthy" if is_healthy else "unhealthy"

    health_report = HealthStatus(
        status=overall_status,
        postgres=postgres_status,
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
