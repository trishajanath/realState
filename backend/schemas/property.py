from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl, field_validator


class PropertyBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Listing title")
    property_type: str = Field(..., description="Property Type (e.g. Apartment, Villa, Land)")
    listing_type: str = Field(..., description="Listing Type (e.g. Rent, Sale)")
    price: Decimal = Field(..., gt=0, description="Price in INR")
    area_sqft: Decimal = Field(..., gt=0, description="Super built-up area in square feet")
    bedrooms: Optional[int] = Field(None, ge=0, description="Number of bedrooms")
    bathrooms: Optional[int] = Field(None, ge=0, description="Number of bathrooms")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude coordinate")
    locality_id: Optional[UUID] = Field(None, description="UUID of the locality")
    city: str = Field("Coimbatore", description="City name")
    state: str = Field("Tamil Nadu", description="State name")
    source: Optional[str] = Field(None, description="Data source site name")
    listing_url: Optional[str] = Field(None, description="Direct URL path to the listing")
    images: Optional[List[str]] = Field(None, description="Property listing images")


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    area_sqft: Optional[Decimal] = Field(None, gt=0)
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    locality_id: Optional[UUID] = None
    city: Optional[str] = None
    state: Optional[str] = None
    source: Optional[str] = None
    listing_url: Optional[str] = None


class LocalityMiniResponse(BaseModel):
    id: UUID
    name: str
    city: str
    state: str

    class Config:
        from_attributes = True


class PropertyResponse(PropertyBase):
    id: UUID
    locality: Optional[LocalityMiniResponse] = None
    ai_description: Optional[str] = Field(None, description="AI-generated description matching listing parameters")
    ai_investment_rating: Optional[str] = Field(None, description="AI rating assessment for the property value")

    class Config:
        from_attributes = True


class PropertyListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    results: List[PropertyResponse]
