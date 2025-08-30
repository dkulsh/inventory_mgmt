from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from .. import models, schemas

def get_business(db: Session, business_id: int) -> Optional[models.Business]:
    return db.query(models.Business).filter(models.Business.Id == business_id, models.Business.isDeleted == False).first()

def get_businesses(
    db: Session, 
    tenant_id: int, 
    business_type: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[models.Business]:
    query = db.query(models.Business).filter(
        models.Business.TenantId == tenant_id,
        models.Business.isDeleted == False
    )
    
    if business_type:
        query = query.filter(models.Business.Type == business_type)
    
    return query.order_by(desc(models.Business.CreatedAt)).offset(skip).limit(limit).all()

def create_business(db: Session, business: schemas.BusinessCreate, user_id: int) -> models.Business:
    db_business = models.Business(
        **business.model_dump(),
        CreatedBy=user_id,
        ModifiedBy=user_id
    )
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

def update_business(db: Session, business_id: int, business: schemas.BusinessCreate, user_id: int) -> Optional[models.Business]:
    db_business = get_business(db, business_id)
    if db_business:
        for key, value in business.model_dump().items():
            setattr(db_business, key, value)
        db_business.ModifiedBy = user_id
        db.commit()
        db.refresh(db_business)
    return db_business

def delete_business(db: Session, business_id: int, user_id: int) -> Optional[models.Business]:
    db_business = get_business(db, business_id)
    if db_business:
        db_business.isDeleted = True
        db_business.ModifiedBy = user_id
        db.commit()
        db.refresh(db_business)
    return db_business 