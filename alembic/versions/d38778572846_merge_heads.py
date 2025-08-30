"""merge heads

Revision ID: d38778572846
Revises: <alembic will generate this>, 84f5aa5705f2
Create Date: 2025-05-28 21:25:27.317788

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd38778572846'
down_revision: Union[str, None] = ('<alembic will generate this>', '84f5aa5705f2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
