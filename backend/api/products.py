from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import List, Optional
from backend.schemas import ProductCreate, ProductResponse
from backend.models import Product, UserRoleEnum
from backend.auth import get_current_user
from backend.database import get_db
from backend.gcs_utils import upload_product_image, generate_signed_url
import os

router = APIRouter()

ALLOWED_ROLES = {
    UserRoleEnum.SuperAdmin,
    UserRoleEnum.TechAdmin,
    UserRoleEnum.SalesAdmin,
    UserRoleEnum.WholesalerAdmin,
    UserRoleEnum.Wholesaler,
}

def check_role(user, allowed_roles=ALLOWED_ROLES):
    if user.Role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")

@router.get("/", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("CreatedAt"),
    order: str = Query("desc"),
    search: Optional[str] = None
):
    check_role(user)
    query = db.query(Product).filter(Product.TenantId == user.TenantId, Product.isDeleted == False)
    if search:
        query = query.filter(or_(Product.ProductId.ilike(f"%{search}%"), Product.Name.ilike(f"%{search}%")))
    sort_column = getattr(Product, sort_by, Product.CreatedAt)
    if order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    total = query.count()
    products = query.offset((page - 1) * size).limit(size).all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user)
    product = db.query(Product).filter(Product.Id == product_id, Product.isDeleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user)
    db_product = Product(**product.dict(), TenantId=user.TenantId, CreatedBy=user.Id, ModifiedBy=user.Id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user)
    db_product = db.query(Product).filter(Product.Id == product_id, Product.isDeleted == False).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    db_product.ModifiedBy = user.Id
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user)
    db_product = db.query(Product).filter(Product.Id == product_id, Product.isDeleted == False).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.isDeleted = True
    db_product.ModifiedBy = user.Id
    db.commit()
    return

@router.post("/upload-image")
def upload_image(
    tenantId: int = Form(...),
    file: UploadFile = File(...)
):
    try:
        result = upload_product_image(file, tenantId, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-image-url/{product_id}")
def refresh_image_url(
    product_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    check_role(user)
    product = db.query(Product).filter(Product.Id == product_id, Product.isDeleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.ImagePath:
        raise HTTPException(status_code=400, detail="Product has no image")
    
    try:
        # Extract bucket name and blob path from GCS path
        # Format: gs://bucket-name/path/to/blob
        path_parts = product.ImagePath.replace("gs://", "").split("/", 1)
        if len(path_parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid GCS path format")
        
        bucket_name = path_parts[0]
        blob_path = path_parts[1]
        
        # Generate new signed URL
        new_url = generate_signed_url(bucket_name, blob_path)
        
        # Update product with new URL
        product.ImageLink = new_url
        db.commit()
        
        return {"url": new_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
