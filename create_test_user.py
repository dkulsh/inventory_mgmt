#!/usr/bin/env python3
"""
Script to create test data for the inventory management system.
Run this after database migration to create a test user for login.
"""

from backend.database import SessionLocal
from backend.models import Tenant, Business, User, BusinessTypeEnum, UserRoleEnum
from backend.auth import get_password_hash
from datetime import datetime

def create_test_data():
    db = SessionLocal()
    try:
        # Create a test tenant
        tenant = Tenant(
            TenantName="Test Company",
            TenantDescription="A test company for development",
            TenantStatus="Active",
            TenantType="Standard"
        )
        db.add(tenant)
        db.flush()  # Get tenant ID
        
        # Create a wholesaler business
        business = Business(
            TenantId=tenant.TenantId,
            Type=BusinessTypeEnum.WHOLESALER,
            Name="Test Wholesaler",
            Description="Test wholesaler business",
            Email="wholesaler@test.com",
            Status="Active"
        )
        db.add(business)
        db.flush()  # Get business ID
        
        # Create a test user (WholesalerAdmin)
        user = User(
            TenantId=tenant.TenantId,
            BusinessId=business.Id,
            Role=UserRoleEnum.WholesalerAdmin,
            UserName="admin",
            PasswordHash=get_password_hash("password123"),
            Name="Test Admin",
            Email="admin@test.com",
            UserStatus="Active"
        )
        db.add(user)
        
        db.commit()
        print("✅ Test data created successfully!")
        print("Login credentials:")
        print("  Username: admin")
        print("  Password: password123")
        print(f"  Tenant ID: {tenant.TenantId}")
        print(f"  Business ID: {business.Id}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data() 