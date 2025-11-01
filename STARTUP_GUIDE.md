# CapyxPerks - Quick Startup Guide

## ✅ Project Status: RUNNING

All services are up and running successfully!

## 🔧 Issues Fixed

1. **Frontend TypeScript Errors**
   - Added `vite-env.d.ts` for Vite environment type definitions
   - Removed unused `toast` imports from AdminDashboard and HomePage

2. **Backend Missing Dependency**
   - Added `pydantic[email]` to requirements.txt for email validation

3. **Port Conflicts**
   - Changed PostgreSQL port: 5432 → 5433
   - Changed Redis port: 6379 → 6380
   - Changed Frontend port: 3000 → 3001
   - Backend port: 8000 (unchanged)

4. **Database Initialization**
   - Database tables created automatically on startup
   - Seeded with sample data (users, products, inventory)

---

## 🚀 Access Points

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:3001 | ✅ Running |
| **Backend API** | http://localhost:8000 | ✅ Running |
| **API Docs (Swagger)** | http://localhost:8000/docs | ✅ Available |
| **PostgreSQL** | localhost:5433 | ✅ Running |
| **Redis** | localhost:6380 | ✅ Running |

---

## 👥 Sample Users (for testing)

| Email | Role | Initial Credits |
|-------|------|----------------|
| `admin@company.com` | Admin | 1000 credits |
| `john.doe@company.com` | Employee | 200 credits |
| `jane.smith@company.com` | Senior | 300 credits |

---

## 🎁 Sample Products

The database is pre-populated with 8 products:

1. **Company T-Shirt** - 50 credits (Various sizes & colors)
2. **Insulated Water Bottle** - 75 credits (32oz, 3 colors)
3. **Laptop Backpack** - 120 credits (One size, 2 colors)
4. **Wireless Mouse** - 40 credits (Standard, 2 colors)
5. **Coffee Mug** - 25 credits (14oz, 2 colors)
6. **Hoodie** - 85 credits (Various sizes & colors)
7. **Notebook Set** - 30 credits (A5 set)
8. **Desk Organizer** - 45 credits (Natural bamboo)

---

## 🛠️ Common Commands

### Start all services
```bash
cd /home/tomma/CapyxPerks
docker compose up -d
```

### Stop all services
```bash
docker compose down
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker logs capyxperks-backend -f
docker logs capyxperks-frontend -f
```

### Rebuild after code changes
```bash
# Rebuild all
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend
```

### Access database directly
```bash
docker exec -it capyxperks-postgres psql -U postgres -d capyxperks
```

### Access Redis CLI
```bash
docker exec -it capyxperks-redis redis-cli
```

### Run seed script again (if needed)
```bash
docker exec capyxperks-backend python seed_data.py
```

---

## 🧪 Testing the Application

### 1. Test Backend API
```bash
# Get all products
curl http://localhost:8000/api/products

# Get API documentation
open http://localhost:8000/docs
```

### 2. Test Frontend
```bash
# Open in browser
open http://localhost:3001
```

### 3. Test Authentication (Development Mode)
The backend has a development mode that bypasses Azure AD:
```bash
# Get demo token
curl -X POST http://localhost:8000/api/auth/callback
```

---

## 📝 Notes

### Azure AD Configuration
The Azure AD environment variables are not set. The application works in development mode without Azure AD authentication. To enable Azure AD:

1. Create an Azure AD App Registration
2. Create a `.env` file in the project root:
```env
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
```

3. Restart services:
```bash
docker compose down
docker compose up -d
```

### Development vs Production
- Current setup is for **development** with hot-reload enabled
- For production, see the deployment section in README.md

---

## 🔍 Troubleshooting

### Frontend not loading?
```bash
docker logs capyxperks-frontend
```

### Backend errors?
```bash
docker logs capyxperks-backend
```

### Database issues?
```bash
docker exec -it capyxperks-postgres psql -U postgres -d capyxperks -c "\dt"
```

### Port already in use?
Check and modify ports in `docker-compose.yml`

---

## 📚 Project Structure

```
CapyxPerks/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication
│   ├── services.py          # Business logic
│   ├── database.py          # Database config
│   ├── config.py            # Settings
│   ├── seed_data.py         # Database seeding
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   ├── api/             # API client
│   │   └── vite-env.d.ts    # Vite type definitions
│   └── package.json
├── docker-compose.yml       # Docker orchestration
└── STARTUP_GUIDE.md        # This file
```

---

## 🎯 Next Steps

1. **Open the frontend**: http://localhost:3001
2. **Browse the API docs**: http://localhost:8000/docs
3. **Test product browsing** (no auth required)
4. **Implement authentication flow** for user-specific features
5. **Customize products and variants** via admin endpoints

---

## 💡 Development Tips

- Backend has **hot-reload** enabled (changes auto-reload)
- Frontend has **hot-reload** enabled (changes auto-reload)
- Use the Swagger UI (http://localhost:8000/docs) to test API endpoints
- Check browser console for frontend errors
- Check Docker logs for backend errors

---

**Ready to develop!** 🚀

Feel free to modify products, add features, or customize the application to your needs.

