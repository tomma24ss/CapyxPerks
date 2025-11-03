# Koyeb Persistent Storage Issue - CRITICAL FIX

## The Real Problem 🔴

**Your database is being wiped on every deployment!**

Your Dockerfile runs PostgreSQL inside the container at `/var/lib/postgresql/data`, but **Koyeb has no persistent volume mounted**, so:
- ✅ Seeding works during startup
- ✅ Users are created successfully  
- ❌ **But the database is wiped on every restart/redeploy**

This is why you don't see users on the dev-login page - the database starts fresh every time!

## The Solution

You need to configure a **Persistent Volume** in Koyeb to store the PostgreSQL data.

### Step 1: Configure Persistent Volume on Koyeb

1. Go to your Koyeb app dashboard
2. Click on "Settings" or "Storage"
3. Add a new Persistent Volume:
   - **Mount Path**: `/var/lib/postgresql/data`
   - **Size**: At least 1GB (or more depending on your needs)
   - **Name**: `postgres-data` (or any name you prefer)

4. Save and redeploy

### Step 2: Alternative - Use Koyeb Managed Database (Recommended)

Instead of running PostgreSQL inside your container, use Koyeb's managed database service:

1. **Create a Koyeb PostgreSQL Database:**
   - Go to Koyeb Dashboard → "Database"
   - Create a new PostgreSQL database
   - Note the connection string

2. **Update your environment variables in Koyeb:**
   - Set `DATABASE_URL` to your Koyeb database connection string
   - Example: `postgresql://user:password@db-host.koyeb.app:5432/dbname`

3. **Modify your Dockerfile to skip PostgreSQL installation:**
   - Remove PostgreSQL installation steps
   - Remove PostgreSQL from supervisord.conf
   - Keep only Redis, Backend, and Nginx

This is **much better** because:
- ✅ Database persists between deployments
- ✅ Automatic backups
- ✅ Better performance
- ✅ Smaller container image
- ✅ Faster deployments

## Quick Fix for Testing (Not Recommended for Production)

If you just want to test quickly, you can modify `init.sh` to **always reseed on startup**, even if users exist:

```bash
# In init.sh, after the database initialization
echo "Force reseeding database..."
python -c "
from src.core.database import SessionLocal
from src.models import User, CreditLedger, OrderItem, Order
from src.utils.seed_data import seed_database

db = SessionLocal()
db.query(OrderItem).delete()
db.query(CreditLedger).delete()
db.query(Order).delete()
db.query(User).delete()
db.commit()
db.close()

seed_database()
" 2>&1
```

**Warning:** This will wipe all user data on every restart, including orders and transactions.

## Recommended Architecture for Koyeb

```
┌─────────────────────────────────────┐
│         Koyeb Application           │
│  ┌──────────────────────────────┐  │
│  │   Your Container (Dockerfile) │  │
│  │  - Frontend (Nginx)           │  │
│  │  - Backend (FastAPI/Uvicorn)  │  │
│  │  - Redis (for sessions)       │  │
│  └──────────────────────────────┘  │
│              │                       │
│              ↓                       │
│  ┌──────────────────────────────┐  │
│  │  Koyeb Managed PostgreSQL    │  │
│  │  (Persistent, Backed up)      │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## How to Migrate to Koyeb Managed Database

### 1. Simplify your Dockerfile

Remove PostgreSQL installation and only keep what you need:

```dockerfile
FROM python:3.11-slim

# Install only necessary dependencies
RUN apt-get update && apt-get install -y \
    curl \
    redis-server \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# ... rest of your Dockerfile without PostgreSQL
```

### 2. Update supervisord.conf

Remove the PostgreSQL program section:

```ini
# Remove this entire section:
# [program:postgresql]
# ...
```

### 3. Update init.sh

Remove PostgreSQL initialization:

```bash
#!/bin/bash
set -e

# Wait for Redis (keep this)
echo "Waiting for Redis..."
for i in {1..30}; do
    if redis-cli -h localhost ping > /dev/null 2>&1; then
        echo "Redis is ready!"
        break
    fi
    sleep 1
done

# Database initialization (will connect to external Koyeb DB)
echo "Initializing database schema..."
cd /app/backend
python -c "from src.models import User, CreditLedger, Order, OrderItem, Product, ProductVariant, InventoryLot; from src.core.database import init_db; init_db(); print('✅ Database schema initialized')" 2>&1

# Seed only if no users exist
echo "Checking if seeding is needed..."
python -c "
from src.core.database import SessionLocal
from src.models import User

db = SessionLocal()
count = db.query(User).count()
db.close()

if count == 0:
    print('No users found. Seeding database...')
    from src.utils.seed_data import seed_database
    seed_database()
else:
    print(f'Database already has {count} users. Skipping seed.')
" 2>&1

echo "Initialization complete!"
```

### 4. Set Environment Variable in Koyeb

In your Koyeb app settings, add:
- `DATABASE_URL` = Your Koyeb PostgreSQL connection string

### 5. Deploy

```bash
git add .
git commit -m "Migrate to Koyeb managed database"
git push origin main
```

## Verify It Works

After deployment with persistent storage or managed DB:

1. **Check logs** - Should see seeding messages
2. **Test the endpoint:**
   ```bash
   curl https://your-app.koyeb.app/api/auth/dev/users
   ```
3. **Visit dev-login** - Should see 4 users
4. **Redeploy** - Users should still be there!

## Summary

Choose one of these solutions:

### Option A: Add Persistent Volume (Quick)
- ✅ Minimal code changes
- ❌ Less reliable
- ❌ No automatic backups

### Option B: Koyeb Managed Database (Recommended)
- ✅ Production-ready
- ✅ Automatic backups
- ✅ Better performance
- ✅ Database persists forever
- ✅ Smaller Docker image = faster deploys

I strongly recommend **Option B** for a real deployment.

