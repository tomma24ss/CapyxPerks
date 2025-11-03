#!/bin/bash
set -e

echo "========================================="
echo "CAPYX PERKS - DATABASE INITIALIZATION"
echo "========================================="
echo "Waiting for PostgreSQL to start..."

# Wait for PostgreSQL to be ready (up to 60 seconds)
for i in {1..60}; do
    if pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        break
    fi
    echo "Waiting for PostgreSQL... ($i/60)"
    sleep 1
done

# Wait an additional 2 seconds to ensure PostgreSQL is fully ready
sleep 2

# Create database and user if they don't exist
echo "Creating database..."
su - postgres -c "psql -c \"CREATE DATABASE capyxperks;\" 2>/dev/null" || echo "Database already exists"
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\" 2>/dev/null" || true

echo "PostgreSQL initialized successfully"

# Wait for Redis
echo "Waiting for Redis..."
for i in {1..30}; do
    if redis-cli -h localhost ping > /dev/null 2>&1; then
        echo "Redis is ready!"
        break
    fi
    sleep 1
done

# Initialize database schema
echo "Initializing database schema..."
cd /app/backend
python -c "from src.models import User, CreditLedger, Order, OrderItem, Product, ProductVariant, InventoryLot; from src.core.database import init_db; init_db(); print('✅ Database schema initialized')" 2>&1

# Seed database with 4 sample users (Laurie, Tomma, Guillaume, Tinael)
# Force reseed on every startup since we don't have persistent storage
echo "Force reseeding database (no persistent storage)..."
python -c "
from src.core.database import SessionLocal
from src.models import User, CreditLedger, OrderItem, Order

# Clear existing data
db = SessionLocal()
try:
    db.query(OrderItem).delete()
    db.query(CreditLedger).delete()
    db.query(Order).delete()
    db.query(User).delete()
    db.commit()
    print('Cleared existing data')
except Exception as e:
    print(f'Error clearing data: {e}')
    db.rollback()
finally:
    db.close()

# Reseed
from src.utils.seed_data import seed_database
seed_database()
" 2>&1

echo "========================================="
echo "✅ INITIALIZATION COMPLETE!"
echo "========================================="

