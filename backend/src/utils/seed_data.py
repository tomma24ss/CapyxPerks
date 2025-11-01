"""Seed database with sample data"""
from datetime import datetime

from src.core.database import SessionLocal, init_db
from src.models import User, Product, ProductVariant, InventoryLot, CreditLedger, UserRole, CreditType


def seed_database():
    """Create sample data for testing"""
    db = SessionLocal()
    
    try:
        # Initialize tables
        init_db()
        
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users. Skipping seed.")
            return
        
        print("Seeding database...")
        
        # Create sample users
        users = [
            User(
                email="admin@company.com",
                name="Admin User",
                start_date=datetime.utcnow(),
                role=UserRole.ADMIN
            ),
            User(
                email="john.doe@company.com",
                name="John Doe",
                start_date=datetime.utcnow(),
                role=UserRole.EMPLOYEE
            ),
            User(
                email="jane.smith@company.com",
                name="Jane Smith",
                start_date=datetime.utcnow(),
                role=UserRole.SENIOR
            ),
            User(
                email="intern@company.com",
                name="Intern User",
                start_date=datetime.utcnow(),
                role=UserRole.INTERN
            ),
        ]
        
        for user in users:
            db.add(user)
        
        db.commit()
        
        # Grant initial credits to users
        credit_map = {
            UserRole.ADMIN: 1000.0,
            UserRole.EMPLOYEE: 200.0,
            UserRole.SENIOR: 300.0,
            UserRole.INTERN: 100.0
        }
        
        for user in users:
            credit_amount = credit_map.get(user.role, 100.0)
            ledger = CreditLedger(
                user_id=user.id,
                amount=credit_amount,
                credit_type=CreditType.GRANT,
                description=f"Initial credits for {user.role.value}"
            )
            db.add(ledger)
        
        db.commit()
        
        # Create sample products
        products_data = [
            {
                "name": "Company T-Shirt",
                "description": "Premium cotton t-shirt with company logo. Available in multiple colors and sizes.",
                "base_credits": 50.0,
                "variants": [
                    {"size": "S", "color": "Black", "quantity": 25},
                    {"size": "M", "color": "Black", "quantity": 30},
                    {"size": "L", "color": "Black", "quantity": 30},
                    {"size": "XL", "color": "Black", "quantity": 20},
                    {"size": "S", "color": "Navy", "quantity": 25},
                    {"size": "M", "color": "Navy", "quantity": 30},
                    {"size": "L", "color": "Navy", "quantity": 30},
                    {"size": "XL", "color": "Navy", "quantity": 20},
                ]
            },
            {
                "name": "Insulated Water Bottle",
                "description": "Stainless steel 32oz insulated water bottle. Keeps drinks cold for 24 hours.",
                "base_credits": 75.0,
                "variants": [
                    {"size": "32oz", "color": "Silver", "quantity": 50},
                    {"size": "32oz", "color": "Black", "quantity": 50},
                    {"size": "32oz", "color": "Blue", "quantity": 40},
                ]
            },
            {
                "name": "Laptop Backpack",
                "description": "Durable laptop backpack with padded compartment for 15\" laptop. Multiple pockets.",
                "base_credits": 120.0,
                "variants": [
                    {"size": "One Size", "color": "Charcoal", "quantity": 30},
                    {"size": "One Size", "color": "Black", "quantity": 30},
                ]
            },
            {
                "name": "Wireless Mouse",
                "description": "Ergonomic wireless mouse with precision tracking. Includes USB receiver.",
                "base_credits": 40.0,
                "variants": [
                    {"size": "Standard", "color": "Black", "quantity": 60},
                    {"size": "Standard", "color": "Gray", "quantity": 40},
                ]
            },
            {
                "name": "Coffee Mug",
                "description": "Ceramic 14oz coffee mug with company logo. Microwave and dishwasher safe.",
                "base_credits": 25.0,
                "variants": [
                    {"size": "14oz", "color": "White", "quantity": 100},
                    {"size": "14oz", "color": "Black", "quantity": 80},
                ]
            },
            {
                "name": "Hoodie",
                "description": "Comfortable zip-up hoodie with company branding. Perfect for casual wear.",
                "base_credits": 85.0,
                "variants": [
                    {"size": "S", "color": "Gray", "quantity": 20},
                    {"size": "M", "color": "Gray", "quantity": 25},
                    {"size": "L", "color": "Gray", "quantity": 25},
                    {"size": "XL", "color": "Gray", "quantity": 15},
                    {"size": "S", "color": "Navy", "quantity": 20},
                    {"size": "M", "color": "Navy", "quantity": 25},
                    {"size": "L", "color": "Navy", "quantity": 25},
                    {"size": "XL", "color": "Navy", "quantity": 15},
                ]
            },
            {
                "name": "Notebook Set",
                "description": "Premium set of 3 notebooks with company logo. Perfect for meetings and notes.",
                "base_credits": 30.0,
                "variants": [
                    {"size": "A5", "color": "Mixed", "quantity": 80},
                ]
            },
            {
                "name": "Desk Organizer",
                "description": "Bamboo desk organizer with compartments for pens, phone, and accessories.",
                "base_credits": 45.0,
                "variants": [
                    {"size": "Standard", "color": "Natural", "quantity": 40},
                ]
            },
        ]
        
        for product_data in products_data:
            variants_data = product_data.pop("variants")
            product = Product(**product_data)
            db.add(product)
            db.commit()
            db.refresh(product)
            
            # Create variants and inventory
            for variant_data in variants_data:
                quantity = variant_data.pop("quantity")
                variant = ProductVariant(product_id=product.id, **variant_data)
                db.add(variant)
                db.commit()
                db.refresh(variant)
                
                # Create inventory
                inventory = InventoryLot(variant_id=variant.id, quantity=quantity)
                db.add(inventory)
            
            db.commit()
        
        print(f"✅ Successfully seeded database!")
        print(f"   - Created {len(users)} users")
        print(f"   - Created {len(products_data)} products")
        print(f"")
        print(f"📧 Test Users:")
        print(f"   - Admin: admin@company.com (1000 credits)")
        print(f"   - Employee: john.doe@company.com (200 credits)")
        print(f"   - Senior: jane.smith@company.com (300 credits)")
        print(f"   - Intern: intern@company.com (100 credits)")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

