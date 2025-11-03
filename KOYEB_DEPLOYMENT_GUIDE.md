# Koyeb Deployment Guide - Fix Dev-Login Issue 🚀

## The Problem

When deploying to Koyeb, users don't appear on the dev-login page because:

1. **No Persistent Storage**: Koyeb doesn't provide persistent volumes by default, so the PostgreSQL database inside the container gets wiped on every restart
2. **Environment Variable Not Set**: The `ENVIRONMENT` variable needs to be explicitly set to `development` in Koyeb's dashboard
3. **Timing Issues**: PostgreSQL might not be fully ready when the seeding script runs

## The Solution

This guide will help you properly configure Koyeb to seed users on every startup.

---

## Step 1: Set Environment Variables in Koyeb

**CRITICAL**: You MUST set these environment variables in your Koyeb service:

### Required Environment Variables

Go to your Koyeb service → **Settings** → **Environment Variables** and add:

| Variable Name | Value | Required |
|---------------|-------|----------|
| `ENVIRONMENT` | `development` | ✅ **REQUIRED** |
| `SECRET_KEY` | `your-secret-key-here` | ✅ **REQUIRED** |
| `CORS_ORIGINS` | `*` | Optional (defaults to `*` in dev) |

### Why ENVIRONMENT=development is Critical

The `/api/auth/dev/users` endpoint **blocks access** when `ENVIRONMENT=production`:

```python
@router.get("/dev/users")
async def get_dev_users(db: Session = Depends(get_db)):
    """Get list of users for development login"""
    if settings.environment == "production":
        raise HTTPException(
            status_code=403,
            detail="Development endpoint disabled in production"
        )
    # ...
```

**Without setting ENVIRONMENT=development in Koyeb, the endpoint will return 403 Forbidden!**

---

## Step 2: Deploy to Koyeb

### Option A: Deploy from GitHub (Recommended)

1. Connect your GitHub repository to Koyeb
2. Set **Build Method**: Dockerfile
3. Set **Dockerfile Path**: `./Dockerfile`
4. Set **Port**: `80`
5. Add the environment variables from Step 1
6. Deploy!

### Option B: Deploy with Koyeb CLI

```bash
# Install Koyeb CLI
curl -fsSL https://cli.koyeb.com/install.sh | bash

# Login
koyeb login

# Create service
koyeb service create \
  --app capyxperks \
  --name capyxperks-backend \
  --git github.com/your-username/CapyxPerks \
  --git-branch main \
  --ports 80:http \
  --env ENVIRONMENT=development \
  --env SECRET_KEY=your-secret-key-here \
  --regions fra
```

---

## Step 3: Verify Deployment

### 3.1 Check Logs

Go to your Koyeb service → **Logs** tab

You should see these messages in order:

```
=========================================
CAPYX PERKS - DATABASE INITIALIZATION
=========================================
Current ENVIRONMENT: development
=========================================

Waiting for PostgreSQL to start...
✅ PostgreSQL is ready! (attempt 1)
Waiting 3 more seconds for PostgreSQL to stabilize...
Creating database...
✅ Database 'capyxperks' already exists
✅ PostgreSQL initialized successfully

Waiting for Redis...
✅ Redis is ready! (attempt 1)

Changed to backend directory: /app/backend

=========================================
STEP 1: Initialize database schema
=========================================
Importing models...
✅ Models imported successfully
Importing database init...
✅ Database init imported
Creating tables...
✅ Database schema initialized - all tables created

=========================================
STEP 2: Seed database with users
=========================================
Force reseeding database (no persistent storage on Koyeb)...
Importing database session...
✅ Database and models imported
Clearing existing data...
✅ Cleared existing data:
   - Order items: 0
   - Credit ledger entries: 0
   - Orders: 0
   - Users: 0

Starting seed process...
🌱 Seeding database with 4 users...
✅ Successfully seeded database!
   - Created 4 users

📧 Capyx Team Users:
   - Admin: laurie.bardare.fake@capyx.be (1000 credits)
   - Employee: tomma.vlaemynck.fake@capyx.be (200 credits)
   - Employee: Guillaume.verhamme.fake@capyx.be (200 credits)
   - Employee: tinael.devresse.fake@capyx.be (200 credits)

Verifying users...
✅ Total users in database: 4

Users in database:
  - laurie.bardare.fake@capyx.be (admin) - Active: True
  - tomma.vlaemynck.fake@capyx.be (employee) - Active: True
  - Guillaume.verhamme.fake@capyx.be (employee) - Active: True
  - tinael.devresse.fake@capyx.be (employee) - Active: True

=========================================
✅ INITIALIZATION COMPLETE!
=========================================

=========================================
🚀 BACKEND STARTING
=========================================
ENVIRONMENT: development
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/capyxperks
CORS_ORIGINS: *
=========================================

Testing database connection...
✅ Database connected! Users in database: 4
Sample users:
  - laurie.bardare.fake@capyx.be (admin)
  - tomma.vlaemynck.fake@capyx.be (employee)
  - Guillaume.verhamme.fake@capyx.be (employee)
  - tinael.devresse.fake@capyx.be (employee)

Starting Uvicorn web server...
```

