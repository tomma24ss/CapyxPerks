#!/bin/bash
set -e

echo "========================================="
echo "CAPYX PERKS - DATABASE INITIALIZATION"
echo "========================================="
echo "Current ENVIRONMENT: ${ENVIRONMENT:-NOT SET}"
echo "Current working directory: $(pwd)"
echo "========================================="
echo ""

echo "Waiting for PostgreSQL to start..."

# Wait for PostgreSQL to be ready (up to 90 seconds with more retries)
POSTGRES_READY=0
for i in {1..90}; do
    if pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready! (attempt $i)"
        POSTGRES_READY=1
        break
    fi
    if [ $((i % 10)) -eq 0 ]; then
        echo "⏳ Still waiting for PostgreSQL... ($i/90)"
    fi
    sleep 1
done

if [ $POSTGRES_READY -eq 0 ]; then
    echo "❌ PostgreSQL failed to start after 90 seconds"
    exit 1
fi

# Wait an additional 3 seconds to ensure PostgreSQL is fully ready
echo "Waiting 3 more seconds for PostgreSQL to stabilize..."
sleep 3

# Create database and user if they don't exist
echo "Creating database..."
su - postgres -c "psql -c \"CREATE DATABASE capyxperks;\" 2>/dev/null" || echo "✅ Database 'capyxperks' already exists"
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\" 2>/dev/null" || true
echo "✅ PostgreSQL initialized successfully"
echo ""

# Wait for Redis
echo "Waiting for Redis..."
REDIS_READY=0
for i in {1..30}; do
    if redis-cli -h localhost ping > /dev/null 2>&1; then
        echo "✅ Redis is ready! (attempt $i)"
        REDIS_READY=1
        break
    fi
    sleep 1
done

if [ $REDIS_READY -eq 0 ]; then
    echo "❌ Redis failed to start after 30 seconds"
    exit 1
fi
echo ""

# Change to backend directory
cd /app/backend
echo "Changed to backend directory: $(pwd)"
echo ""

# Initialize database schema
echo "========================================="
echo "STEP 1: Initialize database schema"
echo "========================================="
python -c "
import sys
import traceback
try:
    print('Importing models...')
    from src.models import User, CreditLedger, Order, OrderItem, Product, ProductVariant, InventoryLot
    print('✅ Models imported successfully')
    
    print('Importing database init...')
    from src.core.database import init_db
    print('✅ Database init imported')
    
    print('Creating tables...')
    init_db()
    print('✅ Database schema initialized - all tables created')
except Exception as e:
    print(f'❌ Error initializing schema: {e}')
    traceback.print_exc()
    sys.exit(1)
" 2>&1
INIT_STATUS=$?

if [ $INIT_STATUS -ne 0 ]; then
    echo "❌ Failed to initialize database schema"
    exit 1
fi
echo ""

# Seed database with 4 sample users (Laurie, Tomma, Guillaume, Tinael)
# Force reseed on every startup since we don't have persistent storage
echo "========================================="
echo "STEP 2: Seed database with users"
echo "========================================="
echo "Force reseeding database (no persistent storage on Koyeb)..."
python -c "
import sys
import traceback

try:
    print('Importing database session...')
    from src.core.database import SessionLocal
    from src.models import User, CreditLedger, OrderItem, Order
    print('✅ Database and models imported')
    
    # Clear existing data
    print('Clearing existing data...')
    db = SessionLocal()
    try:
        deleted_order_items = db.query(OrderItem).delete()
        deleted_ledger = db.query(CreditLedger).delete()
        deleted_orders = db.query(Order).delete()
        deleted_users = db.query(User).delete()
        db.commit()
        print(f'✅ Cleared existing data:')
        print(f'   - Order items: {deleted_order_items}')
        print(f'   - Credit ledger entries: {deleted_ledger}')
        print(f'   - Orders: {deleted_orders}')
        print(f'   - Users: {deleted_users}')
    except Exception as e:
        print(f'Error clearing data: {e}')
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
    
    # Reseed
    print('')
    print('Starting seed process...')
    from src.utils.seed_data import seed_database
    seed_database()
    
    # Verify users were created
    print('')
    print('Verifying users...')
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        print(f'✅ Total users in database: {user_count}')
        
        if user_count > 0:
            print('')
            print('Users in database:')
            users = db.query(User).all()
            for user in users:
                print(f'  - {user.email} ({user.role.value}) - Active: {user.is_active}')
        else:
            print('⚠️  WARNING: No users found in database after seeding!')
    finally:
        db.close()
        
except Exception as e:
    print(f'❌ Error seeding database: {e}')
    traceback.print_exc()
    sys.exit(1)
" 2>&1
SEED_STATUS=$?

if [ $SEED_STATUS -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ INITIALIZATION COMPLETE!"
echo "========================================="
echo ""
echo "You can now access:"
echo "  - Frontend: http://localhost (or your Koyeb URL)"
echo "  - API: http://localhost/api (or your Koyeb URL/api)"
echo "  - Dev Users API: http://localhost/api/auth/dev/users"
echo "========================================="
echo ""
echo "Starting backend service..."
# Start backend via supervisorctl (socket configured in supervisord.conf)
supervisorctl start backend
echo "✅ Backend service started"

