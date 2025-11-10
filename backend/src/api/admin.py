"""Admin API routes"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from src.core.database import get_db
from src.core.security import get_admin_user
from src.models import User, Product, ProductVariant, InventoryLot, Order, CreditLedger
from src.schemas.schemas import (
    UserResponse, ProductResponse, VariantResponse, OrderResponse,
    CreditGrant, BulkCreditGrant, UserImport, ProductCreate, ProductUpdate, CreditLedgerResponse,
    VariantCreate, VariantUpdate, VariantWithInventory, OrderWithUserResponse,
    OrderItemWithDetails
)
from src.services.credit_service import grant_credits, get_user_balance
from src.utils.file_storage import save_upload_file, delete_file

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    base_credits: float = Form(...),
    image: Optional[UploadFile] = File(None),
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new product with optional image upload (admin only)"""
    # Handle image upload
    image_url = None
    if image:
        try:
            image_url = await save_upload_file(image)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Create product
    db_product = Product(
        name=name,
        description=description,
        base_credits=base_credits,
        image_url=image_url
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    base_credits: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    is_active: Optional[bool] = Form(None),
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update a product with optional new image upload (admin only)"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    if name is not None:
        db_product.name = name
    if description is not None:
        db_product.description = description
    if base_credits is not None:
        db_product.base_credits = base_credits
    if is_active is not None:
        db_product.is_active = is_active
    
    # Handle image upload
    if image:
        # Delete old image if exists
        if db_product.image_url:
            delete_file(db_product.image_url)
        
        try:
            db_product.image_url = await save_upload_file(image)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a product and all related data including order history (admin only)"""
    from src.models import OrderItem
    
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get all variant IDs for this product
    variant_ids = [variant.id for variant in db_product.variants]
    
    if variant_ids:
        # Find all orders that contain these variants
        affected_order_ids = db.query(OrderItem.order_id).filter(
            OrderItem.variant_id.in_(variant_ids)
        ).distinct().all()
        affected_order_ids = [order_id[0] for order_id in affected_order_ids]
        
        # Delete all order items that reference these variants
        db.query(OrderItem).filter(OrderItem.variant_id.in_(variant_ids)).delete(synchronize_session=False)
        
        # Delete orders that now have no items left
        if affected_order_ids:
            for order_id in affected_order_ids:
                remaining_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).count()
                if remaining_items == 0:
                    # Order has no items left, delete it
                    order = db.query(Order).filter(Order.id == order_id).first()
                    if order:
                        # Also delete any credit ledger entries associated with this order
                        db.query(CreditLedger).filter(CreditLedger.reference_order_id == order_id).delete(synchronize_session=False)
                        db.delete(order)
    
    # Delete associated image if exists
    if db_product.image_url:
        delete_file(db_product.image_url)
    
    # Delete the product (will cascade delete variants and inventory lots)
    db.delete(db_product)
    db.commit()
    return {"message": "Product and all related data deleted successfully"}


@router.post("/orders/cleanup-empty")
async def cleanup_empty_orders(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Clean up orders that have no items (admin only) - one-time cleanup utility"""
    from src.models import OrderItem
    
    # Find all orders
    all_orders = db.query(Order).all()
    deleted_count = 0
    
    for order in all_orders:
        # Check if order has any items
        item_count = db.query(OrderItem).filter(OrderItem.order_id == order.id).count()
        if item_count == 0:
            # Delete credit ledger entries associated with this order
            db.query(CreditLedger).filter(CreditLedger.reference_order_id == order.id).delete(synchronize_session=False)
            # Delete the empty order
            db.delete(order)
            deleted_count += 1
    
    db.commit()
    return {"message": f"Cleaned up {deleted_count} empty order(s)", "deleted_count": deleted_count}


@router.post("/products/{product_id}/variants", response_model=VariantResponse)
async def create_variant(
    product_id: int,
    variant_data: VariantCreate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Add variant to product (admin only)"""
    # Check product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create variant
    variant = ProductVariant(
        product_id=product_id,
        size=variant_data.size,
        color=variant_data.color,
        credits_modifier=variant_data.credits_modifier
    )
    db.add(variant)
    db.flush()  # Get variant ID
    
    # Create inventory lot if quantity specified
    if variant_data.quantity > 0:
        inventory = InventoryLot(
            variant_id=variant.id,
            quantity=variant_data.quantity
        )
        db.add(inventory)
    
    db.commit()
    db.refresh(variant)
    return variant


@router.get("/products/{product_id}/variants", response_model=List[VariantWithInventory])
async def get_product_variants(
    product_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all variants for a product with inventory info (admin only)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variants = []
    for variant in product.variants:
        # Calculate available quantity
        total_quantity = sum(lot.quantity for lot in variant.inventory_lots)
        reserved_quantity = sum(lot.reserved_quantity for lot in variant.inventory_lots)
        available_quantity = total_quantity - reserved_quantity
        
        variant_dict = {
            "id": variant.id,
            "product_id": variant.product_id,
            "size": variant.size,
            "color": variant.color,
            "credits_modifier": variant.credits_modifier,
            "created_at": variant.created_at,
            "available_quantity": available_quantity
        }
        variants.append(variant_dict)
    
    return variants


@router.put("/products/{product_id}/variants/{variant_id}", response_model=VariantResponse)
async def update_variant(
    product_id: int,
    variant_id: int,
    variant_update: VariantUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update a variant (admin only)"""
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.product_id == product_id
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Update variant fields
    if variant_update.size is not None:
        variant.size = variant_update.size
    if variant_update.color is not None:
        variant.color = variant_update.color
    if variant_update.credits_modifier is not None:
        variant.credits_modifier = variant_update.credits_modifier
    
    # Update inventory if quantity specified
    if variant_update.quantity is not None:
        inventory = db.query(InventoryLot).filter(
            InventoryLot.variant_id == variant_id
        ).first()
        
        if inventory:
            inventory.quantity = variant_update.quantity
        else:
            inventory = InventoryLot(
                variant_id=variant_id,
                quantity=variant_update.quantity
            )
            db.add(inventory)
    
    db.commit()
    db.refresh(variant)
    return variant


@router.delete("/products/{product_id}/variants/{variant_id}")
async def delete_variant(
    product_id: int,
    variant_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a variant (admin only)"""
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.product_id == product_id
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    db.delete(variant)
    db.commit()
    return {"message": "Variant deleted successfully"}


@router.post("/products/{product_id}/variants/{variant_id}/inventory")
async def update_inventory(
    product_id: int,
    variant_id: int,
    quantity: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update inventory for a variant (admin only)"""
    inventory = db.query(InventoryLot).filter(
        InventoryLot.variant_id == variant_id
    ).first()
    if not inventory:
        inventory = InventoryLot(variant_id=variant_id, quantity=quantity)
        db.add(inventory)
    else:
        inventory.quantity = quantity
    db.commit()
    return {"message": "Inventory updated", "quantity": quantity}


@router.post("/credits/grant")
async def grant_credits_admin(
    grant_data: CreditGrant,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Grant credits to a user (admin only)"""
    ledger_entry = grant_credits(
        db,
        grant_data.user_id,
        grant_data.amount,
        grant_data.description
    )
    return {"message": "Credits granted", "ledger_entry_id": ledger_entry.id}


@router.post("/credits/bulk-grant")
async def bulk_grant_credits_admin(
    grant_data: BulkCreditGrant,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Grant CapyCoins to multiple users at once (admin only)"""
    ledger_entries = []
    successful_users = []
    failed_users = []
    
    for user_id in grant_data.user_ids:
        try:
            # Verify user exists
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                failed_users.append({"user_id": user_id, "reason": "User not found"})
                continue
            
            # Grant CapyCoins
            ledger_entry = grant_credits(
                db,
                user_id,
                grant_data.amount,
                grant_data.description
            )
            ledger_entries.append(ledger_entry.id)
            successful_users.append({"user_id": user_id, "user_name": user.name})
        except Exception as e:
            failed_users.append({"user_id": user_id, "reason": str(e)})
    
    return {
        "message": f"CapyCoins granted to {len(successful_users)} user(s)",
        "successful_count": len(successful_users),
        "failed_count": len(failed_users),
        "successful_users": successful_users,
        "failed_users": failed_users,
        "ledger_entry_ids": ledger_entries
    }


@router.post("/users/import")
async def import_users(
    users_data: List[dict],
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Import users from CSV (admin only)"""
    imported = []
    for user_data in users_data:
        user = User(**user_data)
        db.add(user)
        imported.append(user)
    
    db.commit()
    return {"message": f"{len(imported)} users imported", "count": len(imported)}


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/orders", response_model=List[OrderWithUserResponse])
async def get_all_orders(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all orders with user and product details (admin only)"""
    from src.models import Product, ProductVariant
    
    orders = db.query(Order).order_by(
        Order.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Enrich orders with user and product details
    enriched_orders = []
    for order in orders:
        order_dict = {
            'id': order.id,
            'user_id': order.user_id,
            'user': order.user,
            'status': order.status,
            'total_credits': order.total_credits,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'completed_at': order.completed_at,
            'items': []
        }
        
        # Enrich order items with product/variant details
        for item in order.items:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            product = None
            if variant:
                product = db.query(Product).filter(Product.id == variant.product_id).first()
            
            item_dict = {
                'id': item.id,
                'order_id': item.order_id,
                'variant_id': item.variant_id,
                'quantity': item.quantity,
                'unit_credits': item.unit_credits,
                'total_credits': item.total_credits,
                'created_at': item.created_at,
                'product_name': product.name if product else None,
                'variant_size': variant.size if variant else None,
                'variant_color': variant.color if variant else None
            }
            order_dict['items'].append(item_dict)
        
        enriched_orders.append(order_dict)
    
    return enriched_orders


@router.get("/orders/processing", response_model=List[OrderWithUserResponse])
async def get_processing_orders(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all processing (approved, awaiting fulfillment) orders with user and product details (admin only)"""
    from src.models import OrderStatus, Product, ProductVariant
    
    orders = db.query(Order).filter(
        Order.status == OrderStatus.PROCESSING
    ).order_by(Order.created_at.desc()).all()
    
    # Enrich orders with user and product details
    enriched_orders = []
    for order in orders:
        order_dict = {
            'id': order.id,
            'user_id': order.user_id,
            'user': order.user,
            'status': order.status,
            'total_credits': order.total_credits,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'completed_at': order.completed_at,
            'items': []
        }
        
        # Enrich order items with product/variant details
        for item in order.items:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            product = None
            if variant:
                product = db.query(Product).filter(Product.id == variant.product_id).first()
            
            item_dict = {
                'id': item.id,
                'order_id': item.order_id,
                'variant_id': item.variant_id,
                'quantity': item.quantity,
                'unit_credits': item.unit_credits,
                'total_credits': item.total_credits,
                'created_at': item.created_at,
                'product_name': product.name if product else None,
                'variant_size': variant.size if variant else None,
                'variant_color': variant.color if variant else None
            }
            order_dict['items'].append(item_dict)
        
        enriched_orders.append(order_dict)
    
    return enriched_orders


# Backwards compatibility - redirect old pending endpoint to processing
@router.get("/orders/pending", response_model=List[OrderWithUserResponse])
async def get_pending_orders(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """DEPRECATED: Use /orders/processing instead. Get all pending orders (admin only)"""
    return await get_processing_orders(admin_user, db)


@router.post("/orders/{order_id}/fulfill", response_model=OrderWithUserResponse)
async def fulfill_order_endpoint(
    order_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Fulfill an approved order - deducts inventory and marks as completed (admin only)"""
    from src.services.order_service import fulfill_order
    from src.models import Product, ProductVariant
    
    try:
        order = fulfill_order(db, order_id)
        
        # Enrich with user and product details
        order_dict = {
            'id': order.id,
            'user_id': order.user_id,
            'user': order.user,
            'status': order.status,
            'total_credits': order.total_credits,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'completed_at': order.completed_at,
            'items': []
        }
        
        for item in order.items:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            product = None
            if variant:
                product = db.query(Product).filter(Product.id == variant.product_id).first()
            
            item_dict = {
                'id': item.id,
                'order_id': item.order_id,
                'variant_id': item.variant_id,
                'quantity': item.quantity,
                'unit_credits': item.unit_credits,
                'total_credits': item.total_credits,
                'created_at': item.created_at,
                'product_name': product.name if product else None,
                'variant_size': variant.size if variant else None,
                'variant_color': variant.color if variant else None
            }
            order_dict['items'].append(item_dict)
        
        return order_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Backwards compatibility - redirect old approve endpoint to fulfill
@router.post("/orders/{order_id}/approve", response_model=OrderWithUserResponse)
async def approve_order_endpoint(
    order_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """DEPRECATED: Use /fulfill instead. Approve a pending order - deducts credits and inventory (admin only)"""
    return await fulfill_order_endpoint(order_id, admin_user, db)


@router.post("/orders/{order_id}/deny")
async def deny_order_endpoint(
    order_id: int,
    reason: Optional[str] = None,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Deny an approved order - releases reserved inventory and refunds credits (admin only)"""
    from src.services.order_service import deny_order
    try:
        order = deny_order(db, order_id, reason)
        return {"message": "Order denied", "order_id": order_id, "status": order.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Backwards compatibility - redirect old reject endpoint to deny
@router.post("/orders/{order_id}/reject")
async def reject_order_endpoint(
    order_id: int,
    reason: Optional[str] = None,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """DEPRECATED: Use /deny instead. Reject a pending order - releases reserved inventory (admin only)"""
    return await deny_order_endpoint(order_id, reason, admin_user, db)


@router.get("/users/{user_id}/balance")
async def get_user_credit_balance(
    user_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get user's credit balance (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    balance = get_user_balance(db, user_id)
    return {"user_id": user_id, "balance": balance}


@router.get("/users/{user_id}/ledger", response_model=List[CreditLedgerResponse])
async def get_user_credit_ledger(
    user_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get user's credit ledger history (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    ledger = db.query(CreditLedger).filter(
        CreditLedger.user_id == user_id
    ).order_by(CreditLedger.created_at.desc()).all()
    return ledger


@router.get("/users/{user_id}/orders", response_model=List[OrderResponse])
async def get_user_orders(
    user_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get user's order history (perk history) (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    orders = db.query(Order).filter(
        Order.user_id == user_id
    ).order_by(Order.created_at.desc()).all()
    return orders


@router.get("/inventory/overview")
async def get_inventory_overview(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive inventory overview (admin only)"""
    products = db.query(Product).filter(Product.is_active == True).all()
    
    inventory_data = []
    for product in products:
        product_info = {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "base_credits": product.base_credits,
            "image_url": product.image_url,
            "total_variants": len(product.variants),
            "variants": []
        }
        
        total_stock = 0
        total_reserved = 0
        
        for variant in product.variants:
            variant_stock = sum(lot.quantity for lot in variant.inventory_lots)
            variant_reserved = sum(lot.reserved_quantity for lot in variant.inventory_lots)
            available = variant_stock - variant_reserved
            
            total_stock += variant_stock
            total_reserved += variant_reserved
            
            variant_info = {
                "id": variant.id,
                "size": variant.size,
                "color": variant.color,
                "credits_modifier": variant.credits_modifier,
                "total_stock": variant_stock,
                "reserved": variant_reserved,
                "available": available,
                "stock_status": "out_of_stock" if available == 0 else ("low_stock" if available < 10 else "in_stock")
            }
            product_info["variants"].append(variant_info)
        
        product_info["total_stock"] = total_stock
        product_info["total_reserved"] = total_reserved
        product_info["total_available"] = total_stock - total_reserved
        
        inventory_data.append(product_info)
    
    return inventory_data


@router.get("/inventory/low-stock")
async def get_low_stock_items(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    threshold: int = 10
):
    """Get products with low stock (admin only)"""
    products = db.query(Product).filter(Product.is_active == True).all()
    
    low_stock_items = []
    for product in products:
        for variant in product.variants:
            variant_stock = sum(lot.quantity for lot in variant.inventory_lots)
            variant_reserved = sum(lot.reserved_quantity for lot in variant.inventory_lots)
            available = variant_stock - variant_reserved
            
            if available < threshold and available >= 0:
                low_stock_items.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "variant_id": variant.id,
                    "variant_size": variant.size,
                    "variant_color": variant.color,
                    "available": available,
                    "reserved": variant_reserved,
                    "total": variant_stock
                })
    
    return sorted(low_stock_items, key=lambda x: x["available"])


@router.post("/inventory/adjust")
async def adjust_inventory(
    variant_id: int,
    adjustment: int,
    reason: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Adjust inventory quantity for a variant (admin only)"""
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    inventory = db.query(InventoryLot).filter(
        InventoryLot.variant_id == variant_id
    ).first()
    
    if not inventory:
        if adjustment < 0:
            raise HTTPException(status_code=400, detail="Cannot reduce inventory that doesn't exist")
        inventory = InventoryLot(variant_id=variant_id, quantity=adjustment)
        db.add(inventory)
    else:
        new_quantity = inventory.quantity + adjustment
        if new_quantity < inventory.reserved_quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reduce stock below reserved quantity ({inventory.reserved_quantity})"
            )
        inventory.quantity = new_quantity
    
    db.commit()
    db.refresh(inventory)
    
    return {
        "message": "Inventory adjusted",
        "variant_id": variant_id,
        "adjustment": adjustment,
        "new_quantity": inventory.quantity,
        "available": inventory.quantity - inventory.reserved_quantity,
        "reason": reason
    }

