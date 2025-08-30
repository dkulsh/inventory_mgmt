from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.BusinessResponse])
def get_businesses(
    tenantId: int = Query(..., description="ID of the tenant"),
    type: Optional[str] = Query(None, description="Type of business (WHOLESALER/DEALER)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Get businesses for a tenant with optional type filter.
    Access control:
    - SuperAdmin, TechAdmin, SalesAdmin: Can view businesses for any tenant
    - WholesalerAdmin, Wholesaler: Can view businesses for their tenant
    - DealerAdmin, Dealer: Can only view their own business
    """
    # Check if user has access to the requested tenant
    if current_user.Role not in ["SuperAdmin", "TechAdmin", "SalesAdmin"]:
        if current_user.TenantId != tenantId:
            raise HTTPException(status_code=403, detail="Not authorized to access businesses for this tenant")
    
    # For dealer roles, they can only see their own business
    if current_user.Role in ["DealerAdmin", "Dealer"]:
        if not current_user.BusinessId:
            raise HTTPException(status_code=403, detail="No business associated with user")
        business = crud.get_business(db, current_user.BusinessId)
        return [business] if business else []
    
    businesses = crud.get_businesses(db, tenant_id=tenantId, business_type=type, skip=skip, limit=limit)
    return businesses

@router.get("/{business_id}", response_model=schemas.BusinessResponse)
def get_business(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Get a specific business by ID.
    Access control:
    - SuperAdmin, TechAdmin, SalesAdmin: Can view any business
    - WholesalerAdmin, Wholesaler: Can view businesses in their tenant
    - DealerAdmin, Dealer: Can only view their own business
    """
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check if user has access to this business
    if current_user.Role not in ["SuperAdmin", "TechAdmin", "SalesAdmin"]:
        if current_user.TenantId != business.TenantId:
            raise HTTPException(status_code=403, detail="Not authorized to access this business")
        if current_user.Role in ["DealerAdmin", "Dealer"] and current_user.BusinessId != business_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this business")
    
    return business

@router.post("/", response_model=schemas.BusinessResponse)
def create_business(
    business: schemas.BusinessCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Create a new business.
    Only accessible by SuperAdmin, TechAdmin, and WholesalerAdmin roles.
    """
    if current_user.Role not in ["SuperAdmin", "TechAdmin", "WholesalerAdmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create businesses")
    
    # WholesalerAdmin can only create businesses in their tenant
    if current_user.Role == "WholesalerAdmin" and current_user.TenantId != business.TenantId:
        raise HTTPException(status_code=403, detail="Not authorized to create businesses for other tenants")
    
    return crud.create_business(db, business, current_user.Id)

@router.put("/{business_id}", response_model=schemas.BusinessResponse)
def update_business(
    business_id: int,
    business: schemas.BusinessCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Update a business.
    Only accessible by SuperAdmin, TechAdmin, and WholesalerAdmin roles.
    """
    if current_user.Role not in ["SuperAdmin", "TechAdmin", "WholesalerAdmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update businesses")
    
    # Check if business exists
    existing_business = crud.get_business(db, business_id)
    if not existing_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # WholesalerAdmin can only update businesses in their tenant
    if current_user.Role == "WholesalerAdmin" and current_user.TenantId != existing_business.TenantId:
        raise HTTPException(status_code=403, detail="Not authorized to update businesses for other tenants")
    
    return crud.update_business(db, business_id, business, current_user.Id)

@router.delete("/{business_id}", response_model=schemas.BusinessResponse)
def delete_business(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Soft delete a business.
    Only accessible by SuperAdmin, TechAdmin, and WholesalerAdmin roles.
    """
    if current_user.Role not in ["SuperAdmin", "TechAdmin", "WholesalerAdmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete businesses")
    
    # Check if business exists
    existing_business = crud.get_business(db, business_id)
    if not existing_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # WholesalerAdmin can only delete businesses in their tenant
    if current_user.Role == "WholesalerAdmin" and current_user.TenantId != existing_business.TenantId:
        raise HTTPException(status_code=403, detail="Not authorized to delete businesses for other tenants")
    
    return crud.delete_business(db, business_id, current_user.Id) 