### 3.2 Test the API

Test the dev users endpoint:

```bash
curl https://your-app.koyeb.app/api/auth/dev/users
```

**Expected response:**
```json
[
  {
    "email": "laurie.bardare.fake@capyx.be",
    "name": "Laurie Bardare",
    "role": "admin"
  },
  {
    "email": "tomma.vlaemynck.fake@capyx.be",
    "name": "Tomma Vlaemynck",
    "role": "employee"
  },
  {
    "email": "Guillaume.verhamme.fake@capyx.be",
    "name": "Guillaume Verhamme",
    "role": "employee"
  },
  {
    "email": "tinael.devresse.fake@capyx.be",
    "name": "Tinael Devresse",
    "role": "employee"
  }
]
```

### 3.3 Test Dev-Login Page

Visit: `https://your-app.koyeb.app/dev-login`

You should see **4 user cards** in the "Quick Login (Existing Users)" section.

---

## Troubleshooting

### Issue 1: API Returns 403 Forbidden

**Error:**
```json
{"detail": "Development endpoint disabled in production"}
```

**Solution:**
- Go to Koyeb service → Settings → Environment Variables
- Add/Update: `ENVIRONMENT=development`
- Redeploy the service

### Issue 2: API Returns Empty Array

**Error:**
```json
[]
```

**Causes:**
1. Database seeding failed during initialization
2. PostgreSQL wasn't ready when seeding ran

**Solution:**
1. Check Koyeb logs for errors during initialization
2. Look for "STEP 2: Seed database with users" in logs
3. Verify you see "✅ Successfully seeded database!"
4. If not, restart the service (it will reseed on startup)

### Issue 3: No Users in Logs

**Error in logs:**
```
⚠️  WARNING: No users found in database after seeding!
```

**Solution:**
1. Check if there are any Python errors in the logs
2. Verify the database connection string is correct
3. Check if PostgreSQL started successfully
4. Restart the service

### Issue 4: PostgreSQL Not Starting

**Error in logs:**
```
❌ PostgreSQL failed to start after 90 seconds
```

**Solution:**
1. This is a Koyeb resource issue
2. Try restarting the service
3. If it persists, consider upgrading to a larger Koyeb instance
4. Or migrate to a managed PostgreSQL database (see below)

---

## Important Notes ⚠️

### No Persistent Storage

**Current behavior:**
- ✅ Users appear on dev-login page
- ❌ **All data is wiped on every container restart**
- ❌ Orders, transactions, and user changes are lost on redeploy
- ❌ Any new users created will be lost

**This is OK for development/testing, but NOT for production!**

### For Production Deployment

If you want data to persist, you have two options:

#### Option 1: Koyeb Persistent Volumes (Coming Soon)

Koyeb is working on adding persistent volume support. Check their roadmap.

#### Option 2: Use External Database (Recommended)

Use a managed PostgreSQL database:

1. **Koyeb Managed Database** (when available)
2. **Supabase** (free tier available)
3. **Railway** (free tier available)
4. **Neon** (free tier available)
5. **AWS RDS** (paid)

To use an external database:

1. Create a PostgreSQL database on one of the services above
2. Get the connection URL (format: `postgresql://user:password@host:5432/dbname`)
3. In Koyeb, set environment variable:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```
4. **Remove PostgreSQL from Dockerfile** (edit `supervisord.conf` to remove the postgresql program)
5. Redeploy

---

## Files Modified

The following files were updated to fix the dev-login issue:

1. ✅ `init.sh` - Enhanced debugging, better error handling, verification step
2. ✅ `start-backend.sh` - Added database verification on startup
3. ✅ `Dockerfile` - Cache bust comment to force rebuild

---

## Quick Deployment Checklist

- [ ] Set `ENVIRONMENT=development` in Koyeb environment variables
- [ ] Set `SECRET_KEY=your-secret-key` in Koyeb environment variables
- [ ] Deploy to Koyeb (from GitHub or CLI)
- [ ] Wait for deployment to complete (~2-3 minutes)
- [ ] Check Koyeb logs for "✅ INITIALIZATION COMPLETE!"
- [ ] Test API: `curl https://your-app.koyeb.app/api/auth/dev/users`
- [ ] Visit dev-login page and verify 4 users appear

---

## Summary

The key issue was that:

1. **ENVIRONMENT** wasn't set to `development` → blocked the dev-login API
2. **No persistent storage** → database wiped on every restart
3. **No verification** → couldn't tell if seeding succeeded

The fix:

1. ✅ Set ENVIRONMENT=development in Koyeb
2. ✅ Force reseed on every startup
3. ✅ Added comprehensive logging and verification
4. ✅ Added error handling for timing issues

Now the app will **always** seed users on startup, and you can see exactly what's happening in the logs! 🎉

---

## Need Help?

If you're still having issues:

1. Share the Koyeb logs (look for the initialization section)
2. Share the response from `/api/auth/dev/users`
3. Share any errors you see in the browser console

Happy deploying! 🚀

