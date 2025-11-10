from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from src.models import UserRole, CreditType, OrderStatus


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    start_date: datetime
    role: UserRole


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Credit schemas
class CreditLedgerBase(BaseModel):
    amount: float
    credit_type: CreditType
    description: Optional[str] = None


class CreditLedgerCreate(CreditLedgerBase):
    user_id: int
    reference_order_id: Optional[int] = None


class CreditLedgerResponse(CreditLedgerBase):
    id: int
    user_id: int
    reference_order_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class CreditBalance(BaseModel):
    balance: float
    user_id: int


# Product schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_credits: float
    image_url: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_credits: float


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_credits: Optional[float] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Product Variant schemas
class VariantBase(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    credits_modifier: float = 0.0


class VariantCreate(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    credits_modifier: float = 0.0
    quantity: int = 0


class VariantUpdate(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    credits_modifier: Optional[float] = None
    quantity: Optional[int] = None


class VariantWithInventory(VariantBase):
    id: int
    product_id: int
    created_at: datetime
    available_quantity: int = 0
    
    class Config:
        from_attributes = True


class VariantResponse(VariantBase):
    id: int
    product_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Inventory schemas
class InventoryLotBase(BaseModel):
    quantity: int
    reserved_quantity: int = 0


class InventoryLotCreate(InventoryLotBase):
    variant_id: int


class InventoryLotResponse(InventoryLotBase):
    id: int
    variant_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Product with variants and inventory
class ProductWithInventory(ProductResponse):
    variants: List[VariantResponse]
    
    class Config:
        from_attributes = True


class ProductWithVariantsAndInventory(ProductResponse):
    variants: List[VariantWithInventory]
    
    class Config:
        from_attributes = True


# Order schemas
class OrderItemBase(BaseModel):
    variant_id: int
    quantity: int


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    unit_credits: float
    total_credits: float
    created_at: datetime
    
    class Config:
        from_attributes = True


# Enhanced order item with product/variant details
class OrderItemWithDetails(OrderItemResponse):
    product_name: Optional[str] = None
    variant_size: Optional[str] = None
    variant_color: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    status: OrderStatus = OrderStatus.PENDING


class OrderCreate(OrderBase):
    items: List[OrderItemCreate]


class OrderResponse(OrderBase):
    id: int
    user_id: int
    total_credits: float
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    items: List[OrderItemResponse]
    
    class Config:
        from_attributes = True


# Enhanced order response with user details
class OrderWithUserResponse(OrderBase):
    id: int
    user_id: int
    user: Optional[UserResponse] = None
    total_credits: float
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    items: List[OrderItemWithDetails]
    
    class Config:
        from_attributes = True


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class DevLoginRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Admin schemas
class CreditGrant(BaseModel):
    user_id: int
    amount: float
    description: str


class BulkCreditGrant(BaseModel):
    user_ids: List[int]
    amount: float
    description: str


class UserImport(BaseModel):
    email: EmailStr
    name: str
    start_date: datetime
    role: UserRole

