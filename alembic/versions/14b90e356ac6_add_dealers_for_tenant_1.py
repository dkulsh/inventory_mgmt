"""add dealers for tenant 1

Revision ID: 14b90e356ac6
Revises: d38778572846
Create Date: 2024-03-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14b90e356ac6'
down_revision: Union[str, None] = 'd38778572846'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add two dealers for tenant 1
    op.execute("""
        INSERT INTO businesses (
            TenantId, Type, Name, Description, Status, CreatedBy, ModifiedBy, isDeleted, CreatedAt, ModifiedAt
        ) VALUES 
        (1, 'DEALER', 'Metro Electronics', 'Premium electronics dealer in downtown area', 'Active', 1, 1, 0, NOW(), NOW()),
        (1, 'DEALER', 'Tech Solutions Plus', 'Specialized in corporate IT equipment', 'Active', 1, 1, 0, NOW(), NOW())
    """)


def downgrade() -> None:
    # Remove the dealers we added
    op.execute("""
        DELETE FROM businesses 
        WHERE TenantId = 1 
        AND Type = 'DEALER' 
        AND Name IN ('Metro Electronics', 'Tech Solutions Plus')
    """)
