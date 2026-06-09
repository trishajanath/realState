"""add locality intelligence tables

Revision ID: 9ca283abf90c
Revises: 8ea162abf90b
Create Date: 2026-06-09 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '9ca283abf90c'
down_revision: Union[str, None] = '8ea162abf90b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Alter localities: add location geography POINT column
    op.add_column(
        "localities",
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
        )
    )
    # GIST index for localities location
    op.create_index(
        "idx_localities_location",
        "localities",
        ["location"],
        unique=False,
        postgresql_using="gist"
    )

    # 2. Create 'locality_metrics' table
    op.create_table(
        "locality_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("locality_id", postgresql.UUID(as_uuid=True), nullable=False),
        # Property Metrics
        sa.Column("avg_property_price", sa.Float(), nullable=True),
        sa.Column("median_property_price", sa.Float(), nullable=True),
        sa.Column("avg_price_per_sqft", sa.Float(), nullable=True),
        sa.Column("median_price_per_sqft", sa.Float(), nullable=True),
        sa.Column("rental_yield_estimate", sa.Float(), nullable=True),
        sa.Column("listing_velocity", sa.Float(), nullable=True),
        sa.Column("property_inventory", sa.Integer(), nullable=True),
        # Amenity Metrics
        sa.Column("schools_per_sq_km", sa.Float(), nullable=True),
        sa.Column("hospitals_per_sq_km", sa.Float(), nullable=True),
        sa.Column("restaurants_per_sq_km", sa.Float(), nullable=True),
        sa.Column("grocery_stores_per_sq_km", sa.Float(), nullable=True),
        sa.Column("gyms_per_sq_km", sa.Float(), nullable=True),
        sa.Column("parks_per_sq_km", sa.Float(), nullable=True),
        # Accessibility Metrics
        sa.Column("nearest_railway_station", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("nearest_airport", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("nearest_bus_terminal", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("highway_access_score", sa.Float(), nullable=True),
        # Infrastructure Metrics
        sa.Column("planned_projects", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("metro_proximity", sa.Float(), nullable=True),
        sa.Column("industrial_corridor_proximity", sa.Float(), nullable=True),
        sa.Column("it_park_proximity", sa.Float(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["locality_id"], ["localities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("locality_id")
    )
    op.create_index("idx_metrics_locality_id", "locality_metrics", ["locality_id"], unique=True)

    # 3. Create 'locality_scores' table
    op.create_table(
        "locality_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("locality_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("education_score", sa.Float(), nullable=True),
        sa.Column("healthcare_score", sa.Float(), nullable=True),
        sa.Column("lifestyle_score", sa.Float(), nullable=True),
        sa.Column("connectivity_score", sa.Float(), nullable=True),
        sa.Column("investment_score", sa.Float(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["locality_id"], ["localities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("locality_id")
    )
    op.create_index("idx_scores_locality_id", "locality_scores", ["locality_id"], unique=True)

    # 4. Create 'locality_price_history' table
    op.create_table(
        "locality_price_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("locality_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("quarter", sa.Integer(), nullable=False),
        sa.Column("avg_price_per_sqft", sa.Float(), nullable=True),
        sa.Column("median_price_per_sqft", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["locality_id"], ["localities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(
        "idx_price_history_locality_year_quarter",
        "locality_price_history",
        ["locality_id", "year", "quarter"],
        unique=True
    )


def downgrade() -> None:
    op.drop_index("idx_price_history_locality_year_quarter", table_name="locality_price_history")
    op.drop_table("locality_price_history")
    
    op.drop_index("idx_scores_locality_id", table_name="locality_scores")
    op.drop_table("locality_scores")
    
    op.drop_index("idx_metrics_locality_id", table_name="locality_metrics")
    op.drop_table("locality_metrics")
    
    op.drop_index("idx_localities_location", table_name="localities")
    op.drop_column("localities", "location")
