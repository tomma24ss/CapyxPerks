# 🚀 Deploy Now - Step by Step Instructions

## What Just Happened

I've fixed the dev-login issue where users weren't appearing on Koyeb. The problem was:

1. **ENVIRONMENT variable not set to "development"** on Koyeb
2. **Insufficient logging** - couldn't see what was failing
3. **Timing issues** - PostgreSQL might not be fully ready

## What I Changed

✅ Enhanced `init.sh` with:
- Better debugging and verification
- Longer wait times for PostgreSQL
- Step-by-step logging
- User verification after seeding

✅ Enhanced `start-backend.sh` with:
- Database connection verification
- Lists users before starting server
- Shows all environment variables

✅ Updated `Dockerfile` with:
- Cache bust to force rebuild
- Better comments

✅ Created documentation:
- `KOYEB_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `FIX_SUMMARY.md` - Detailed explanation of fixes
- `QUICK_FIX_GUIDE.md` - Quick reference
- `DEPLOY_INSTRUCTIONS.md` - This file

---

## 🎯 DEPLOY NOW

### Step 1: Set Environment Variable in Koyeb (CRITICAL!)

**You MUST do this or it won't work!**

1. Go to [Koyeb Dashboard](https://app.koyeb.com)
2. Select your **CapyxPerks** service
3. Click **Settings**
4. Go to **Environment Variables** section
5. Click **+ Add variable** or **Edit**
6. Add this variable:
   ```
   Name:  ENVIRONMENT
   Value: development
   ```
7. Click **Update service** or **Save**

**Why this is critical:**

The `/api/auth/dev/users` endpoint checks:
```python
if settings.environment == "production":
    raise HTTPException(status_code=403, detail="Development endpoint disabled in production")
```

Without `ENVIRONMENT=development`, the API returns **403 Forbidden** and no users will show!

### Step 2: Commit and Push Changes

```bash
cd /home/tomma/CapyxPerks

# Add all changes
git add .

# Commit with a clear message
git commit -m "Fix: Enhanced Koyeb deployment with debugging and verification

- Enhanced init.sh with detailed logging and user verification
- Enhanced start-backend.sh to verify database before starting
- Updated Dockerfile with cache bust
- Added comprehensive deployment guides
- Fixes dev-login not showing users on Koyeb"

# Push to GitHub (Koyeb will auto-deploy)
git push origin main
```

### Step 3: Monitor Deployment

1. Go to Koyeb dashboard
2. Click on your service
3. Go to **Deployments** tab
4. Wait for the new deployment to show status **Healthy** (~2-3 minutes)

### Step 4: Check Logs

1. Go to **Logs** tab in Koyeb
2. Look for these key sections (in order):

```
=========================================
CAPYX PERKS - DATABASE INITIALIZATION
=========================================
Current ENVIRONMENT: development    ← MUST say "development"!
```

```
=========================================
STEP 1: Initialize database schema
=========================================
✅ Database schema initialized - all tables created
```

```
=========================================
STEP 2: Seed database with users
=========================================
✅ Successfully seeded database!
   - Created 4 users
```

```
✅ Total users in database: 4

Users in database:
  - laurie.bardare.fake@capyx.be (admin) - Active: True
  - tomma.vlaemynck.fake@capyx.be (employee) - Active: True
  - Guillaume.verhamme.fake@capyx.be (employee) - Active: True
  - tinael.devresse.fake@capyx.be (employee) - Active: True
```

```
🚀 BACKEND STARTING
ENVIRONMENT: development    ← MUST say "development"!
✅ Database connected! Users in database: 4
```

### Step 5: Test the API

Replace `your-app.koyeb.app` with your actual Koyeb URL:

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

**If you get 403 error:** ENVIRONMENT variable not set! Go back to Step 1.

**If you get empty array `[]`:** Check logs for seeding errors.

### Step 6: Test Dev-Login Page

Visit: `https://your-app.koyeb.app/dev-login`

**Expected result:**
- You should see 4 user cards in the "Quick Login (Existing Users)" section
- Each card shows name, email, and role
- You can click on any user to log in as them

---

## 🎉 Success Criteria

You'll know it's working when:

✅ Koyeb logs show "Current ENVIRONMENT: development"
✅ Koyeb logs show "✅ Successfully seeded database!"
✅ Koyeb logs show "✅ Total users in database: 4"
✅ API endpoint returns 4 users (not 403 error)
✅ Dev-login page displays 4 user cards
✅ You can click a user card and log in

---

## 🐛 If Something Goes Wrong

### Error: 403 Forbidden from API

**Problem:** ENVIRONMENT is not set to "development"

**Solution:**
1. Go to Koyeb → Settings → Environment Variables
2. Add/Update: `ENVIRONMENT=development`
3. Save and wait for redeploy

