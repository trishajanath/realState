"""recommendation engine updates

Revision ID: 3ea17bc521f3
Revises: 2ea16ab490f2
Create Date: 2026-06-09 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3ea17bc521f3'
down_revision: Union[str, None] = '2ea16ab490f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create 'locality_recommendations' table
    op.create_table(
        "locality_recommendations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_locality_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recommended_locality_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recommendation_type", sa.String(length=50), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("reasoning", sa.String(length=1000), nullable=True),
        sa.Column("feature_contribution", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["target_locality_id"], ["localities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recommended_locality_id"], ["localities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index("idx_recommendation_target", "locality_recommendations", ["target_locality_id"], unique=False)
    op.create_index("idx_recommendation_type", "locality_recommendations", ["recommendation_type"], unique=False)

    # 2. Create 'recommendation_runs' table
    op.create_table(
        "recommendation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_message", sa.String(length=1000), nullable=True),
        sa.Column("features_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id")
    )


def downgrade() -> None:
    op.drop_table("recommendation_runs")
    op.drop_index("idx_recommendation_type", table_name="locality_recommendations")
    op.drop_index("idx_recommendation_target", table_name="locality_recommendations")
    op.drop_table("locality_recommendations")
