# VPS Setup - CapyxPerks

## ✅ Clean Docker Compose Setup

This VPS deployment uses a **clean, simple docker-compose setup** with:
- **Frontend**: React + Nginx (port 3001)
- **Backend**: FastAPI (port 8000)  
- **PostgreSQL**: Database (port 5433)
- **Redis**: Session storage (port 6380)

## Architecture

```
Browser → http://91.98.232.200:3001 → Frontend (Nginx)
                                           ↓
                                      /api/* → Backend (FastAPI)
                                                   ↓
                                              PostgreSQL + Redis
```

### How It Works

1. **Frontend serves static files** and proxies API requests
2. **Nginx** proxies `/api/*` requests to the backend container
3. **Backend** handles API logic and database operations
4. All containers communicate via Docker network by container name

## Quick Start

### View Status
```bash
cd /root/CapyxPerks
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart frontend
docker-compose restart backend
```

### Rebuild After Changes
```bash
# Rebuild specific service
docker-compose build frontend
docker-compose up -d frontend

# Or rebuild everything
docker-compose down
docker-compose build
docker-compose up -d
```

## Access URLs

- **Frontend**: http://91.98.232.200:3001
- **Dev Login**: http://91.98.232.200:3001/dev-login
- **Backend API** (via proxy): http://91.98.232.200:3001/api/*
- **Backend API** (direct): http://91.98.232.200:8000
- **API Docs**: http://91.98.232.200:8000/docs

## Configuration Files

### For VPS Deployment (USE THESE)
- `docker-compose.yml` - Main orchestration file
- `frontend/Dockerfile` - Frontend build instructions
- `frontend/nginx.conf` - Nginx configuration with API proxy
- `backend/Dockerfile` - Backend build instructions

### For Koyeb Deployment (IGNORE FOR VPS)
- `Dockerfile` - Single-container build (not used on VPS)
- `init.sh`, `start-backend.sh` - Koyeb startup scripts
- `supervisord.conf` - Process manager for single container
- `nginx-production.conf` - Koyeb nginx config
- All `*_FIX.md` and deployment guide files

## Database Management

### Seed Users
```bash
docker exec capyxperks-backend python -m src.utils.seed_data
```

### Check Users
```bash
# Via API
curl http://localhost:3001/api/auth/dev/users

# Direct database
docker exec capyxperks-postgres psql -U postgres -d capyxperks -c "SELECT email, role FROM users;"
```

## Environment Variables

Set in `docker-compose.yml`:

### Backend
- `ENVIRONMENT`: `development` (enables dev-login)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CORS_ORIGINS`: Allowed origins
- `SECRET_KEY`: JWT signing key

### Frontend
- Built with `VITE_API_URL=""` for relative paths
- Uses Nginx proxy to route `/api/*` to backend

## Networking

All containers are on the default Docker network and can communicate by container name:
- `capyxperks-frontend` → `capyxperks-backend:8000`
- `capyxperks-backend` → `capyxperks-postgres:5432`
- `capyxperks-backend` → `capyxperks-redis:6379`

## Persistent Data

Data is stored in Docker volumes:
- `capyxperks_postgres_data` - Database data
- `capyxperks_redis_data` - Redis data
- `capyxperks_uploads_data` - Uploaded files

These persist even when containers are recreated.

## Firewall

Configured with UFW:
```bash
# Check status
ufw status

# Open new port if needed
ufw allow [PORT]/tcp
```

Currently open: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (Frontend), 8000 (Backend)

## Troubleshooting

### Frontend Can't Reach Backend
```bash
# Check nginx proxy configuration
docker exec capyxperks-frontend cat /etc/nginx/conf.d/default.conf

# Should show: proxy_pass http://capyxperks-backend:8000;
```

### Backend Not Responding
```bash
# Check backend logs
docker-compose logs backend

# Verify backend is healthy
curl http://localhost:8000/api/auth/dev/users
```

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection from backend
docker exec capyxperks-backend env | grep DATABASE_URL
```

### Clean Restart
```bash
cd /root/CapyxPerks
docker-compose down
docker-compose up -d
```

## Production Recommendations

1. **Change SECRET_KEY** in docker-compose.yml
2. **Set ENVIRONMENT=production** (disables dev-login)
3. **Update PostgreSQL password**
4. **Add SSL/TLS** with certbot
5. **Set up backup** for postgres_data volume
6. **Configure domain name** instead of IP
7. **Remove default credentials**

## Summary

✅ **Clean Setup**: Just docker-compose.yml, no complex scripts  
✅ **Simple Communication**: Frontend → Nginx Proxy → Backend  
✅ **Easy Development**: Change code, rebuild, restart  
✅ **Persistent Data**: Volumes survive container restarts  
✅ **Clear Separation**: Each service in its own container  

This is much cleaner than the Koyeb single-container deployment!

