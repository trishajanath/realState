import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, Table, Index, Double, DateTime, JSON, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
from geoalchemy2 import Geography

Base = declarative_base()


class Locality(Base):
    __tablename__ = "localities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False, default="Coimbatore")
    state = Column(String(100), nullable=False, default="Tamil Nadu")
    location = Column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )


class LocalityMetrics(Base):
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

    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class LocalityScores(Base):
    __tablename__ = "locality_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    education_score = Column(Double(precision=53), nullable=True)
    healthcare_score = Column(Double(precision=53), nullable=True)
    lifestyle_score = Column(Double(precision=53), nullable=True)
    connectivity_score = Column(Double(precision=53), nullable=True)
    investment_score = Column(Double(precision=53), nullable=True)

    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class LocalityRecommendation(Base):
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
    __tablename__ = "recommendation_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(String(50), nullable=False)  # SUCCESS, FAILURE
    error_message = Column(String(1000), nullable=True)
    features_summary = Column(JSON, nullable=True)  # Snapshot of means & std devs for drift detection
