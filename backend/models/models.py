import uuid
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Table, Index, Double, DateTime, JSON, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography

from models.base import Base

# Many-to-Many Association Table between Properties and Amenities
property_amenities = Table(
    "property_amenities",
    Base.metadata,
    Column(
        "property_id",
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "amenity_id",
        UUID(as_uuid=True),
        ForeignKey("amenities.id", ondelete="CASCADE"),
        primary_key=True
    )
)


class Locality(Base):
    """
    Represents residential or commercial neighborhoods in Coimbatore (e.g. RS Puram, Gandhipuram).
    """
    __tablename__ = "localities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False, default="Coimbatore")
    state = Column(String(100), nullable=False, default="Tamil Nadu")

    location = Column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )

    # Relationships
    properties = relationship("Property", back_populates="locality")
    metrics = relationship("LocalityMetrics", back_populates="locality", uselist=False, cascade="all, delete-orphan")
    scores = relationship("LocalityScores", back_populates="locality", uselist=False, cascade="all, delete-orphan")
    price_history = relationship("LocalityPriceHistory", back_populates="locality", cascade="all, delete-orphan")

    # Composite Unique Index to prevent locality duplication in Coimbatore
    __table_args__ = (
        Index("idx_locality_name_city_state", "name", "city", "state", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Locality {self.name}, {self.city}>"


class Property(Base):
    """
    Represents property listings scraped or posted on the platform.
    """
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    property_type = Column(String(50), nullable=False)  # Apartment, Villa, Land, Independent House, etc.
    listing_type = Column(String(50), nullable=False)   # Rent, Sale
    price = Column(Numeric(15, 2), nullable=False)
    area_sqft = Column(Numeric(10, 2), nullable=False)
    bedrooms = Column(Integer, nullable=True)           # Nullable for commercial spaces / vacant land plots
    bathrooms = Column(Integer, nullable=True)          # Nullable for plots
    latitude = Column(Double(precision=53), nullable=True)
    longitude = Column(Double(precision=53), nullable=True)
    
    # PostGIS Geography Column
    # Geography type automatically calculates distance in meters on the WGS 84 ellipsoid (SRID 4326)
    location = Column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )

    # Locality Relationship
    locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="SET NULL"), nullable=True)
    locality = relationship("Locality", back_populates="properties")

    # Denormalized fields to optimize simple queries
    city = Column(String(100), nullable=False, default="Coimbatore")
    state = Column(String(100), nullable=False, default="Tamil Nadu")
    
    # Metadata fields
    source = Column(String(100), nullable=True)         # MagicBricks, 99acres, etc.
    listing_url = Column(String(1024), nullable=True)
    
    # AI Enrichment columns
    ai_description = Column(String(2000), nullable=True)
    ai_investment_rating = Column(String(500), nullable=True)

    # Many-to-Many Relationship with Amenities
    amenities = relationship("Amenity", secondary=property_amenities, back_populates="properties")

    # Indexes
    __table_args__ = (
        Index("idx_property_price", "price"),
        Index("idx_property_type_listing", "property_type", "listing_type"),
        Index("idx_property_locality_id", "locality_id"),
    )

    def __repr__(self) -> str:
        return f"<Property {self.title} - {self.price} INR>"


