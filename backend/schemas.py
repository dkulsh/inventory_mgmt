from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    Id: int
    UserName: str
    Name: str
    Email: EmailStr
    Role: str
    TenantId: int
    BusinessId: Optional[int]
    UserStatus: str
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    ProductId: str
    Name: str
    Description: Optional[str] = None
    Quantity: int
    MRP: float
    DiscountType: Optional[str] = None
    DiscountAmount: Optional[float] = None
    TaxType: Optional[str] = None
    TaxAmount: Optional[float] = None
    ImageLink: Optional[str] = None
    ImagePath: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    Id: int
    TenantId: int
    CreatedAt: datetime
    ModifiedAt: datetime
    class Config:
        from_attributes = True

class OrderedProductBase(BaseModel):
    ProductId: int
    Quantity: int
    Price: float
    DiscountType: Optional[str]
    DiscountAmount: Optional[float]
    TaxType: Optional[str]
    TaxAmount: Optional[float]
    TotalCost: float

class OrderedProductCreate(OrderedProductBase):
    pass

class OrderedProductResponse(OrderedProductBase):
    Id: int
    OrderId: int
    CreatedAt: datetime
    ModifiedAt: datetime
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    BusinessId: int
    Type: str
    SubType: Optional[str]
    OrderStatus: Optional[str] = "New"
    AdditionalData: Optional[dict]

class OrderCreate(BaseModel):
    BusinessId: int
    Type: str
    OrderStatus: str
    SubType: Optional[str] = None
    AdditionalData: Optional[dict] = None
    ordered_products: List[OrderedProductCreate]

class OrderResponse(OrderBase):
    Id: int
    TenantId: int
    OrderDateTime: datetime
    CreatedAt: datetime
    ModifiedAt: datetime
    ordered_products: List[OrderedProductResponse] = []
    dealerName: Optional[str] = None
    dealerEmail: Optional[str] = None
    dealerPhone: Optional[str] = None
    class Config:
        from_attributes = True

class OrderCreateRequest(BaseModel):
    orders: List[OrderCreate]

class OrderCreateResponse(BaseModel):
    booked_order: Optional[OrderResponse] = None
    requested_order: Optional[OrderResponse] = None

class TenantBase(BaseModel):
    TenantName: str
    TenantDescription: Optional[str] = None
    TenantStatus: str
    TenantStartDateTime: Optional[datetime] = None
    TenantEndDateTime: Optional[datetime] = None
    TenantType: Optional[str] = None
    TenantSubType: Optional[str] = None
    AdditionalData: Optional[dict] = None

class TenantCreate(TenantBase):
    pass

class TenantResponse(TenantBase):
    TenantId: int
    CreatedAt: datetime
    ModifiedAt: datetime

    class Config:
        from_attributes = True

class BusinessBase(BaseModel):
    TenantId: int
    Type: str
    SubType: Optional[str] = None
    Name: str
    Description: Optional[str] = None
    AddressLine1: Optional[str] = None
    AddressLine2: Optional[str] = None
    Email: Optional[EmailStr] = None
    PhoneNumber: Optional[str] = None
    Status: str = "Active"
    StartDateTime: Optional[datetime] = None
    EndDateTime: Optional[datetime] = None

class BusinessCreate(BusinessBase):
    pass

class BusinessResponse(BusinessBase):
    Id: int
    CreatedAt: datetime
    ModifiedAt: datetime
    class Config:
        from_attributes = True

class TenantDetailResponse(TenantResponse):
    wholesaler: Optional[BusinessResponse] = None
    dealers: List[BusinessResponse] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str

    class Config:
        orm_mode = True

# User Management Schemas
class UserCreate(BaseModel):
    TenantId: int
    BusinessId: Optional[int] = None
    Role: str
    UserName: str
    Password: str
    Name: str
    AddressLine1: Optional[str] = None
    AddressLine2: Optional[str] = None
    Email: EmailStr
    PhoneNumber: Optional[str] = None
    Description: Optional[str] = None

class UserUpdate(BaseModel):
    TenantId: Optional[int] = None
    BusinessId: Optional[int] = None
    Role: Optional[str] = None
    UserName: Optional[str] = None
    Password: Optional[str] = None
    Name: Optional[str] = None
    AddressLine1: Optional[str] = None
    AddressLine2: Optional[str] = None
    Email: Optional[EmailStr] = None
    PhoneNumber: Optional[str] = None
    Description: Optional[str] = None

class UserListResponse(BaseModel):
    Id: int
    UserName: str
    Name: str
    Email: EmailStr
    Role: str
    TenantId: int
    BusinessId: Optional[int]
    UserStatus: str
    PhoneNumber: Optional[str] = None
    businessName: Optional[str] = None
    CreatedAt: datetime
    ModifiedAt: datetime
    
    class Config:
        from_attributes = True
