from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.schemas import (
    UserLogin, Token, UserResponse, UserCreate, UserUpdate, UserListResponse,
    BusinessResponse
)
from backend.auth import authenticate_user, create_access_token, get_current_user
from backend.database import get_db
from backend import crud, models
from backend.crud.user import get_available_businesses_for_user_creation

router = APIRouter()

@router.post("/login", response_model=Token)
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.UserName})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user = Depends(get_current_user)):
    """
    Get the current user's information based on their JWT token.
    """
    return current_user

@router.get("/", response_model=List[UserListResponse])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get users based on role-based access control.
    """
    users = crud.get_users(
        db=db,
        tenant_id=current_user.TenantId,
        current_user_role=current_user.Role,
        current_user_business_id=current_user.BusinessId,
        skip=skip,
        limit=limit,
        search=search
    )
    
    # Convert to response format with business name
    result = []
    for user in users:
        business_name = None
        if user.business:
            business_name = user.business.Name
        
        result.append(UserListResponse(
            Id=user.Id,
            UserName=user.UserName,
            Name=user.Name,
            Email=user.Email,
            Role=user.Role,
            TenantId=user.TenantId,
            BusinessId=user.BusinessId,
            UserStatus=user.UserStatus,
            PhoneNumber=user.PhoneNumber,
            businessName=business_name,
            CreatedAt=user.CreatedAt,
            ModifiedAt=user.ModifiedAt
        ))
    
    return result

@router.get("/businesses", response_model=List[BusinessResponse])
def get_businesses_for_user_creation_endpoint(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get businesses that can be selected when creating users based on current user's role.
    """
    businesses = get_available_businesses_for_user_creation(
        db,
        current_user.TenantId,
        current_user.Role,
        current_user.BusinessId
    )
    return businesses

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get a specific user by ID.
    """
    user = crud.get_user(db, user_id, current_user.TenantId)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create a new user.
    """
    # Role-based validation
    if current_user.Role in ["WholesalerAdmin"]:
        # WholesalerAdmin can only create Wholesaler users
        if user.Role != "Wholesaler":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="WholesalerAdmin can only create Wholesaler users"
            )
        # Set BusinessId to their own business if not provided
        if not user.BusinessId:
            user.BusinessId = current_user.BusinessId
    elif current_user.Role in ["DealerAdmin"]:
        # DealerAdmin can only create Dealer users
        if user.Role != "Dealer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="DealerAdmin can only create Dealer users"
            )
        # Set BusinessId to their own business
        user.BusinessId = current_user.BusinessId
    
    # Validate tenant access based on user role
    if current_user.Role not in ["SuperAdmin", "TechAdmin", "SalesAdmin"]:
        # Non-admin roles can only create users in their own tenant
        if user.TenantId != current_user.TenantId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create users in other tenants"
            )
    # Admin roles (SuperAdmin, TechAdmin, SalesAdmin) can create users in any tenant
    
    # Set TenantId to current user's tenant (commented out since frontend now sends it)
    # user.TenantId = current_user.TenantId
    
    # Check if username already exists
    existing_user = crud.get_user_by_username(db, user.UserName)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = db.query(models.User).filter(
        models.User.Email == user.Email,
        models.User.isDeleted == False
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    created_user = crud.create_user(db, user, current_user.Id)
    return created_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update an existing user.
    """
    # Get the user to update
    db_user = crud.get_user(db, user_id, current_user.TenantId)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Role-based validation
    if current_user.Role in ["WholesalerAdmin"]:
        # WholesalerAdmin can only update Wholesaler users
        if user.Role and user.Role != "Wholesaler":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="WholesalerAdmin can only update Wholesaler users"
            )
        # Cannot change BusinessId
        if user.BusinessId and user.BusinessId != current_user.BusinessId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot change business assignment"
            )
    elif current_user.Role in ["DealerAdmin"]:
        # DealerAdmin can only update Dealer users
        if user.Role and user.Role != "Dealer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="DealerAdmin can only update Dealer users"
            )
        # Cannot change BusinessId
        if user.BusinessId and user.BusinessId != current_user.BusinessId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot change business assignment"
            )
    
    # Check username uniqueness if being updated
    if user.UserName and user.UserName != db_user.UserName:
        existing_user = crud.get_user_by_username(db, user.UserName)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
    
    # Check email uniqueness if being updated
    if user.Email and user.Email != db_user.Email:
        existing_email = db.query(models.User).filter(
            models.User.Email == user.Email,
            models.User.isDeleted == False,
            models.User.Id != user_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
    
    updated_user = crud.update_user(db, user_id, user, current_user.Id)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Soft delete a user.
    """
    # Get the user to delete
    db_user = crud.get_user(db, user_id, current_user.TenantId)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Role-based validation
    if current_user.Role in ["WholesalerAdmin"]:
        # WholesalerAdmin can only delete Wholesaler users
        if db_user.Role != "Wholesaler":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="WholesalerAdmin can only delete Wholesaler users"
            )
    elif current_user.Role in ["DealerAdmin"]:
        # DealerAdmin can only delete Dealer users
        if db_user.Role != "Dealer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="DealerAdmin can only delete Dealer users"
            )
    
    # Prevent self-deletion
    if user_id == current_user.Id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    crud.delete_user(db, user_id, current_user.Id)
    return None