class Amenity(Base):
    """
    Represents points of interest / landmarks (e.g. schools, transit networks, parks, malls).
    """
    __tablename__ = "amenities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)            # school, college, hospital, clinic, etc.
    latitude = Column(Double(precision=53), nullable=False)
    longitude = Column(Double(precision=53), nullable=False)
    
    # PostGIS Geography Column
    location = Column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )

    address = Column(String(500), nullable=True)
    source = Column(String(100), nullable=True)
    confidence_score = Column(Double(precision=53), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)

    # Many-to-Many Relationship with Properties
    properties = relationship("Property", secondary=property_amenities, back_populates="amenities")

    # Indexes
    __table_args__ = (
        Index("idx_amenity_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<Amenity {self.name} ({self.category})>"


class LocalityMetrics(Base):
    """
    Persists computed aggregates of property, amenity, and accessibility parameters.
    """
    __tablename__ = "locality_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Property Metrics
    avg_property_price = Column(Double(precision=53), nullable=True)
    median_property_price = Column(Double(precision=53), nullable=True)
    avg_price_per_sqft = Column(Double(precision=53), nullable=True)
    median_price_per_sqft = Column(Double(precision=53), nullable=True)
    rental_yield_estimate = Column(Double(precision=53), nullable=True)
    listing_velocity = Column(Double(precision=53), nullable=True)
    property_inventory = Column(Integer, nullable=True)

    # Amenity Metrics
    schools_per_sq_km = Column(Double(precision=53), nullable=True)
    hospitals_per_sq_km = Column(Double(precision=53), nullable=True)
    restaurants_per_sq_km = Column(Double(precision=53), nullable=True)
    grocery_stores_per_sq_km = Column(Double(precision=53), nullable=True)
    gyms_per_sq_km = Column(Double(precision=53), nullable=True)
    parks_per_sq_km = Column(Double(precision=53), nullable=True)

    # Accessibility Metrics (stored as JSON objects with name and distance)
    nearest_railway_station = Column(JSON, nullable=True)
    nearest_airport = Column(JSON, nullable=True)
    nearest_bus_terminal = Column(JSON, nullable=True)
    highway_access_score = Column(Double(precision=53), nullable=True)

    # Infrastructure Metrics
    planned_projects = Column(JSON, nullable=True)
    metro_proximity = Column(Double(precision=53), nullable=True)
    industrial_corridor_proximity = Column(Double(precision=53), nullable=True)
    it_park_proximity = Column(Double(precision=53), nullable=True)

    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationship
    locality = relationship("Locality", back_populates="metrics")


class LocalityScores(Base):
    """
    Persists computed scores generated by the explainable Locality Scoring Engine.
    """
    __tablename__ = "locality_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    education_score = Column(Double(precision=53), nullable=True)
    healthcare_score = Column(Double(precision=53), nullable=True)
    lifestyle_score = Column(Double(precision=53), nullable=True)
    connectivity_score = Column(Double(precision=53), nullable=True)
    investment_score = Column(Double(precision=53), nullable=True)

    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationship
    locality = relationship("Locality", back_populates="scores")


class LocalityPriceHistory(Base):
    """
    Chronological quarterly average and median pricing details for locality trends.
    """
    __tablename__ = "locality_price_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="CASCADE"), nullable=False)
    
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)
    avg_price_per_sqft = Column(Double(precision=53), nullable=True)
    median_price_per_sqft = Column(Double(precision=53), nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationship
    locality = relationship("Locality", back_populates="price_history")

    # Composite Unique index for locality+year+quarter
    __table_args__ = (
        Index("idx_price_history_locality_year_quarter", "locality_id", "year", "quarter", unique=True),
    )


class LocalityRecommendation(Base):
    """
    Persists computed recommendation entries for localities.
    """
    __tablename__ = "locality_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="CASCADE"), nullable=False)
    recommended_locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="CASCADE"), nullable=False)
    recommendation_type = Column(String(50), nullable=False)  # SIMILAR, CHEAPER, PREMIUM, etc.
    score = Column(Double(precision=53), nullable=False)
    reasoning = Column(String(1000), nullable=True)
    feature_contribution = Column(JSON, nullable=True)
    is_llm = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Indexes
    __table_args__ = (
        Index("idx_recommendation_target", "target_locality_id"),
        Index("idx_recommendation_type", "recommendation_type"),
    )


class RecommendationRun(Base):
    """
    Logs background recommendation job execution statistics and outputs.
    """
    __tablename__ = "recommendation_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(String(50), nullable=False)  # SUCCESS, FAILURE
    error_message = Column(String(1000), nullable=True)
    features_summary = Column(JSON, nullable=True)  # Snapshot of means & std devs for drift detection
