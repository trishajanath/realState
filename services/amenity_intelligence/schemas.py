from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field

SUPPORTED_CATEGORIES = [
    "school", "college", "hospital", "clinic", "pharmacy",
    "restaurant", "cafe", "grocery_store", "supermarket",
    "gym", "park", "bank", "petrol_station", "bus_stop",
    "railway_station", "airport"
]

CategoryType = Literal[
    "school", "college", "hospital", "clinic", "pharmacy",
    "restaurant", "cafe", "grocery_store", "supermarket",
    "gym", "park", "bank", "petrol_station", "bus_stop",
    "railway_station", "airport"
]


class AmenityBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the amenity")
    category: CategoryType = Field(..., description="Normalized category type")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinates")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinates")
    address: Optional[str] = Field(None, max_length=500, description="Physical address")
    source: Optional[str] = Field(None, max_length=100, description="Information provider source")
    confidence_score: Optional[float] = Field(1.0, ge=0.0, le=1.0, description="Confidence score")


class AmenityCreate(AmenityBase):
    pass


class AmenityResponse(AmenityBase):
    id: UUID
    last_verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AmenityNearbyResponse(AmenityResponse):
    distance_meters: float = Field(..., description="Geodesic distance to target coordinates in meters")
