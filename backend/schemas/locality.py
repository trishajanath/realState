from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class LocalityResponse(BaseModel):
    id: str
    name: str
    city: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class TransitMetric(BaseModel):
    name: str
    distance_meters: float


class LocalityMetricsResponse(BaseModel):
    id: Optional[str] = None
    locality_id: str
    avg_property_price: Optional[float] = None
    median_property_price: Optional[float] = None
    avg_price_per_sqft: Optional[float] = None
    median_price_per_sqft: Optional[float] = None
    rental_yield_estimate: Optional[float] = None
    listing_velocity: Optional[float] = None
    property_inventory: Optional[int] = None

    schools_per_sq_km: Optional[float] = None
    hospitals_per_sq_km: Optional[float] = None
    restaurants_per_sq_km: Optional[float] = None
    grocery_stores_per_sq_km: Optional[float] = None
    gyms_per_sq_km: Optional[float] = None
    parks_per_sq_km: Optional[float] = None

    nearest_railway_station: Optional[TransitMetric] = None
    nearest_airport: Optional[TransitMetric] = None
    nearest_bus_terminal: Optional[TransitMetric] = None
    highway_access_score: Optional[float] = None

    metro_proximity: Optional[float] = None
    industrial_corridor_proximity: Optional[float] = None
    it_park_proximity: Optional[float] = None

    class Config:
        from_attributes = True


class LocalityScoresResponse(BaseModel):
    id: Optional[str] = None
    locality_id: str
    education_score: Optional[float] = None
    healthcare_score: Optional[float] = None
    lifestyle_score: Optional[float] = None
    connectivity_score: Optional[float] = None
    investment_score: Optional[float] = None
    overall_livability_score: Optional[float] = None

    class Config:
        from_attributes = True


class RecommendationItemResponse(BaseModel):
    id: str
    name: str
    city: str
    state: str
    recommendation_type: str
    score: float
    reasoning: str
    feature_contribution: Dict[str, float]
    generation_timestamp: str

    class Config:
        from_attributes = True


class AmenityResponse(BaseModel):
    id: str
    name: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    source: Optional[str] = None
    confidence_score: Optional[float] = None
    locality_id: Optional[str] = None

    class Config:
        from_attributes = True
