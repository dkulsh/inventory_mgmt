from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, and_
from typing import List, Optional
from datetime import datetime, timedelta
from backend.models import Order, OrderedProduct, UserRoleEnum, Product, Business
from backend.auth import get_current_user
from backend.database import get_db
from backend.schemas import OrderCreate, OrderResponse, OrderedProductResponse, OrderCreateRequest, OrderCreateResponse, OrderStatusUpdate

router = APIRouter()

ALL_ROLES = {
    UserRoleEnum.SuperAdmin,
    UserRoleEnum.TechAdmin,
    UserRoleEnum.SalesAdmin,
    UserRoleEnum.WholesalerAdmin,
    UserRoleEnum.Wholesaler,
    UserRoleEnum.DealerAdmin,
    UserRoleEnum.Dealer,
}

ADMIN_ROLES = {
    UserRoleEnum.SuperAdmin,
    UserRoleEnum.TechAdmin,
    UserRoleEnum.SalesAdmin,
    UserRoleEnum.WholesalerAdmin,
    UserRoleEnum.Wholesaler,
}

def check_role(user, allowed_roles=ALL_ROLES):
    if user.Role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")

@router.get("/", response_model=List[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("CreatedAt"),
    order: str = Query("desc"),
    status: Optional[str] = None,
    type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    tenantId: Optional[int] = None
):
    check_role(user)
    
    # Base query
    query = db.query(Order).filter(Order.isDeleted == False)
    
    # Apply tenant filter
    if tenantId:
        if user.Role in {UserRoleEnum.SuperAdmin, UserRoleEnum.TechAdmin, UserRoleEnum.SalesAdmin}:
            query = query.filter(Order.TenantId == tenantId)
        else:
            query = query.filter(Order.TenantId == user.TenantId)
    else:
        query = query.filter(Order.TenantId == user.TenantId)
    
    # Apply business filter for Dealers and DealerAdmins
    if user.Role in {UserRoleEnum.Dealer, UserRoleEnum.DealerAdmin}:
        query = query.filter(Order.BusinessId == user.BusinessId)
    
    # Apply type filter
    if type:
        query = query.filter(Order.Type == type)
    
    # Apply status filter
    if status and status != 'all':
        query = query.filter(Order.OrderStatus == status)
    
    # Apply date range filter
    if start_date:
        start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
        query = query.filter(Order.OrderDateTime >= start_datetime)
    if end_date:
        end_datetime = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
        query = query.filter(Order.OrderDateTime < end_datetime)
    
    # Apply sorting
    sort_column = getattr(Order, sort_by, Order.CreatedAt)
    if order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    orders = query.offset((page - 1) * size).limit(size).all()
    
    # Attach ordered products and dealer information
    result = []
    for o in orders:
        ordered_products = db.query(OrderedProduct).filter(
            OrderedProduct.OrderId == o.Id, 
            OrderedProduct.isDeleted == False
        ).all()
        
        # Get dealer information
        dealer = db.query(Business).filter(
            Business.Id == o.BusinessId,
            Business.isDeleted == False
        ).first()
        
        o_dict = OrderResponse.from_orm(o).dict()
        o_dict["ordered_products"] = [OrderedProductResponse.from_orm(op) for op in ordered_products]
        o_dict["dealerName"] = dealer.Name if dealer else None
        o_dict["dealerEmail"] = dealer.Email if dealer else None
        o_dict["dealerPhone"] = dealer.PhoneNumber if dealer else None
        
        result.append(OrderResponse(**o_dict))
    
    return result

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user)
    
    # Base query with tenant filter
    query = db.query(Order).filter(Order.Id == order_id, Order.isDeleted == False)
    
    # Apply tenant filter
    if user.Role in {UserRoleEnum.SuperAdmin, UserRoleEnum.TechAdmin, UserRoleEnum.SalesAdmin}:
        # SuperAdmins, TechAdmins, and SalesAdmins can access orders from any tenant
        pass
    else:
        # All other roles are restricted to their tenant
        query = query.filter(Order.TenantId == user.TenantId)
    
    # Apply business filter for Dealers and DealerAdmins
    if user.Role in {UserRoleEnum.Dealer, UserRoleEnum.DealerAdmin}:
        query = query.filter(Order.BusinessId == user.BusinessId)
    
    order = query.first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    ordered_products = db.query(OrderedProduct).filter(OrderedProduct.OrderId == order.Id, OrderedProduct.isDeleted == False).all()
    o_dict = OrderResponse.from_orm(order).dict()
    o_dict["ordered_products"] = [OrderedProductResponse.from_orm(op) for op in ordered_products]
    return OrderResponse(**o_dict)

