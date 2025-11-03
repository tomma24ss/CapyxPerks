# Race Condition Fix - Backend Starting Before Database Ready

## The Problem

The deployment was failing with this error:

```
❌ Database connection failed: (psycopg2.OperationalError) 
connection to server at "localhost" (::1), port 5432 failed: 
FATAL:  database "capyxperks" does not exist
```

**Root Cause:** Race condition in supervisord startup sequence:

1. Supervisord starts all services in parallel (postgres, redis, init-db, backend, nginx)
2. The `backend` service tries to verify database connection immediately
3. But `init-db` (which creates the database) is still running
4. Backend crashes because database doesn't exist yet
5. Backend restarts, and by then the database exists, so it works

## The Fix

Modified `start-backend.sh` to **wait for the database** instead of crashing:

### Before (Crashed if DB not ready):
```bash
# Verify database connection
echo "Testing database connection..."
python -c "
try:
    db = SessionLocal()
    user_count = db.query(User).count()
    ...
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    traceback.print_exc()  # This showed error but script continued, causing crash
"
```

### After (Waits up to 30 seconds):
```bash
# Verify database connection (optional - may not be ready yet)
echo "Checking database connection..."
python -c "
# Wait up to 30 seconds for database to be ready
for i in range(30):
    try:
        db = SessionLocal()
        user_count = db.query(User).count()
        print(f'✅ Database connected! Users in database: {user_count}')
        break  # Success, exit loop
    except Exception as e:
        if i == 0:
            print('ℹ️  Database not ready yet, waiting for init-db to complete...')
        if i < 29:
            time.sleep(1)  # Wait 1 second and retry
        else:
            print('⚠️  Database not ready after 30 seconds. Backend will try to initialize it.')
"
```

## What This Does

1. **Tries to connect** to the database
2. **If it fails**, waits 1 second and tries again (up to 30 times)
3. **If it succeeds**, shows user count and sample users
4. **If it never succeeds**, shows a warning but **doesn't crash** - lets FastAPI's startup event handle it

## Why This Works

- The `init-db` script takes ~5-10 seconds to:
  - Wait for PostgreSQL to start
  - Create the database
  - Initialize schema
  - Seed users
  
- The backend now waits up to 30 seconds, which is plenty of time

- If the database still isn't ready, the backend starts anyway and FastAPI's `startup_event()` calls `init_db()` which will create tables if needed

## Files Changed

1. ✅ `start-backend.sh` - Added retry logic with 30-second timeout
2. ✅ `Dockerfile` - Cache bust to force rebuild (`v6-fix-race-condition`)

## Expected Behavior After Fix

### Good Deployment Logs

```
🚀 BACKEND STARTING
ENVIRONMENT: development
========================================

Checking database connection...
ℹ️  Database not ready yet, waiting for init-db to complete...
(waits a few seconds)
✅ Database connected! Users in database: 4
Sample users:
  - laurie.bardare.fake@capyx.be (admin)
  - tomma.vlaemynck.fake@capyx.be (employee)
  - Guillaume.verhamme.fake@capyx.be (employee)
  - tinael.devresse.fake@capyx.be (employee)

Starting Uvicorn web server...
INFO:     Application startup complete.
```

No crash, no restart, smooth startup! ✅

## Deploy Now

```bash
cd /home/tomma/CapyxPerks
git add .
git commit -m "Fix: Race condition - backend waits for database initialization"
git push origin main
```

This should eliminate the backend crash and restart during deployment!

