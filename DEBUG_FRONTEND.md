# Frontend Debugging Guide 🐛

## Current Status

✅ **Backend is working perfectly:**
- Users are being seeded successfully (all 4 users created)
- API endpoint `/api/auth/dev/users` returns 200 OK
- Environment is set to `development`
- Database schema is correct

❌ **Frontend not displaying users**

## What I Added for Debugging

### 1. Console Logging
Added extensive logging in:
- `frontend/src/api/client.ts` - Shows the API base URL
- `frontend/src/api/api.ts` - Logs the API call and response
- `frontend/src/pages/DevLoginPage.tsx` - Logs fetched users and errors

### 2. Test Page
Created `frontend/public/test-api.html` - A simple HTML page to test the API directly without React

### 3. CORS Fix
Fixed CORS to allow all origins in development mode (in `backend/main.py`)

## How to Debug After Next Deployment

### Step 1: Deploy
```bash
cd /home/tomma/CapyxPerks
git commit -m "Add frontend debugging and CORS fix"
git push origin main
```

### Step 2: Test the API Directly
Visit: `https://your-app.koyeb.app/test-api.html`

Click "Fetch Users" button. You should see:
```json
[
  {
    "email": "laurie.bardare.fake@capyx.be",
    "name": "Laurie Bardare",
    "role": "admin"
  },
  ...
]
```

**If this works:** The API is fine, problem is in React code  
**If this fails:** There's a nginx/CORS/network issue

### Step 3: Check Browser Console
Visit: `https://your-app.koyeb.app/dev-login`

Open browser DevTools (F12) and check the Console tab. You should see:
```
API Client initialized with baseURL: 
Calling /api/auth/dev/users...
Response from /api/auth/dev/users: [...]
Response type: object Is array? true
Fetched users: [...]
```

### Step 4: Check Network Tab
In DevTools, go to Network tab:
1. Refresh the page
2. Find the request to `/api/auth/dev/users`
3. Check:
   - **Status:** Should be 200
   - **Response:** Should show the 4 users
   - **Headers:** Check if CORS headers are present

## Possible Issues

### Issue 1: Browser Cache
**Symptom:** Old version of frontend still loading  
**Fix:** Hard refresh (Ctrl+Shift+R) or clear browser cache

### Issue 2: CORS Blocking
**Symptom:** Console shows CORS error  
**Fix:** Already added CORS fix in main.py (allows all origins in dev)

### Issue 3: API Base URL Wrong
**Symptom:** Console shows "API Client initialized with baseURL: http://localhost:8000"  
**Fix:** Should be empty string (for relative paths)

### Issue 4: Response Format Mismatch
**Symptom:** Console shows data but users not displayed  
**Fix:** Check if response.data is actually an array

### Issue 5: React Component Not Re-rendering
**Symptom:** Console logs data but UI doesn't update  
**Fix:** Check if `setExistingUsers` is being called

## Expected Console Output

When you visit `/dev-login`, you should see:

```
API Client initialized with baseURL: 
Calling /api/auth/dev/users...
Response from /api/auth/dev/users: Array(4)
  0: {email: "laurie.bardare.fake@capyx.be", name: "Laurie Bardare", role: "admin"}
  1: {email: "tomma.vlaemynck.fake@capyx.be", name: "Tomma Vlaemynck", role: "employee"}
  2: {email: "Guillaume.verhamme.fake@capyx.be", name: "Guillaume Verhamme", role: "employee"}
  3: {email: "tinael.devresse.fake@capyx.be", name: "Tinael Devresse", role: "employee"}
Response type: object Is array? true
Fetched users: (4) [{…}, {…}, {…}, {…}]
```

## Next Steps

1. **Deploy with debugging enabled**
2. **Visit `/test-api.html` first** - This will tell us if the API works at all
3. **Check browser console** - This will show us exactly what's happening
4. **Report back with:**
   - What you see in `/test-api.html`
   - What you see in browser console
   - Any errors in the console
   - Screenshot if possible

Then I can pinpoint the exact issue and fix it!

## Quick Checklist

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check `/test-api.html` works
- [ ] Check browser console for logs
- [ ] Check Network tab shows 200 OK
- [ ] Check response contains 4 users
- [ ] Check for any CORS errors
- [ ] Check for any JavaScript errors

