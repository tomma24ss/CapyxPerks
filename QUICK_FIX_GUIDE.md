# 🚨 Quick Fix: Dev-Login Not Working on Koyeb

## The Problem
Can't see users in dev-login on Koyeb deployment.

## The Root Cause
**ENVIRONMENT variable is not set to "development" in Koyeb!**

Without this, the API endpoint `/api/auth/dev/users` returns **403 Forbidden**.

---

## ⚡ Quick Fix (Do This Now!)

### Step 1: Set Environment Variable in Koyeb

1. Go to [Koyeb Dashboard](https://app.koyeb.com)
2. Click on your **CapyxPerks** service
3. Go to **Settings** → **Environment Variables**
4. Click **+ Add variable**
5. Add:
   - **Name:** `ENVIRONMENT`
   - **Value:** `development`
6. Click **Update service** / **Save**

### Step 2: Deploy Updated Code

```bash
cd /home/tomma/CapyxPerks
git add .
git commit -m "Fix: Enhanced debugging and verification for Koyeb deployment"
git push origin main
```

### Step 3: Wait and Verify

Wait ~2-3 minutes for Koyeb to rebuild and deploy.

**Then test:**

```bash
# Replace with your actual Koyeb URL
curl https://your-app.koyeb.app/api/auth/dev/users
```

**Expected result:** Should return 4 users (not 403)

**Visit:** `https://your-app.koyeb.app/dev-login`

**Expected result:** Should show 4 user cards

---

## 📊 What I Fixed

✅ **Enhanced init.sh**
   - Better error handling
   - Longer wait times for PostgreSQL (90s)
   - Verification step that lists users
   - Detailed logging at every step

✅ **Enhanced start-backend.sh**
   - Shows environment variables
   - Tests database connection before starting
   - Lists users before server starts

✅ **Updated Dockerfile**
   - Force rebuild with cache bust
   - Added reminder comments

✅ **Created guides**
   - KOYEB_DEPLOYMENT_GUIDE.md (comprehensive guide)
   - FIX_SUMMARY.md (detailed explanation)
   - QUICK_FIX_GUIDE.md (this file)

---

## 🔍 How to Diagnose

### Check Koyeb Logs

Go to Koyeb → Your Service → **Logs**

**Look for these sections:**

#### 1. Initialization Log (Should see this first)
```
=========================================
CAPYX PERKS - DATABASE INITIALIZATION
=========================================
Current ENVIRONMENT: development    ← Must say "development"!
```

#### 2. Database Seeding (Should see users created)
```
=========================================
STEP 2: Seed database with users
=========================================
✅ Successfully seeded database!
   - Created 4 users
```

#### 3. Verification (Should see 4 users listed)
```
✅ Total users in database: 4

Users in database:
  - laurie.bardare.fake@capyx.be (admin) - Active: True
  - tomma.vlaemynck.fake@capyx.be (employee) - Active: True
  - Guillaume.verhamme.fake@capyx.be (employee) - Active: True
  - tinael.devresse.fake@capyx.be (employee) - Active: True
```

#### 4. Backend Starting (Should see users before server starts)
```
🚀 BACKEND STARTING
ENVIRONMENT: development    ← Must say "development"!

✅ Database connected! Users in database: 4
Sample users:
  - laurie.bardare.fake@capyx.be (admin)
  - tomma.vlaemynck.fake@capyx.be (employee)
```

---

## 🐛 Troubleshooting

### Problem: API returns 403 Forbidden
```json
{"detail": "Development endpoint disabled in production"}
```

**Cause:** ENVIRONMENT is not set to "development"

**Fix:**
1. Go to Koyeb → Settings → Environment Variables
2. Add: `ENVIRONMENT=development`
3. Save and redeploy

---

### Problem: API returns empty array `[]`

**Cause:** Users aren't being seeded

**Diagnosis:**
1. Check Koyeb logs for "STEP 2: Seed database with users"
2. Look for any error messages
3. Check if verification shows "Total users: 0"

**Fix:**
1. Restart the Koyeb service (it will reseed on startup)
2. If still failing, check logs for Python errors

---

### Problem: No logs visible

**Cause:** Old deployment without logging fixes

**Fix:**
1. Make sure you've pushed the latest code
2. Force rebuild in Koyeb
3. Check that cache bust comment changed in Dockerfile

---

## 📚 More Help

- **Comprehensive guide:** See `KOYEB_DEPLOYMENT_GUIDE.md`
- **Detailed explanation:** See `FIX_SUMMARY.md`
- **Older fixes:** See `USER_SEEDING_COMPLETE_FIX.md`

---

## ✅ Checklist

Use this to verify everything:

- [ ] Set `ENVIRONMENT=development` in Koyeb environment variables
- [ ] Committed and pushed the updated code
- [ ] Koyeb deployment finished successfully
- [ ] Checked logs show "Current ENVIRONMENT: development"
- [ ] Checked logs show "✅ Successfully seeded database!"
- [ ] Checked logs show "✅ Total users in database: 4"
- [ ] Tested API: `curl https://your-app.koyeb.app/api/auth/dev/users`
- [ ] Visited dev-login page and see 4 user cards

---

## 🎯 Bottom Line

**The most important thing: Set ENVIRONMENT=development in Koyeb!**

Everything else is just better logging to help you see what's happening.

After setting the environment variable and deploying the updated code, it **will work**! 🚀

