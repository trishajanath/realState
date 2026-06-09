"""create initial schema

Revision ID: 8ea162abf90b
Revises: 
Create Date: 2026-06-09 22:04:12.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '8ea162abf90b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostGIS Extension if not already present
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS postgis"))

    # 2. Create 'localities' table
    op.create_table(
        "localities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id")
    )
    # Composite unique index to avoid duplication
    op.create_index(
        "idx_locality_name_city_state",
        "localities",
        ["name", "city", "state"],
        unique=True
    )

    # 3. Create 'amenities' table
    op.create_table(
        "amenities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("latitude", sa.Double(precision=53), nullable=False),
        sa.Column("longitude", sa.Double(precision=53), nullable=False),
        sa.Column(
            "location",
            geoalchemy2.types.Geography(
                geometry_type="POINT",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geography",
                nullable=True,
                spatial_index=False # We will create the spatial index explicitly below
            ),
            nullable=True
        ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index("idx_amenity_type", "amenities", ["type"], unique=False)
    # Explicitly create GIST index for geographic queries
    op.create_index(
        "idx_amenities_location",
        "amenities",
        ["location"],
        unique=False,
        postgresql_using="gist"
    )

    # 4. Create 'properties' table
    op.create_table(
        "properties",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("property_type", sa.String(length=50), nullable=False),
        sa.Column("listing_type", sa.String(length=50), nullable=False),
        sa.Column("price", sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column("area_sqft", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("bedrooms", sa.Integer(), nullable=True),
        sa.Column("bathrooms", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Double(precision=53), nullable=True),
        sa.Column("longitude", sa.Double(precision=53), nullable=True),
        sa.Column(
            "location",
            geoalchemy2.types.Geography(
                geometry_type="POINT",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geography",
                nullable=True,
                spatial_index=False
            ),
            nullable=True
        ),
        sa.Column("locality_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("listing_url", sa.String(length=1024), nullable=True),
        sa.ForeignKeyConstraint(["locality_id"], ["localities.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index("idx_property_price", "properties", ["price"], unique=False)
    op.create_index("idx_property_type_listing", "properties", ["property_type", "listing_type"], unique=False)
    op.create_index("idx_property_locality_id", "properties", ["locality_id"], unique=False)
    # Explicitly create GIST spatial index
    op.create_index(
        "idx_properties_location",
        "properties",
        ["location"],
        unique=False,
        postgresql_using="gist"
    )

    # 5. Create 'property_amenities' association table
    op.create_table(
        "property_amenities",
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amenity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["amenity_id"], ["amenities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("property_id", "amenity_id")
    )


def downgrade() -> None:
    # Drop tables and indexes in reverse order of creation and dependencies
    op.drop_table("property_amenities")
    
    # Drops properties table and its indexes
    op.drop_index("idx_properties_location", table_name="properties")
    op.drop_index("idx_property_locality_id", table_name="properties")
    op.drop_index("idx_property_type_listing", table_name="properties")
    op.drop_index("idx_property_price", table_name="properties")
    op.drop_table("properties")

    # Drops amenities table and its indexes
    op.drop_index("idx_amenities_location", table_name="amenities")
    op.drop_index("idx_amenity_type", table_name="amenities")
    op.drop_table("amenities")

    # Drops localities table and its indexes
    op.drop_index("idx_locality_name_city_state", table_name="localities")
    op.drop_table("localities")
    
    # Optionally remove PostGIS if no other apps depend on it
    # op.execute(sa.text("DROP EXTENSION IF EXISTS postgis"))
