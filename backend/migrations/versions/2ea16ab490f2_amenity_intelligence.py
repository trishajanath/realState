"""amenity intelligence updates

Revision ID: 2ea16ab490f2
Revises: 9ca283abf90c
Create Date: 2026-06-09 23:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ea16ab490f2'
down_revision: Union[str, None] = '9ca283abf90c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Rename column 'type' to 'category'
    op.alter_column('amenities', 'type', new_column_name='category')
    
    # 2. Rename index: drop old, create new
    op.drop_index('idx_amenity_type', table_name='amenities')
    op.create_index('idx_amenity_category', 'amenities', ['category'], unique=False)
    
    # 3. Add new columns
    op.add_column('amenities', sa.Column('address', sa.String(length=500), nullable=True))
    op.add_column('amenities', sa.Column('source', sa.String(length=100), nullable=True))
    op.add_column('amenities', sa.Column('confidence_score', sa.Float(), nullable=True))
    op.add_column('amenities', sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # 1. Drop added columns
    op.drop_column('amenities', 'last_verified_at')
    op.drop_column('amenities', 'confidence_score')
    op.drop_column('amenities', 'source')
    op.drop_column('amenities', 'address')
    
    # 2. Rename index back
    op.drop_index('idx_amenity_category', table_name='amenities')
    op.create_index('idx_amenity_type', 'amenities', ['category'], unique=False)
    
    # 3. Rename column back
    op.alter_column('amenities', 'category', new_column_name='type')
