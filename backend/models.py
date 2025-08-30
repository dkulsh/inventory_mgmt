from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, DECIMAL, JSON
from sqlalchemy.orm import relationship
from backend.database import Base
import enum
from datetime import datetime

class BusinessTypeEnum(str, enum.Enum):
    WHOLESALER = "WHOLESALER"
    DEALER = "DEALER"

class UserRoleEnum(str, enum.Enum):
    SuperAdmin = "SuperAdmin"
    TechAdmin = "TechAdmin"
    SalesAdmin = "SalesAdmin"
    WholesalerAdmin = "WholesalerAdmin"
    Wholesaler = "Wholesaler"
    DealerAdmin = "DealerAdmin"
    Dealer = "Dealer"

class UserStatusEnum(str, enum.Enum):
    Active = "Active"
    Inactive = "Inactive"

class OrderTypeEnum(str, enum.Enum):
    Booked = "Booked"
    Requested = "Requested"

class OrderStatusEnum(str, enum.Enum):
    New = "New"
    InProgress = "InProgress"
    Done = "Done"
    Cancelled = "Cancelled"

class DiscountTypeEnum(str, enum.Enum):
    Fixed = "Fixed"
    Percentage = "Percentage"

class Tenant(Base):
    __tablename__ = "tenants"
    TenantId = Column(Integer, primary_key=True, autoincrement=True)
    TenantName = Column(String(255), nullable=False)
    TenantDescription = Column(Text)
    TenantStatus = Column(String(50), nullable=False)
    TenantStartDateTime = Column(DateTime)
    TenantEndDateTime = Column(DateTime)
    TenantType = Column(String(100))
    TenantSubType = Column(String(100))
    AdditionalData = Column(JSON)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    businesses = relationship("Business", back_populates="tenant")
    users = relationship("User", back_populates="tenant")

class Business(Base):
    __tablename__ = "businesses"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    TenantId = Column(Integer, ForeignKey("tenants.TenantId"), nullable=False)
    Type = Column(Enum(BusinessTypeEnum), nullable=False)
    SubType = Column(String(100))
    Name = Column(String(255), nullable=False)
    Description = Column(Text)
    AddressLine1 = Column(String(255))
    AddressLine2 = Column(String(255))
    Email = Column(String(255), unique=False)  # Unique per tenant logic in app
    PhoneNumber = Column(String(20))
    Status = Column(String(20), default="Active", nullable=False)
    StartDateTime = Column(DateTime)
    EndDateTime = Column(DateTime)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    tenant = relationship("Tenant", back_populates="businesses")
    users = relationship("User", back_populates="business")

class User(Base):
    __tablename__ = "users"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    TenantId = Column(Integer, ForeignKey("tenants.TenantId"), nullable=False)
    BusinessId = Column(Integer, ForeignKey("businesses.Id"))
    Role = Column(Enum(UserRoleEnum), nullable=False)
    UserName = Column(String(100), unique=True, nullable=False)
    PasswordHash = Column(String(255), nullable=False)
    Name = Column(String(255), nullable=False)
    AddressLine1 = Column(String(255))
    AddressLine2 = Column(String(255))
    Email = Column(String(255), unique=True, nullable=False)
    PhoneNumber = Column(String(20))
    Description = Column(Text)
    UserStatus = Column(Enum(UserStatusEnum), default=UserStatusEnum.Active, nullable=False)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    tenant = relationship("Tenant", back_populates="users")
    business = relationship("Business", back_populates="users")

class Product(Base):
    __tablename__ = "products"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    ProductId = Column(String(100), nullable=False)
    TenantId = Column(Integer, ForeignKey("tenants.TenantId"), nullable=False)
    Name = Column(String(255), nullable=False)
    Description = Column(Text)
    Quantity = Column(Integer, default=0, nullable=False)
    MRP = Column(DECIMAL(10, 2), nullable=False)
    DiscountType = Column(Enum(DiscountTypeEnum))
    DiscountAmount = Column(DECIMAL(10, 2))
    TaxType = Column(String(50))
    TaxAmount = Column(DECIMAL(10, 2))
    ImageLink = Column(String(1024))  # This will store the signed URL
    ImagePath = Column(String(1024))  # This will store the GCS path
    AdditionalData = Column(JSON)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Order(Base):
    __tablename__ = "orders"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    TenantId = Column(Integer, ForeignKey("tenants.TenantId"), nullable=False)
    BusinessId = Column(Integer, ForeignKey("businesses.Id"), nullable=False)
    Type = Column(Enum(OrderTypeEnum), nullable=False)
    SubType = Column(String(100))
    OrderStatus = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.New, nullable=False)
    OrderDateTime = Column(DateTime, default=datetime.utcnow, nullable=False)
    AdditionalData = Column(JSON)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class OrderedProduct(Base):
    __tablename__ = "ordered_products"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    OrderId = Column(Integer, ForeignKey("orders.Id"), nullable=False)
    ProductId = Column(Integer, ForeignKey("products.Id"), nullable=False)
    Quantity = Column(Integer, nullable=False)
    Price = Column(DECIMAL(10, 2), nullable=False)
    DiscountType = Column(Enum(DiscountTypeEnum))
    DiscountAmount = Column(DECIMAL(10, 2))
    TaxType = Column(String(50))
    TaxAmount = Column(DECIMAL(10, 2))
    TotalCost = Column(DECIMAL(10, 2), nullable=False)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Configuration(Base):
    __tablename__ = "configurations"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    Type = Column(String(50), nullable=False)
    SubType = Column(String(100))
    RefId = Column(String(255), nullable=False)
    Key = Column(String(255), nullable=False)
    Value = Column(Text, nullable=False)
    ValueType = Column(String(20), nullable=False)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Feature(Base):
    __tablename__ = "features"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    Type = Column(String(50), nullable=False)
    SubType = Column(String(100))
    FeatureName = Column(String(255), nullable=False)
    FeatureDescription = Column(Text)
    FeatureKey = Column(String(100), nullable=False, unique=True)
    FeatureValue = Column(String(255), nullable=False)
    ValueType = Column(String(20), nullable=False)
    StartDateTime = Column(DateTime)
    EndDateTime = Column(DateTime)
    Status = Column(String(20), default="Active", nullable=False)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Subscription(Base):
    __tablename__ = "subscriptions"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    Type = Column(String(50), nullable=False)
    RefId = Column(String(255), nullable=False)
    SubType = Column(String(100))
    StartDateTime = Column(DateTime, nullable=False)
    EndDateTime = Column(DateTime, nullable=False)
    Status = Column(String(20), default="Active", nullable=False)
    isDeleted = Column(Boolean, default=False, nullable=False)
    ModifiedBy = Column(Integer)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    ModifiedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
