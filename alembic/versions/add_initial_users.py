"""add initial users

Revision ID: add_initial_users
Revises: 14b90e356ac6
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision = 'add_initial_users'
down_revision = '14b90e356ac6'
branch_labels = None
depends_on = None

# Create password context with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def upgrade():
    # Create connection
    conn = op.get_bind()
    
    # Create tenant if not exists
    conn.execute(
        sa.text("""
        INSERT INTO tenants (TenantId, TenantName, TenantDescription, TenantStatus, TenantType, isDeleted, CreatedAt, ModifiedAt)
        SELECT 1, 'Demo Tenant', 'Demo tenant for testing', 'Active', 'Standard', false, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE TenantId = 1)
        """)
    )
    
    # Create wholesaler business if not exists
    conn.execute(
        sa.text("""
        INSERT INTO businesses (TenantId, Type, Name, Description, Status, isDeleted, CreatedAt, ModifiedAt)
        SELECT 1, 'WHOLESALER', 'Demo Wholesaler', 'Demo wholesaler business', 'Active', false, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE TenantId = 1 AND Type = 'WHOLESALER')
        """)
    )
    
    # Get wholesaler business ID
    wholesaler_id = conn.execute(
        sa.text("SELECT Id FROM businesses WHERE TenantId = 1 AND Type = 'WHOLESALER'")
    ).scalar()
    
    # Create dealer business if not exists
    conn.execute(
        sa.text("""
        INSERT INTO businesses (TenantId, Type, Name, Description, Status, isDeleted, CreatedAt, ModifiedAt)
        SELECT 1, 'DEALER', 'Demo Dealer', 'Demo dealer business', 'Active', false, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE TenantId = 1 AND Type = 'DEALER')
        """)
    )
    
    # Get dealer business ID
    dealer_id = conn.execute(
        sa.text("SELECT Id FROM businesses WHERE TenantId = 1 AND Type = 'DEALER'")
    ).scalar()
    
    # Create users with different roles
    users = [
        {
            'role': 'SuperAdmin',
            'username': 'superadmin',
            'name': 'Super Admin',
            'email': 'superadmin@demo.com',
            'business_id': None
        },
        {
            'role': 'TechAdmin',
            'username': 'techadmin',
            'name': 'Tech Admin',
            'email': 'techadmin@demo.com',
            'business_id': None
        },
        {
            'role': 'SalesAdmin',
            'username': 'salesadmin',
            'name': 'Sales Admin',
            'email': 'salesadmin@demo.com',
            'business_id': None
        },
        {
            'role': 'WholesalerAdmin',
            'username': 'wholesaleradmin',
            'name': 'Wholesaler Admin',
            'email': 'wholesaleradmin@demo.com',
            'business_id': wholesaler_id
        },
        {
            'role': 'Wholesaler',
            'username': 'wholesaler',
            'name': 'Wholesaler User',
            'email': 'wholesaler@demo.com',
            'business_id': wholesaler_id
        },
        {
            'role': 'DealerAdmin',
            'username': 'dealeradmin',
            'name': 'Dealer Admin',
            'email': 'dealeradmin@demo.com',
            'business_id': dealer_id
        },
        {
            'role': 'Dealer',
            'username': 'dealer',
            'name': 'Dealer User',
            'email': 'dealer@demo.com',
            'business_id': dealer_id
        }
    ]
    
    # Insert users
    for user in users:
        conn.execute(
            sa.text("""
            INSERT INTO users (TenantId, BusinessId, Role, UserName, PasswordHash, Name, Email, UserStatus, isDeleted, CreatedAt, ModifiedAt)
            SELECT 1, :business_id, :role, :username, :password_hash, :name, :email, 'Active', false, NOW(), NOW()
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE UserName = :username)
            """),
            {
                'business_id': user['business_id'],
                'role': user['role'],
                'username': user['username'],
                'password_hash': pwd_context.hash('password123'),  # Using passlib's bcrypt hashing
                'name': user['name'],
                'email': user['email']
            }
        )

def downgrade():
    # Create connection
    conn = op.get_bind()
    
    # Delete users
    conn.execute(
        sa.text("""
        DELETE FROM users 
        WHERE UserName IN ('superadmin', 'techadmin', 'salesadmin', 'wholesaleradmin', 'wholesaler', 'dealeradmin', 'dealer')
        """)
    )
    
    # Note: We don't delete the businesses or tenant as they might be used by other migrations 