@router.post("/", response_model=OrderCreateResponse, status_code=201)
def create_order(order_request: OrderCreateRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user, allowed_roles=ALL_ROLES)
    
    from sqlalchemy.exc import SQLAlchemyError
    try:
        booked_order = None
        requested_order = None
        
        # Process each order in the request
        for order in order_request.orders:
            if order.Type == "Booked":
                # Create booked order
                new_order = Order(
                    TenantId=user.TenantId,
                    BusinessId=order.BusinessId,
                    Type=order.Type,
                    SubType=order.SubType,
                    OrderStatus=order.OrderStatus or "New",
                    AdditionalData=order.AdditionalData,
                    CreatedBy=user.Id,
                    ModifiedBy=user.Id
                )
                db.add(new_order)
                db.flush()  # Get new_order.Id
                
                # Process ordered products
                ordered_products = []
                for op in order.ordered_products:
                    product = db.query(Product).filter(Product.Id == op.ProductId, Product.isDeleted == False).first()
                    if not product:
                        raise HTTPException(status_code=404, detail=f"Product {op.ProductId} not found")
                    
                    # Check if we have enough quantity
                    if product.Quantity < op.Quantity:
                        raise HTTPException(status_code=400, detail=f"Insufficient quantity for product {op.ProductId}")
                    
                    # Create ordered product
                    ordered_product = OrderedProduct(
                        OrderId=new_order.Id,
                        ProductId=op.ProductId,
                        Quantity=op.Quantity,
                        Price=op.Price,
                        DiscountType=op.DiscountType,
                        DiscountAmount=op.DiscountAmount,
                        TaxType=op.TaxType,
                        TaxAmount=op.TaxAmount,
                        TotalCost=op.TotalCost,
                        CreatedBy=user.Id,
                        ModifiedBy=user.Id
                    )
                    db.add(ordered_product)
                    ordered_products.append(ordered_product)
                    
                    # Update product quantity
                    product.Quantity -= op.Quantity
                
                booked_order = new_order
                
            elif order.Type == "Requested":
                # Create requested order
                new_order = Order(
                    TenantId=user.TenantId,
                    BusinessId=order.BusinessId,
                    Type=order.Type,
                    SubType=order.SubType,
                    OrderStatus=order.OrderStatus or "New",
                    AdditionalData=order.AdditionalData,
                    CreatedBy=user.Id,
                    ModifiedBy=user.Id
                )
                db.add(new_order)
                db.flush()
                
                # Process ordered products
                ordered_products = []
                for op in order.ordered_products:
                    ordered_product = OrderedProduct(
                        OrderId=new_order.Id,
                        ProductId=op.ProductId,
                        Quantity=op.Quantity,
                        Price=op.Price,
                        DiscountType=op.DiscountType,
                        DiscountAmount=op.DiscountAmount,
                        TaxType=op.TaxType,
                        TaxAmount=op.TaxAmount,
                        TotalCost=op.TotalCost,
                        CreatedBy=user.Id,
                        ModifiedBy=user.Id
                    )
                    db.add(ordered_product)
                    ordered_products.append(ordered_product)
                
                requested_order = new_order
        
        # Commit all changes
        db.commit()
        
        # Prepare response
        response = OrderCreateResponse()
        if booked_order:
            db.refresh(booked_order)
            ordered_products = db.query(OrderedProduct).filter(
                OrderedProduct.OrderId == booked_order.Id, 
                OrderedProduct.isDeleted == False
            ).all()
            o_dict = OrderResponse.from_orm(booked_order).dict()
            o_dict["ordered_products"] = [OrderedProductResponse.from_orm(op) for op in ordered_products]
            response.booked_order = OrderResponse(**o_dict)
            
        if requested_order:
            db.refresh(requested_order)
            ordered_products = db.query(OrderedProduct).filter(
                OrderedProduct.OrderId == requested_order.Id, 
                OrderedProduct.isDeleted == False
            ).all()
            o_dict = OrderResponse.from_orm(requested_order).dict()
            o_dict["ordered_products"] = [OrderedProductResponse.from_orm(op) for op in ordered_products]
            response.requested_order = OrderResponse(**o_dict)
            
        return response
        
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Order creation failed")

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order: OrderCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user, allowed_roles=ADMIN_ROLES)
    db_order = db.query(Order).filter(Order.Id == order_id, Order.isDeleted == False).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    for key, value in order.dict(exclude={"ordered_products"}).items():
        setattr(db_order, key, value)
    db_order.ModifiedBy = user.Id
    db.commit()
    db.refresh(db_order)
    # Update ordered products if needed (not implemented here)
    ordered_products = db.query(OrderedProduct).filter(OrderedProduct.OrderId == db_order.Id, OrderedProduct.isDeleted == False).all()
    o_dict = OrderResponse.from_orm(db_order).dict()
    o_dict["ordered_products"] = [OrderedProductResponse.from_orm(op) for op in ordered_products]
    return OrderResponse(**o_dict)

