# Environment Variables Setup Guide

This guide explains how to configure environment variables for the CapyxPerks application.

## Quick Start

1. Create a `.env` file in the project root:
   ```bash
   cd /root/CapyxPerks
   touch .env
   ```

2. Add your configuration (copy from the example below):
   ```bash
   # Demo Password Protection
   DEMO_PASSWORD=capyx2024

   # Azure AD (Optional - only needed for Azure AD authentication)
   # AZURE_AD_CLIENT_ID=your-client-id
   # AZURE_AD_CLIENT_SECRET=your-client-secret
   # AZURE_AD_TENANT_ID=your-tenant-id
   # AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
   ```

3. Restart the application:
   ```bash
   docker compose down
   docker compose up -d
   ```

## Available Environment Variables

### DEMO_PASSWORD
- **Purpose:** Password for the demo access gate
- **Default:** `capyx2024`
- **Where it's used:** Frontend password gate, available via `/api/demo/password` endpoint
- **How to change:** Set in `.env` file or directly in `docker-compose.yml`

### AZURE_AD_CLIENT_ID
- **Purpose:** Azure Active Directory application client ID
- **Default:** Empty (optional)
- **Required for:** Azure AD authentication

### AZURE_AD_CLIENT_SECRET
- **Purpose:** Azure Active Directory application client secret
- **Default:** Empty (optional)
- **Required for:** Azure AD authentication

### AZURE_AD_TENANT_ID
- **Purpose:** Azure Active Directory tenant ID
- **Default:** Empty (optional)
- **Required for:** Azure AD authentication

### AZURE_AD_AUTHORITY
- **Purpose:** Azure Active Directory authority URL
- **Default:** Empty (optional)
- **Required for:** Azure AD authentication
- **Format:** `https://login.microsoftonline.com/{tenant-id}`

## Environment Variable Priority

The application reads environment variables in this order:
1. `.env` file in project root (if exists)
2. Default values in `docker-compose.yml`
3. Hardcoded defaults in the application code

## Security Best Practices

✅ **DO:**
- Keep `.env` file out of version control (it's in `.gitignore`)
- Use strong, unique passwords
- Change default passwords in production
- Use HTTPS in production environments
- Restrict file permissions on `.env`: `chmod 600 .env`

❌ **DON'T:**
- Commit `.env` files to Git
- Share your `.env` file publicly
- Use weak or default passwords in production
- Store sensitive credentials in plain text in production

## Checking Current Configuration

To verify your current environment variables in the running container:

```bash
# Check backend environment
docker exec capyxperks-backend env | grep -E "DEMO_PASSWORD|AZURE"

# Test demo password API
curl http://localhost:8000/api/demo/password
```

## Troubleshooting

**Problem:** Changes to `.env` not taking effect
- **Solution:** Restart containers with `docker compose down && docker compose up -d`

**Problem:** Cannot find `.env` file
- **Solution:** Create it in `/root/CapyxPerks/.env` (same directory as `docker-compose.yml`)

**Problem:** Password gate showing wrong password
- **Solution:** Clear browser localStorage or use incognito mode to test new password

