"""Order processing service"""
from sqlalchemy.orm import Session
from datetime import datetime
import redis

from src.models import (
    User, Product, ProductVariant, InventoryLot,
    Order, OrderItem, OrderStatus
)
from src.schemas.schemas import OrderCreate
from src.services.credit_service import get_user_balance, deduct_credits
from src.core.config import settings


def process_order(db: Session, user: User, order_data: OrderCreate) -> Order:
    """Process an order and deduct credits"""
    # Calculate total credits
    total_credits = 0.0
    items_to_add = []
    
    for item in order_data.items:
        # Get variant and calculate credits
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == item.variant_id
        ).first()
        if not variant:
            raise ValueError(f"Variant {item.variant_id} not found")
        
        product = db.query(Product).filter(Product.id == variant.product_id).first()
        unit_credits = product.base_credits + variant.credits_modifier
        item_total = unit_credits * item.quantity
        total_credits += item_total
        
        # Check inventory
        inventory = db.query(InventoryLot).filter(
            InventoryLot.variant_id == item.variant_id
        ).first()
        if not inventory or inventory.quantity - inventory.reserved_quantity < item.quantity:
            raise ValueError(f"Insufficient inventory for variant {item.variant_id}")
        
        items_to_add.append({
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "unit_credits": unit_credits,
            "total_credits": item_total
        })
    
    # Check user balance
    balance = get_user_balance(db, user.id)
    if balance < total_credits:
        raise ValueError("Insufficient credits")
    
    # Create order
    order = Order(
        user_id=user.id,
        status=OrderStatus.PENDING,
        total_credits=total_credits
    )
    db.add(order)
    db.flush()
    
    # Create order items and reserve inventory
    for item_data in items_to_add:
        order_item = OrderItem(
            order_id=order.id,
            **item_data
        )
        db.add(order_item)
        
        # Reserve inventory (don't deduct yet - only when admin approves)
        inventory = db.query(InventoryLot).filter(
            InventoryLot.variant_id == item_data["variant_id"]
        ).first()
        inventory.reserved_quantity += item_data["quantity"]
    
    # DEDUCT credits immediately when order is created
    # This prevents employees from submitting orders they can't afford
    deduct_credits(db, user.id, total_credits, f"Order #{order.id} - Pending Approval", order.id)
    
    # Order stays in PENDING status until admin approves/rejects
    
    db.commit()
    db.refresh(order)
    
    return order


def approve_order(db: Session, order_id: int) -> Order:
    """Approve a pending order - deduct inventory (credits already deducted)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")
    
    if order.status != OrderStatus.PENDING:
        raise ValueError(f"Order is not pending (status: {order.status})")
    
    # Deduct inventory from reserved
    for item in order.items:
        inventory = db.query(InventoryLot).filter(
            InventoryLot.variant_id == item.variant_id
        ).first()
        if inventory.reserved_quantity < item.quantity:
            raise ValueError(f"Insufficient reserved inventory for variant {item.variant_id}")
        inventory.reserved_quantity -= item.quantity
        inventory.quantity -= item.quantity
    
    # Credits were already deducted when order was created
    # No need to deduct again
    
    # Update order status
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order


def reject_order(db: Session, order_id: int, reason: str = None) -> Order:
    """Reject a pending order - release reserved inventory and REFUND credits"""
    from src.services.credit_service import grant_credits
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")
    
    if order.status != OrderStatus.PENDING:
        raise ValueError(f"Order is not pending (status: {order.status})")
    
    # Release reserved inventory
    for item in order.items:
        inventory = db.query(InventoryLot).filter(
            InventoryLot.variant_id == item.variant_id
        ).first()
        if inventory:
            inventory.reserved_quantity -= item.quantity
    
    # REFUND credits back to user (since they were deducted when order was created)
    refund_description = f"Order #{order.id} - Refund (Rejected)"
    if reason:
        refund_description += f": {reason}"
    grant_credits(db, order.user_id, order.total_credits, refund_description, order.id)
    
    # Update order status
    order.status = OrderStatus.CANCELLED
    
    db.commit()
    db.refresh(order)
    
    return order


def check_and_reserve_inventory(db: Session, variant_id: int, quantity: int) -> bool:
    """Check and reserve inventory in Redis"""
    redis_client = redis.from_url(settings.redis_url, decode_responses=False)
    
    key = f"inventory:reserved:{variant_id}"
    inventory = db.query(InventoryLot).filter(
        InventoryLot.variant_id == variant_id
    ).first()
    
    if not inventory:
        return False
    
    available = inventory.quantity - inventory.reserved_quantity
    if available < quantity:
        return False
    
    # Reserve in Redis (simple counter)
    current_reserved = redis_client.get(key) or 0
    redis_client.set(key, int(current_reserved) + quantity, ex=300)  # 5 minute expiry
    
    return True

