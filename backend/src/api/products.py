"""Product catalog API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.core.database import get_db
from src.models import Product, ProductVariant
from src.schemas.schemas import ProductResponse, ProductWithInventory, VariantResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
async def get_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get list of active products"""
    products = db.query(Product).filter(
        Product.is_active == True
    ).offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductWithInventory)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product details with variants and inventory"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/variants/{variant_id}", response_model=VariantResponse)
async def get_variant(variant_id: int, db: Session = Depends(get_db)):
    """Get variant details with inventory"""
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id
    ).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    return variant