@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user, allowed_roles=ADMIN_ROLES)
    db_order = db.query(Order).filter(Order.Id == order_id, Order.isDeleted == False).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_order.isDeleted = True
    db_order.ModifiedBy = user.Id
    db.commit()
    return

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    check_role(user, allowed_roles=ADMIN_ROLES)
    
    # Get the order with proper filtering
    query = db.query(Order).filter(
        Order.Id == order_id,
        Order.isDeleted == False
    )
    
    # Apply tenant filter
    if user.Role in {UserRoleEnum.SuperAdmin, UserRoleEnum.TechAdmin, UserRoleEnum.SalesAdmin}:
        # SuperAdmins, TechAdmins, and SalesAdmins can access orders from any tenant
        pass
    else:
        # All other roles are restricted to their tenant
        query = query.filter(Order.TenantId == user.TenantId)
    
    # Apply business filter for Dealers and DealerAdmins
    if user.Role in {UserRoleEnum.Dealer, UserRoleEnum.DealerAdmin}:
        query = query.filter(Order.BusinessId == user.BusinessId)
    
    order = query.first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update status
    order.OrderStatus = status_update.status
    order.ModifiedBy = user.Id
    
    try:
        db.commit()
        db.refresh(order)
        
        # Get ordered products
        ordered_products = db.query(OrderedProduct).filter(
            OrderedProduct.OrderId == order.Id,
            OrderedProduct.isDeleted == False
        ).all()
        
        # Get dealer information
        dealer = db.query(Business).filter(
            Business.Id == order.BusinessId,
            Business.isDeleted == False
        ).first()
        
        # Prepare response
        o_dict = OrderResponse.from_orm(order).dict()
        o_dict["ordered_products"] = [OrderedProductResponse.from_orm(op) for op in ordered_products]
        o_dict["dealerName"] = dealer.Name if dealer else None
        o_dict["dealerEmail"] = dealer.Email if dealer else None
        o_dict["dealerPhone"] = dealer.PhoneNumber if dealer else None
        
        return OrderResponse(**o_dict)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update order status")
