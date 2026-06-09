"""add is_llm to recommendations

Revision ID: 4ea17bc521f4
Revises: 3ea17bc521f3
Create Date: 2026-06-09 23:59:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ea17bc521f4'
down_revision: Union[str, None] = '3ea17bc521f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "locality_recommendations",
        sa.Column("is_llm", sa.Boolean(), nullable=False, server_default=sa.text("false"))
    )


def downgrade() -> None:
    op.drop_column("locality_recommendations", "is_llm")
