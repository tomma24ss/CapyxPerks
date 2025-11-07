# Demo Password Configuration

The CapyxPerks demo site is protected by a password gate that appears before users can access any content.

## Current Password

**Default Password:** `capyx2024`

## How to Change the Password

There are two ways to change the demo password:

### Option 1: Using Environment Variable (Recommended)

1. Create a `.env` file in the project root (`/root/CapyxPerks/.env`) with:
   ```bash
   DEMO_PASSWORD=your-new-password-here
   ```

2. Restart the containers:
   ```bash
   cd /root/CapyxPerks
   docker compose down
   docker compose up -d
   ```

### Option 2: Direct Configuration in docker-compose.yml

1. Edit `docker-compose.yml` and change the `DEMO_PASSWORD` line in the backend environment section:
   ```yaml
   environment:
     DEMO_PASSWORD: your-new-password-here
   ```

2. Restart the containers:
   ```bash
   cd /root/CapyxPerks
   docker compose down
   docker compose up -d
   ```

## How It Works

- The password is stored as an environment variable in the backend (`DEMO_PASSWORD`)
- The frontend fetches the password from the API endpoint `/api/demo/password`
- When users visit the site, they must enter the correct password
- The authentication is stored in the browser's `localStorage` and persists until the user clears their browser data
- If users want to logout from the demo access, they need to clear their browser's localStorage or use incognito mode

## Security Notes

⚠️ **Important:** This is a simple password gate for demo/testing purposes only. It is NOT suitable for production use because:
- The password is transmitted in plain text (use HTTPS in production)
- The password is accessible via a public API endpoint
- There's no rate limiting or brute force protection
- Authentication is stored in localStorage (not secure cookies)

For production environments, implement proper authentication with:
- HTTPS/TLS encryption
- Secure session management
- Rate limiting
- Password hashing
- Proper authentication middleware

