import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, Table, Index, Double, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
from geoalchemy2 import Geography

Base = declarative_base()

# Association Table
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


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)            # school, college, hospital, clinic, etc.
    latitude = Column(Double(precision=53), nullable=False)
    longitude = Column(Double(precision=53), nullable=False)
    location = Column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )

    address = Column(String(500), nullable=True)
    source = Column(String(100), nullable=True)
    confidence_score = Column(Double(precision=53), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)

    properties = relationship("Property", secondary=property_amenities, back_populates="amenities")

    __table_args__ = (
        Index("idx_amenity_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<Amenity {self.name} ({self.category})>"


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)

    amenities = relationship("Amenity", secondary=property_amenities, back_populates="properties")
