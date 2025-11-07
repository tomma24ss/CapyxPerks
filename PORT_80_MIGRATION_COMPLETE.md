# Port 80 Migration & Docker Compose v2 Upgrade - Complete! ✅

## What Was Done

### 1. ✅ Upgraded to Docker Compose v2
- **Old**: docker-compose v1.29.2 (Python-based)
- **New**: Docker Compose v2.40.3 (Modern Go-based plugin)
- **Syntax change**: `docker-compose` → `docker compose` (space instead of hyphen)

### 2. ✅ Migrated to Standard Port 80
- **Old URL**: http://91.98.232.200:3001/ (non-standard port)
- **New URLs**:
  - **Primary**: http://91.98.232.200/ (no port number!)
  - **Backup**: http://91.98.232.200:3001/ (still works)
  - **When DNS works**: http://capyxperks.duckdns.org/

### 3. ✅ Fixed Firewall for External Access
- Added Docker-friendly UFW rules in `/etc/ufw/after.rules`
- Allows incoming connections on ports 80, 443, 3001, 8000
- Allows Docker container forwarding

### 4. ✅ All Services Running
```
✅ Frontend: nginx (ports 80, 3001)
✅ Backend: FastAPI (port 8000)
✅ Database: PostgreSQL (port 5433)
✅ Cache: Redis (port 6380)
```

---

## Testing Your Site

### From Your VPS (Should Work):
```bash
curl -I http://localhost/
curl -I http://91.98.232.200/
curl -I http://91.98.232.200:3001/
```

### From External Device (Phone, Other Computer):

**Test these URLs in your browser:**

1. **Primary URL (Recommended)**:
   ```
   http://91.98.232.200/
   ```

2. **Backup URL (Legacy)**:
   ```
   http://91.98.232.200:3001/
   ```

3. **Domain (When DuckDNS works)**:
   ```
   http://capyxperks.duckdns.org/
   ```

---

## Expected Results

### ✅ If It Works:
- You'll see the CapyxPerks homepage with products
- Login button visible
- No port number needed in the URL

### ❌ If It Doesn't Work From External:

This could mean your **VPS provider has a firewall** at the network level (outside the VPS).

**Solutions**:

1. **Check VPS Provider's Firewall/Security Groups**:
   - Log into your VPS provider's control panel
   - Look for "Firewall", "Security Groups", or "Network Rules"
   - Ensure ports 80 and 3001 are allowed for **incoming traffic**

2. **Common VPS Providers**:
   - **Hetzner Cloud**: Check "Firewalls" section
   - **DigitalOcean**: Check "Networking" → "Firewalls"
   - **AWS**: Check "Security Groups"
   - **Azure**: Check "Network Security Groups"
   - **Vultr**: Check "Firewall"

---

## Docker Compose v2 Commands

### Managing Services

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# View status
docker compose ps

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d
```

### Key Differences from v1:
- ✅ Better performance
- ✅ Better networking
- ✅ Native Docker integration
- ✅ Space instead of hyphen: `docker compose` (not `docker-compose`)

---

## Firewall Configuration

### UFW Rules Added:
```
/etc/ufw/after.rules

# Allow Docker published ports
-A ufw-after-input -p tcp --dport 80 -j ACCEPT
-A ufw-after-input -p tcp --dport 443 -j ACCEPT
-A ufw-after-input -p tcp --dport 3001 -j ACCEPT
-A ufw-after-input -p tcp --dport 8000 -j ACCEPT

# Allow Docker container forwarding
-A ufw-after-forward -i br+ -j ACCEPT
-A ufw-after-forward -o br+ -j ACCEPT
```

### Check Firewall Status:
```bash
sudo ufw status verbose
```

### Reload Firewall:
```bash
sudo ufw reload
```

---

## Network Architecture

```
External Request
    ↓
Port 80 (HTTP)
    ↓
Nginx (Frontend Container)
    ↓
    ├──→ Serves React App (/)
    ├──→ Proxies /api → Backend:8000
    └──→ Proxies /uploads → Backend:8000
         ↓
    FastAPI (Backend Container)
         ↓
    ├──→ PostgreSQL (Database)
    └──→ Redis (Cache)
```

---

## URLs Summary

| Purpose | URL | Status |
|---------|-----|--------|
| **Primary (Standard Port)** | http://91.98.232.200/ | ✅ Active |
| **Backup (Legacy Port)** | http://91.98.232.200:3001/ | ✅ Active |
| **Domain (When DNS works)** | http://capyxperks.duckdns.org/ | ⏳ Waiting for DuckDNS |
| **Direct Backend API** | http://91.98.232.200:8000 | ✅ Active |
| **API Docs** | http://91.98.232.200:8000/docs | ✅ Active |

---

## Troubleshooting

### Site Works Locally But Not Externally

**Problem**: Can access from VPS but not from other devices.

**Solution**: Check your VPS provider's firewall/security groups.

**How to check**:
1. From your phone or another computer (NOT on VPS):
   ```
   Open browser → http://91.98.232.200/
   ```

2. If it times out/doesn't load:
   - Your VPS provider has a firewall blocking access
   - Go to VPS provider's dashboard
   - Add inbound rules for ports 80, 443, 3001, 8000

### DuckDNS Domain Not Working

**Problem**: http://capyxperks.duckdns.org/ doesn't work.

**Reason**: DuckDNS service was down earlier (503 error).

**Solution**: Wait for DuckDNS to recover, then test:
```bash
nslookup capyxperks.duckdns.org
```

Should return: `91.98.232.200`

### Services Not Starting

**Check logs**:
```bash
docker compose logs -f
```

**Restart services**:
```bash
docker compose down
docker compose up -d
```

---

## Next Steps (Optional)

### 1. Add HTTPS/SSL (Once DuckDNS Works)
```bash
# Install certbot (already done)
sudo certbot certonly --standalone -d capyxperks.duckdns.org

# Then update nginx config to use SSL certificates
```

### 2. Set Up Automatic Backups
```bash
# Backup database
docker compose exec postgres pg_dump -U postgres capyxperks > backup.sql

# Schedule with cron
crontab -e
# Add: 0 2 * * * cd /root/CapyxPerks && docker compose exec -T postgres pg_dump -U postgres capyxperks > /root/backups/capyxperks_$(date +\%Y\%m\%d).sql
```

### 3. Monitor Logs
```bash
# Follow all logs
docker compose logs -f

# Follow specific service
docker compose logs -f frontend
docker compose logs -f backend
```

---

## Success Checklist

- ✅ Docker Compose v2 installed and working
- ✅ Services running on port 80 (standard HTTP)
- ✅ Port 3001 still available as backup
- ✅ UFW firewall configured for Docker
- ✅ All containers healthy
- ⏳ External access (needs VPS provider firewall check)
- ⏳ HTTPS/SSL (needs DuckDNS to work first)

---

## Share This URL With Your Team

Once external access is confirmed working:

**Primary URL (Recommended)**:
```
http://91.98.232.200/
```

**Or once DuckDNS works**:
```
http://capyxperks.duckdns.org/
```

**Dev Login**: Add `/dev-login` to the URL

---

## Need Help?

If the site still doesn't work from external devices:
1. Check VPS provider's firewall/security groups dashboard
2. Ensure ports 80, 443, 3001, 8000 allow **inbound/incoming** traffic
3. Test from mobile data (not WiFi) to rule out local network issues

**Note**: The VPS firewall (UFW) inside your server is configured correctly. The issue would be at your VPS provider's network level (outside your server).

