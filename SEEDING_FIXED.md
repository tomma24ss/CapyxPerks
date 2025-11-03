# Seeding Issue - FIXED

## Problem
Dev-login page only showed 1 admin user instead of 4 users (Laurie, Tomma, Guillaume, Tinael)

## Root Cause
**Duplicate seed files with different logic:**

1. `backend/seed_data.py` (OLD) ❌
   - Created only 1 admin user: `laurie.bardare@capyx.be`
   - Used old import structure: `from database import ...`

2. `backend/src/utils/seed_data.py` (CORRECT) ✅
   - Creates 4 users with `.fake` emails
   - Uses new import structure: `from src.core.database import ...`

The `init.sh` script tried to use the correct file, but had **mixed import paths** that caused conflicts.

## What Was Fixed

### 1. Deleted Duplicate Seed File
- ✅ Removed `backend/seed_data.py` (only created 1 admin)
- ✅ Kept `backend/src/utils/seed_data.py` (creates 4 users)

### 2. Fixed init.sh Imports
Changed from mixed imports to consistent `src.` structure:

**Before:**
```bash
python -c "from database import init_db; init_db()"  # OLD import
python -c "from src.utils.seed_data import seed_database; seed_database()"  # NEW import
```

**After:**
```bash
python -c "from src.core.database import init_db; init_db()"  # Consistent
python -c "from src.utils.seed_data import seed_database; seed_database()"  # Consistent
```

## What Gets Created Now

The seeding now correctly creates **4 users**:

1. **Laurie Bardare** (Admin)
   - Email: `laurie.bardare.fake@capyx.be`
   - Credits: 1000

2. **Tomma Vlaemynck** (Employee)
   - Email: `tomma.vlaemynck.fake@capyx.be`
   - Credits: 200

3. **Guillaume Verhamme** (Employee)
   - Email: `Guillaume.verhamme.fake@capyx.be`
   - Credits: 200

4. **Tinael Devresse** (Employee)
   - Email: `tinael.devresse.fake@capyx.be`
   - Credits: 200

## Deploy to Koyeb

```bash
cd /home/tomma/CapyxPerks
git push --force origin main
```

**Note:** Using `--force` because we reverted to an older commit and then fixed it.

## After Deployment

### If users still don't appear:
The database might already have data from the old seeding. Two options:

**Option 1: Delete Database Volume (Clean)**
1. Go to Koyeb Dashboard
2. Delete persistent volume: `/var/lib/postgresql/data`
3. Redeploy - fresh database will be seeded automatically

**Option 2: Manual Clear & Reseed (Quick)**
In Koyeb console:
```bash
cd /app/backend && python -c "
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
"
```

## Verify It Worked

1. **Check API endpoint:**
   ```bash
   curl https://your-app.koyeb.app/api/auth/dev/users
   ```
   Should return 4 users

2. **Check dev-login page:**
   Visit: `https://your-app.koyeb.app/dev-login`
   Should see "Quick Login (Existing Users)" with 4 user cards

3. **Check Koyeb logs:**
   Look for:
   ```
   Seeding database with sample users...
   ✅ Successfully seeded database!
      - Created 4 users
   📧 Capyx Team Users:
      - Admin: laurie.bardare.fake@capyx.be (1000 credits)
      - Employee: tomma.vlaemynck.fake@capyx.be (200 credits)
      - Employee: Guillaume.verhamme.fake@capyx.be (200 credits)
      - Employee: tinael.devresse.fake@capyx.be (200 credits)
   ```

## Summary
✅ Removed duplicate seed file  
✅ Fixed import inconsistencies  
✅ Now creates 4 users instead of 1  
✅ Ready to deploy

