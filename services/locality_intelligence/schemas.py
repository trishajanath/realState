from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class LocalityBase(BaseModel):
    name: str
    city: str
    state: str


class LocalityResponse(LocalityBase):
    id: UUID
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


# --- Metrics Schemas ---
class PropertyMetrics(BaseModel):
    avg_property_price: Optional[float] = None
    median_property_price: Optional[float] = None
    avg_price_per_sqft: Optional[float] = None
    median_price_per_sqft: Optional[float] = None
    rental_yield_estimate: Optional[float] = None
    listing_velocity: Optional[float] = None
    property_inventory: Optional[int] = None


class AmenityMetrics(BaseModel):
    schools_per_sq_km: Optional[float] = None
    hospitals_per_sq_km: Optional[float] = None
    restaurants_per_sq_km: Optional[float] = None
    grocery_stores_per_sq_km: Optional[float] = None
    gyms_per_sq_km: Optional[float] = None
    parks_per_sq_km: Optional[float] = None


class AccessibilityMetrics(BaseModel):
    nearest_railway_station: Optional[Dict[str, Any]] = None
    nearest_airport: Optional[Dict[str, Any]] = None
    nearest_bus_terminal: Optional[Dict[str, Any]] = None
    highway_access_score: Optional[float] = None


class InfrastructureMetrics(BaseModel):
    planned_projects: Optional[List[Dict[str, Any]]] = None
    metro_proximity: Optional[float] = None
    industrial_corridor_proximity: Optional[float] = None
    it_park_proximity: Optional[float] = None


class LocalityMetricsResponse(BaseModel):
    locality_id: UUID
    property: PropertyMetrics
    amenities: AmenityMetrics
    accessibility: AccessibilityMetrics
    infrastructure: InfrastructureMetrics
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Scores Schemas ---
class LocalityScoresResponse(BaseModel):
    locality_id: UUID
    education_score: float
    healthcare_score: float
    lifestyle_score: float
    connectivity_score: float
    investment_score: float
    overall_livability_score: float
    updated_at: datetime
    explanations: Dict[str, str] = Field(
        default_factory=dict,
        description="Explainable breakdown of scoring calculations for reproducibility."
    )

    class Config:
        from_attributes = True


# --- Price History Schemas ---
class PriceHistoryEntry(BaseModel):
    year: int
    quarter: int
    avg_price_per_sqft: Optional[float] = None
    median_price_per_sqft: Optional[float] = None


class LocalityPriceHistoryResponse(BaseModel):
    locality_id: UUID
    history: List[PriceHistoryEntry]

    class Config:
        from_attributes = True
