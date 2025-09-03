from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from backend import models, schemas
from backend.auth import get_password_hash


def get_users(
    db: Session, 
    tenant_id: int, 
    current_user_role: str,
    current_user_business_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100,
    search: str = None
) -> List[models.User]:
    """
    Get users based on role-based access control:
    - SuperAdmin, TechAdmin, SalesAdmin: see all users
    - WholesalerAdmin, Wholesaler: see all Wholesaler and Dealer users for the tenant
    - DealerAdmin, Dealer: see only Dealer users
    """
    query = db.query(models.User).filter(
        models.User.TenantId == tenant_id,
        models.User.isDeleted == False
    )
    
    # Apply role-based filtering
    if current_user_role in ["DealerAdmin", "Dealer"]:
        # Only see Dealer users
        query = query.join(models.Business).filter(models.Business.Type == "DEALER")
    elif current_user_role in ["WholesalerAdmin", "Wholesaler"]:
        # See Wholesaler and Dealer users
        query = query.join(models.Business).filter(
            or_(
                models.Business.Type == "WHOLESALER",
                models.Business.Type == "DEALER"
            )
        )
    # SuperAdmin, TechAdmin, SalesAdmin see all users (no additional filtering)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.User.Name.ilike(search_term),
                models.User.UserName.ilike(search_term),
                models.User.Email.ilike(search_term)
            )
        )
    
    return query.order_by(desc(models.User.CreatedAt)).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: int, tenant_id: int) -> Optional[models.User]:
    """Get a specific user by ID within a tenant"""
    return db.query(models.User).filter(
        models.User.Id == user_id,
        models.User.TenantId == tenant_id,
        models.User.isDeleted == False
    ).first()


def create_user(db: Session, user: schemas.UserCreate, created_by: int) -> models.User:
    """Create a new user"""
    # Hash the password
    hashed_password = get_password_hash(user.Password)
    
    db_user = models.User(
        TenantId=user.TenantId,
        BusinessId=user.BusinessId,
        Role=user.Role,
        UserName=user.UserName,
        PasswordHash=hashed_password,
        Name=user.Name,
        AddressLine1=user.AddressLine1,
        AddressLine2=user.AddressLine2,
        Email=user.Email,
        PhoneNumber=user.PhoneNumber,
        Description=user.Description,
        UserStatus=models.UserStatusEnum.Active,
        CreatedBy=created_by,
        ModifiedBy=created_by
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: schemas.UserUpdate, modified_by: int) -> Optional[models.User]:
    """Update an existing user"""
    db_user = db.query(models.User).filter(
        models.User.Id == user_id,
        models.User.isDeleted == False
    ).first()
    
    if not db_user:
        return None
    
    # Update fields
    update_data = user.model_dump(exclude_unset=True)
    
    # Hash password if it's being updated
    if "Password" in update_data and update_data["Password"]:
        update_data["PasswordHash"] = get_password_hash(update_data["Password"])
        del update_data["Password"]
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db_user.ModifiedBy = modified_by
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int, modified_by: int) -> Optional[models.User]:
    """Soft delete a user"""
    db_user = db.query(models.User).filter(
        models.User.Id == user_id,
        models.User.isDeleted == False
    ).first()
    
    if not db_user:
        return None
    
    db_user.isDeleted = True
    db_user.ModifiedBy = modified_by
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Get user by username (for authentication)"""
    return db.query(models.User).filter(
        models.User.UserName == username,
        models.User.isDeleted == False
    ).first()


def get_available_businesses_for_user_creation(
    db: Session, 
    tenant_id: int, 
    current_user_role: str,
    current_user_business_id: Optional[int] = None
) -> List[models.Business]:
    """
    Get businesses that can be selected when creating users based on current user's role
    """
    query = db.query(models.Business).filter(
        models.Business.TenantId == tenant_id,
        models.Business.isDeleted == False
    )
    
    if current_user_role in ["DealerAdmin", "Dealer"]:
        # Can only create users for their own business
        query = query.filter(models.Business.Id == current_user_business_id)
    elif current_user_role in ["WholesalerAdmin", "Wholesaler"]:
        # Can create users for Wholesaler and Dealer businesses
        query = query.filter(
            or_(
                models.Business.Type == "WHOLESALER",
                models.Business.Type == "DEALER"
            )
        )
    # SuperAdmin, TechAdmin, SalesAdmin can select any business (no filtering)
    
    return query.order_by(models.Business.Name).all()
