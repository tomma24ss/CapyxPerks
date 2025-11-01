# Fix: Koyeb Showing API Instead of Frontend

## Problem
You're seeing `{"app":"CapyxPerks API",...}` instead of the React frontend.

## Cause
Koyeb is routing to port 8000 (backend) instead of port 80 (nginx/frontend).

## Solution Options

### Option 1: Update Port in Koyeb (Quickest)

1. Go to your Koyeb service
2. Click **Settings** or **Edit Service**
3. Find **Port** or **Expose** setting
4. Change from `8000` to **`80`**
5. Click **Update** or **Redeploy**
6. Wait for deployment to complete

### Option 2: Rebuild with Dynamic Port (Already Done)

The code has been updated to automatically detect Koyeb's PORT environment variable.

**To apply:**
```bash
git add .
git commit -m "Add dynamic port support for Koyeb"
git push
```

Koyeb will automatically rebuild and deploy.

## Verification

After the fix, visiting your Koyeb URL should show:
- ✅ React frontend (HTML page)
- ✅ API at `/api/*`
- ✅ API docs at `/docs`

## Check Current Setup

In Koyeb, look at:
- **Environment Variables**: Check if `PORT` is set (if yes, note the value)
- **Expose Port**: Should be set to `80` (or the PORT env var value)

## Still Not Working?

Check the logs in Koyeb:
```
# Look for these lines:
Starting Nginx on port 80...
Nginx configuration updated to listen on port 80
```

If you don't see Nginx starting, there may be another issue.
