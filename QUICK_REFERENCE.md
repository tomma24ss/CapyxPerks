# CapyxPerks Quick Reference

## 🌐 Access URLs

- **Main Site (Port 80):** http://capyxperks.duckdns.org/
- **Alternate (Port 3001):** http://capyxperks.duckdns.org:3001/
- **Backend API:** http://capyxperks.duckdns.org:8000
- **API Documentation:** http://capyxperks.duckdns.org:8000/docs

## 🔑 Demo Password

**Current Password:** `capyx2024`

Users must enter this password before accessing the site.

## 🔧 Common Commands

### Start/Restart Services
```bash
cd /root/CapyxPerks
docker compose down
docker compose up -d
```

### Rebuild After Code Changes
```bash
cd /root/CapyxPerks
docker compose build
docker compose up -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
docker compose logs -f backend
```

### Check Service Status
```bash
docker compose ps
```

## 📝 Change Demo Password

### Method 1: Environment Variable
1. Create or edit `/root/CapyxPerks/.env`:
   ```bash
   DEMO_PASSWORD=your-new-password
   ```
2. Restart: `docker compose down && docker compose up -d`

### Method 2: Direct Edit
1. Edit `/root/CapyxPerks/docker-compose.yml`
2. Find line: `DEMO_PASSWORD: ${DEMO_PASSWORD:-capyx2024}`
3. Change to: `DEMO_PASSWORD: your-new-password`
4. Restart: `docker compose down && docker compose up -d`

## 📚 Documentation Files

- **ENV_SETUP_GUIDE.md** - Complete environment variables guide
- **DEMO_PASSWORD_CONFIG.md** - Demo password configuration details
- **README.md** - Full project documentation

## 🚀 Quick Troubleshooting

**Site not loading?**
```bash
docker compose ps  # Check if services are running
docker compose logs frontend  # Check for errors
```

**Can't connect from external devices?**
- Check firewall: `sudo ufw status`
- Verify VPS provider's firewall allows ports 80, 443, 3001, 8000

**Password not working?**
- Clear browser localStorage or use incognito mode
- Verify password: `curl http://capyxperks.duckdns.org/api/demo/password`

**Need to reset everything?**
```bash
cd /root/CapyxPerks
docker compose down -v  # Warning: deletes database!
docker compose up -d
```

## 📱 Testing Access

### From Server
```bash
curl http://localhost/api/demo/password
```

### From External
```bash
curl http://capyxperks.duckdns.org/api/demo/password
```

## ⚠️ Important Notes

1. **Demo Password Security**: This is for demo/testing only, not production
2. **HTTPS**: Currently using HTTP. For production, configure HTTPS/SSL
3. **Database**: Data persists in Docker volumes unless removed with `-v` flag
4. **Uploads**: Product images stored in `/app/uploads` in backend container

## 🔄 After Updates

Whenever you modify code:
```bash
cd /root/CapyxPerks
docker compose build [service-name]  # Optional: specify frontend or backend
docker compose up -d
```

For environment variable changes only:
```bash
cd /root/CapyxPerks
docker compose down
docker compose up -d
```

