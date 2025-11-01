from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, CreditType, OrderStatus


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


class ProductCreate(ProductBase):
    pass


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


class VariantCreate(VariantBase):
    product_id: int


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


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Admin schemas
class CreditGrant(BaseModel):
    user_id: int
    amount: float
    description: str


class UserImport(BaseModel):
    email: EmailStr
    name: str
    start_date: datetime
    role: UserRole

