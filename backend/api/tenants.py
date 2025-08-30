from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.TenantResponse])
def get_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: str = Query(None, description="Search term for tenant name"),
    status: str = Query(None, description="Filter by tenant status"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Get tenants based on user role:
    - SuperAdmin, TechAdmin, SalesAdmin: Can view all tenants
    - WholesalerAdmin, Wholesaler, DealerAdmin, Dealer: Can only view their own tenant
    """
    if current_user.Role in ["SuperAdmin", "TechAdmin", "SalesAdmin"]:
        # Admin roles can see all tenants
        tenants = crud.get_tenants(db, skip=skip, limit=limit, search=search, status=status)
    else:
        # Other roles can only see their own tenant
        tenant = crud.get_tenant(db, current_user.TenantId)
        tenants = [tenant] if tenant else []
    return tenants

@router.get("/{tenant_id}", response_model=schemas.TenantDetailResponse)
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Get a specific tenant by ID with its associated businesses.
    Only accessible by SuperAdmin, TechAdmin, and SalesAdmin roles.
    """
    if current_user.Role not in ["SuperAdmin", "TechAdmin", "SalesAdmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to access tenants")
    
    tenant = crud.get_tenant(db, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get associated businesses
    wholesaler = crud.get_businesses(db, tenant_id=tenant_id, business_type="WHOLESALER", limit=1)
    dealers = crud.get_businesses(db, tenant_id=tenant_id, business_type="DEALER")
    
    return {
        **tenant.__dict__,
        "wholesaler": wholesaler[0] if wholesaler else None,
        "dealers": dealers
    }

@router.post("/", response_model=schemas.TenantResponse)
def create_tenant(
    tenant: schemas.TenantCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Create a new tenant.
    Only accessible by SuperAdmin and TechAdmin roles.
    """
    if current_user.Role not in ["SuperAdmin", "TechAdmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create tenants")
    return crud.create_tenant(db, tenant, current_user.Id)

@router.put("/{tenant_id}", response_model=schemas.TenantResponse)
def update_tenant(
    tenant_id: int,
    tenant: schemas.TenantCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Update a tenant.
    Only accessible by SuperAdmin and TechAdmin roles.
    """
    if current_user.Role not in ["SuperAdmin", "TechAdmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update tenants")
    db_tenant = crud.update_tenant(db, tenant_id, tenant, current_user.Id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db_tenant

@router.delete("/{tenant_id}", response_model=schemas.TenantResponse)
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """
    Soft delete a tenant.
    Only accessible by SuperAdmin and TechAdmin roles.
    """
    if current_user.Role not in ["SuperAdmin", "TechAdmin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete tenants")
    db_tenant = crud.delete_tenant(db, tenant_id, current_user.Id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db_tenant





