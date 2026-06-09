from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    id: UUID = Field(..., description="ID of the recommended locality")
    name: str = Field(..., description="Name of the recommended locality")
    city: str = Field(..., description="City name")
    state: str = Field(..., description="State name")
    recommendation_type: str = Field(..., description="Type of recommendation (e.g. SIMILAR, CHEAPER)")
    score: float = Field(..., description="Calculated similarity or rank score")
    reasoning: str = Field(..., description="Detailed explainable justification")
    feature_contribution: Dict[str, float] = Field(..., description="Relative match percentage per feature")
    generation_timestamp: datetime = Field(..., description="Creation time of the recommendation snapshot")


class RecommendationMetadataResponse(BaseModel):
    last_run_timestamp: Optional[datetime] = Field(None, description="Last successful background job run time")
    total_recommendations_count: int = Field(0, description="Total cached recommendation records in table")
    stale_count: int = Field(0, description="Number of recommendations older than 24 hours")
    feature_drift_metrics: Dict[str, Any] = Field(default_factory=dict, description="Mean and Std Dev stats across last execution run")
