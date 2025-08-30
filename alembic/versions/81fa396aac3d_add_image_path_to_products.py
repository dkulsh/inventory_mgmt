"""add_image_path_to_products

Revision ID: <alembic will generate this>
Revises: 46da05aeb666
Create Date: <alembic will generate this>

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '<alembic will generate this>'
down_revision: Union[str, None] = '46da05aeb666'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('products', sa.Column('ImagePath', sa.String(length=1024), nullable=True))

def downgrade() -> None:
    op.drop_column('products', 'ImagePath')