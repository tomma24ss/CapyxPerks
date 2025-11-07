# Demo Password Protection - CapyxPerks

## ✅ Password Gate Activated!

Your site is now protected with a password screen. **No one can access anything** without entering the correct password first.

---

## 🔐 Demo Password

**Current Password:**
```
capyx2024
```

**Share this password only with:**
- Company employees
- Demo participants
- Authorized personnel

---

## How It Works

### Before Password:
1. User visits: http://91.98.232.200/
2. **Sees password screen immediately**
3. Cannot access any pages (dev-login, products, admin, etc.)
4. Beautiful branded lock screen with Capyx colors

### After Correct Password:
1. User enters: `capyx2024`
2. Password saved in browser (localStorage)
3. Full access to the site
4. Can navigate to all pages
5. Password persists until browser data is cleared

---

## What's Protected?

**Everything is protected:**
- ✅ Homepage
- ✅ Dev-Login page
- ✅ Product pages
- ✅ Admin dashboard
- ✅ Shopping cart
- ✅ All routes

**No one can see ANY content without the password!**

---

## Changing the Password

To change the password, edit this file:
```
/root/CapyxPerks/frontend/src/components/DemoPasswordGate.tsx
```

Find this line (line 3):
```typescript
const DEMO_PASSWORD = 'capyx2024' // Change this to your desired password
```

Change it to your new password:
```typescript
const DEMO_PASSWORD = 'YourNewPassword123'
```

Then rebuild:
```bash
cd /root/CapyxPerks
docker compose build frontend
docker compose up -d frontend
```

---

## Removing the Password Gate (For Production)

If you want to remove the password gate later, edit:
```
/root/CapyxPerks/frontend/src/App.tsx
```

Remove the `<DemoPasswordGate>` wrapper:

**Before:**
```typescript
return (
  <DemoPasswordGate>
    <div className="min-h-screen bg-gray-50">
      ...
    </div>
  </DemoPasswordGate>
)
```

**After:**
```typescript
return (
  <div className="min-h-screen bg-gray-50">
    ...
  </div>
)
```

---

## Testing the Password Gate

### Test 1: Wrong Password
1. Visit: http://91.98.232.200/
2. Enter: `wrongpassword`
3. Result: ❌ "Incorrect password" error message
4. Field clears automatically

### Test 2: Correct Password
1. Visit: http://91.98.232.200/
2. Enter: `capyx2024`
3. Result: ✅ Access granted → Redirected to site

### Test 3: Persistent Login
1. Enter correct password once
2. Close browser tab
3. Open http://91.98.232.200/ again
4. Result: ✅ Automatically logged in (no password needed)

### Test 4: Clear Browser Data
1. Clear browser data/cookies
2. Visit: http://91.98.232.200/
3. Result: 🔒 Password screen appears again

---

## Share Instructions with Your Team

**Email Template:**

```
Subject: CapyxPerks Demo Access

Hi team,

The CapyxPerks demo is now available at:
http://91.98.232.200/

Demo Access Password: capyx2024

This is a test/demo environment - please keep the password confidential.

After entering the password, you'll have full access to:
- Browse company perks
- Test the shopping experience
- View your credit balance
- Admin dashboard (for admins)

For any questions, contact IT.

Best regards,
[Your Name]
```

---

## Security Notes

### Current Setup (Good for Demo):
- ✅ Simple password gate
- ✅ Password stored in browser
- ✅ Good for internal demos/testing
- ✅ Easy to share with team

### For Production (Recommended):
- 🔒 Use proper authentication (Azure AD)
- 🔒 Individual user accounts
- 🔒 Role-based access control
- 🔒 HTTPS/SSL encryption
- 🔒 Audit logging

---

## Troubleshooting

### "I can't access the site"
→ Enter the password: `capyx2024`

### "I entered the password but it doesn't work"
→ Check for typos (case-sensitive)
→ Password is: `capyx2024` (all lowercase)

### "I was logged in, now it's asking for password again"
→ Browser data was cleared
→ Enter password again: `capyx2024`

### "I want to log out"
→ Clear browser data/cookies
→ Or: Open browser's Developer Console (F12)
→ Run: `localStorage.clear()`
→ Refresh page

---

## Demo URLs

All these URLs will show the password gate:

- **Primary**: http://91.98.232.200/
- **DNS**: http://capyxperks.duckdns.org/ (when DNS works)
- **With Port**: http://91.98.232.200:3001/

**Password for all**: `capyx2024`

---

## Current Status

✅ **Password gate is ACTIVE**
✅ **Password**: `capyx2024`
✅ **All pages protected**
✅ **Beautiful branded lock screen**
✅ **Persistent login**
✅ **Ready for demo!**

---

**Last Updated**: November 3, 2025

