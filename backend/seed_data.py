"""Seed database with sample data"""
from database import SessionLocal, init_db
from models import User, Product, ProductVariant, InventoryLot, CreditLedger, UserRole, CreditType, Order, OrderItem
from datetime import datetime

def seed_database():
    """Create sample data for testing"""
    db = SessionLocal()
    
    try:
        # Initialize tables
        init_db()
        
        # Clear all existing data (in correct order to respect foreign keys)
        print("Clearing existing data...")
        db.query(OrderItem).delete()
        db.query(CreditLedger).delete()  # Delete before Order because it references orders
        db.query(Order).delete()
        db.query(User).delete()
        db.query(InventoryLot).delete()
        db.query(ProductVariant).delete()
        db.query(Product).delete()
        db.commit()
        print("✅ All existing data cleared.")
        
        print("Seeding database...")
        
        # Create admin user
        admin_user = User(
            email="laurie.bardare@capyx.be",
            name="Laurie Bardare",
            start_date=datetime.utcnow(),
            role=UserRole.ADMIN
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        # Grant initial credits to admin
        ledger = CreditLedger(
            user_id=admin_user.id,
            amount=1000.0,
            credit_type=CreditType.GRANT,
            description=f"Initial credits for admin"
        )
        db.add(ledger)
        db.commit()
        
        print(f"✅ Successfully seeded database!")
        print(f"   - Created 1 admin user")
        print(f"   - Admin: laurie.bardare@capyx.be")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

