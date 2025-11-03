"""Seed database with sample data"""
from datetime import datetime

from src.core.database import SessionLocal, init_db
from src.models import User, CreditLedger, UserRole, CreditType


def seed_database():
    """Create sample data for testing - Always clears and reseeds users"""
    db = SessionLocal()
    
    try:
        # Initialize tables
        init_db()
        
        # Always clear and reseed users to ensure consistency
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"⚠️  Found {existing_users} existing users. Clearing for fresh seed...")
            # Clear all existing data (in correct order to respect foreign keys)
            from src.models import Order, OrderItem
            db.query(OrderItem).delete()
            db.query(CreditLedger).delete()
            db.query(Order).delete()
            db.query(User).delete()
            db.commit()
            print("✅ Existing data cleared.")
        
        print("Seeding database with 4 users...")
        
        # Create sample users
        users = [
            User(
                email="laurie.bardare.fake@capyx.be",
                name="Laurie Bardare",
                start_date=datetime.utcnow(),
                role=UserRole.ADMIN
            ),
            User(
                email="tomma.vlaemynck.fake@capyx.be",
                name="Tomma Vlaemynck",
                start_date=datetime.utcnow(),
                role=UserRole.EMPLOYEE
            ),
            User(
                email="Guillaume.verhamme.fake@capyx.be",
                name="Guillaume Verhamme",
                start_date=datetime.utcnow(),
                role=UserRole.EMPLOYEE
            ),
            User(
                email="tinael.devresse.fake@capyx.be",
                name="Tinael Devresse",
                start_date=datetime.utcnow(),
                role=UserRole.EMPLOYEE
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
        
        print(f"✅ Successfully seeded database!")
        print(f"   - Created {len(users)} users")
        print(f"")
        print(f"📧 Capyx Team Users:")
        print(f"   - Admin: laurie.bardare.fake@capyx.be (1000 credits)")
        print(f"   - Employee: tomma.vlaemynck.fake@capyx.be (200 credits)")
        print(f"   - Employee: Guillaume.verhamme.fake@capyx.be (200 credits)")
        print(f"   - Employee: tinael.devresse.fake@capyx.be (200 credits)")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

