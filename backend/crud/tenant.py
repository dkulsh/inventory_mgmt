from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from .. import models, schemas

# Tenant CRUD operations
def get_tenant(db: Session, tenant_id: int) -> Optional[models.Tenant]:
    return db.query(models.Tenant).filter(models.Tenant.TenantId == tenant_id, models.Tenant.isDeleted == False).first()

def get_tenants(db: Session, skip: int = 0, limit: int = 100, search: str = None, status: str = None) -> List[models.Tenant]:
    query = db.query(models.Tenant).filter(models.Tenant.isDeleted == False)
    
    # Apply search filter if provided
    if search:
        query = query.filter(models.Tenant.TenantName.ilike(f"%{search}%"))
    
    # Apply status filter if provided
    if status:
        query = query.filter(models.Tenant.TenantStatus == status)
    
    return query.order_by(desc(models.Tenant.CreatedAt)).offset(skip).limit(limit).all()

def create_tenant(db: Session, tenant: schemas.TenantCreate, user_id: int) -> models.Tenant:
    db_tenant = models.Tenant(
        **tenant.model_dump(),
        CreatedBy=user_id,
        ModifiedBy=user_id
    )
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_tenant(db: Session, tenant_id: int, tenant: schemas.TenantCreate, user_id: int) -> Optional[models.Tenant]:
    db_tenant = get_tenant(db, tenant_id)
    if db_tenant:
        for key, value in tenant.model_dump().items():
            setattr(db_tenant, key, value)
        db_tenant.ModifiedBy = user_id
        db.commit()
        db.refresh(db_tenant)
    return db_tenant

def delete_tenant(db: Session, tenant_id: int, user_id: int) -> Optional[models.Tenant]:
    db_tenant = get_tenant(db, tenant_id)
    if db_tenant:
        db_tenant.isDeleted = True
        db_tenant.ModifiedBy = user_id
        db.commit()
        db.refresh(db_tenant)
    return db_tenant
