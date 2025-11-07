# HTTPS Setup Guide - CapyxPerks

## Current Setup (Works but Limited)
- URL: http://capyxperks.duckdns.org:3001/
- Protocol: HTTP (not secure)
- Port: 3001 (non-standard)
- ⚠️ Some networks may block port 3001
- ⚠️ Browsers show "Not Secure" warning

## Recommended Setup (Production Ready)
- URL: https://capyxperks.duckdns.org/
- Protocol: HTTPS (secure with SSL)
- Port: 443 (standard HTTPS port)
- ✅ Works on ALL networks
- ✅ No "Not Secure" warnings
- ✅ No port number needed in URL

---

## Option 1: Quick Setup with Let's Encrypt (Recommended)

### Step 1: Install Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Stop Current Frontend (Temporary)
```bash
cd /root/CapyxPerks
docker-compose stop frontend
```

### Step 3: Get SSL Certificate
```bash
# Let's Encrypt needs port 80 to verify domain
sudo ufw allow 80/tcp

# Get certificate
sudo certbot certonly --standalone -d capyxperks.duckdns.org

# Follow prompts:
# - Enter your email
# - Agree to terms
# - Certificates will be saved in /etc/letsencrypt/live/capyxperks.duckdns.org/
```

### Step 4: Create Nginx HTTPS Configuration

Create `/root/CapyxPerks/nginx-https.conf`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name capyxperks.duckdns.org;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name capyxperks.duckdns.org;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/capyxperks.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/capyxperks.duckdns.org/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    root /usr/share/nginx/html;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://capyxperks-backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads proxy
    location /uploads {
        proxy_pass http://capyxperks-backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 5: Update Docker Compose for HTTPS

Update `/root/CapyxPerks/docker-compose.yml`:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      VITE_API_URL: ""
  container_name: capyxperks-frontend
  ports:
    - "80:80"      # HTTP (redirects to HTTPS)
    - "443:443"    # HTTPS
  volumes:
    - ./nginx-https.conf:/etc/nginx/conf.d/default.conf
    - /etc/letsencrypt:/etc/letsencrypt:ro
  depends_on:
    - backend
```

### Step 6: Open Ports in Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### Step 7: Restart Services
```bash
cd /root/CapyxPerks
docker-compose down
docker-compose up -d
```

### Step 8: Test HTTPS
```bash
# Should redirect to HTTPS
curl -I http://capyxperks.duckdns.org/

# Should return 200 OK with SSL
curl -I https://capyxperks.duckdns.org/
```

### Step 9: Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Certificates auto-renew via systemd timer
sudo systemctl status certbot.timer
```

---

## Option 2: Keep Current Setup (Port 3001)

If you want to keep the current setup on port 3001:

### Advantages:
- No changes needed
- Works from most devices
- Simpler setup

### Disadvantages:
- Users must include `:3001` in URL
- Not secure (HTTP only)
- May be blocked on some corporate networks
- Browsers show "Not Secure" warning

### Test Accessibility:
From a different device (phone, laptop on different network):
1. Visit: http://capyxperks.duckdns.org:3001/
2. If it loads → Your network allows port 3001 ✅
3. If it times out → Your network blocks port 3001 ❌

---

## Option 3: Hybrid Setup (Both HTTP and HTTPS)

Keep port 3001 for testing, add port 443 for production:

```yaml
frontend:
  ports:
    - "80:80"      # HTTP
    - "443:443"    # HTTPS
    - "3001:80"    # Legacy access
```

This way:
- Production: https://capyxperks.duckdns.org/
- Testing: http://capyxperks.duckdns.org:3001/

---

## Quick Comparison

| Feature | Current (Port 3001) | With HTTPS (Port 443) |
|---------|--------------------|-----------------------|
| URL | http://capyxperks.duckdns.org:3001/ | https://capyxperks.duckdns.org/ |
| Port Needed | Yes (:3001) | No |
| Secure | ❌ HTTP only | ✅ HTTPS encrypted |
| Corporate Networks | May block | ✅ Always works |
| Mobile Data | ✅ Works | ✅ Works |
| Browser Warning | "Not Secure" | ✅ Secure |
| Setup Time | 0 min (done) | ~15 minutes |

---

## Testing Current Accessibility

From different devices, try:
- ✅ Desktop (home WiFi)
- ✅ Mobile (mobile data)
- ⚠️ Office/corporate WiFi (might block port 3001)
- ⚠️ Public WiFi (might block port 3001)
- ⚠️ School network (might block port 3001)

---

## My Recommendation

For **production use with employees**, I strongly recommend:

1. **Set up HTTPS on port 443** (Option 1)
   - Takes ~15 minutes
   - Free SSL certificate from Let's Encrypt
   - Works everywhere
   - Professional and secure

2. **Keep port 3001 as backup** for testing

This ensures your employees can access the app from:
- ✅ Office computers (even with strict firewalls)
- ✅ Home computers
- ✅ Mobile phones
- ✅ Any WiFi network
- ✅ No "Not Secure" warnings

---

## Need Help Setting Up HTTPS?

Just let me know and I can guide you through the process step-by-step! The setup is straightforward and only takes about 15 minutes.