### Error: Empty array `[]` from API

**Problem:** Users not being seeded

**Solution:**
1. Check Koyeb logs for errors in "STEP 2: Seed database"
2. Look for any Python tracebacks
3. Restart the service (it will reseed on startup)

### Error: No detailed logs visible

**Problem:** Old code still deployed

**Solution:**
1. Verify you committed and pushed all changes
2. Check Dockerfile cache bust comment says: `# Cache bust: 2025-11-03-v5-fix-seeding`
3. Force rebuild in Koyeb dashboard

---

## 📊 What Logs Should Look Like

### ✅ Good Logs (Everything Working)

```
=========================================
CAPYX PERKS - DATABASE INITIALIZATION
=========================================
Current ENVIRONMENT: development
=========================================

✅ PostgreSQL is ready! (attempt 1)
✅ PostgreSQL initialized successfully
✅ Redis is ready! (attempt 1)

=========================================
STEP 1: Initialize database schema
=========================================
Importing models...
✅ Models imported successfully
✅ Database schema initialized - all tables created

=========================================
STEP 2: Seed database with users
=========================================
✅ Database and models imported
✅ Cleared existing data
🌱 Seeding database with 4 users...
✅ Successfully seeded database!
   - Created 4 users

✅ Total users in database: 4
Users in database:
  - laurie.bardare.fake@capyx.be (admin) - Active: True
  - tomma.vlaemynck.fake@capyx.be (employee) - Active: True
  - Guillaume.verhamme.fake@capyx.be (employee) - Active: True
  - tinael.devresse.fake@capyx.be (employee) - Active: True

=========================================
✅ INITIALIZATION COMPLETE!
=========================================

🚀 BACKEND STARTING
ENVIRONMENT: development
✅ Database connected! Users in database: 4
```

### ❌ Bad Logs (Something Wrong)

**If ENVIRONMENT is wrong:**
```
Current ENVIRONMENT: production    ← WRONG! Should be "development"
```

**If PostgreSQL fails:**
```
❌ PostgreSQL failed to start after 90 seconds
```

**If seeding fails:**
```
❌ Error seeding database: [error message]
```

**If no users found:**
```
⚠️  WARNING: No users found in database after seeding!
```

---

## 🔧 Advanced: Testing Locally First

If you want to test before deploying to Koyeb:

```bash
cd /home/tomma/CapyxPerks

# Build the Docker image
docker build -t capyxperks-test .

# Run it
docker run -d \
  --name capyxperks-test \
  -p 8080:80 \
  -e ENVIRONMENT=development \
  -e SECRET_KEY=test-key \
  capyxperks-test

# Wait 60 seconds for initialization
sleep 60

# Check logs
docker logs capyxperks-test

# Test API
curl http://localhost:8080/api/auth/dev/users

# Visit in browser
# http://localhost:8080/dev-login

# Clean up
docker stop capyxperks-test
docker rm capyxperks-test
```

---

## 📚 Documentation Reference

| File | Purpose |
|------|---------|
| `QUICK_FIX_GUIDE.md` | Quick reference for the fix |
| `KOYEB_DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide with troubleshooting |
| `FIX_SUMMARY.md` | Detailed explanation of what was fixed and why |
| `DEPLOY_INSTRUCTIONS.md` | This file - step-by-step deployment |

---

## 💡 Key Takeaways

1. **ENVIRONMENT=development is CRITICAL** - Without it, dev-login API returns 403
2. **Koyeb has no persistent storage** - Database is reseeded on every restart
3. **Enhanced logging** - Now you can see exactly what's happening
4. **Verification steps** - Scripts verify users were created successfully
5. **Better error handling** - Scripts will fail fast if something goes wrong

---

## 🚀 Ready to Deploy?

Run these commands now:

```bash
cd /home/tomma/CapyxPerks
git add .
git commit -m "Fix: Enhanced Koyeb deployment with debugging and verification"
git push origin main
```

Then:
1. ✅ Set `ENVIRONMENT=development` in Koyeb
2. ✅ Wait for deployment to complete
3. ✅ Check the logs
4. ✅ Test the API
5. ✅ Visit dev-login page

**You'll have users showing up in 3 minutes!** 🎉

---

## ⚠️ Remember

**Data is NOT persistent on Koyeb** with this setup. Every restart/redeploy wipes the database and reseeds 4 users.

For production with persistent data, see `KOYEB_DEPLOYMENT_GUIDE.md` section on using external databases.

---

## Need Help?

If it's still not working after following these steps:

1. Share the Koyeb logs (copy the full initialization section)
2. Share the response from `curl https://your-app.koyeb.app/api/auth/dev/users`
3. Verify `ENVIRONMENT=development` is set in Koyeb environment variables

Good luck! 🍀

