#!/bin/bash
# Backend startup script with environment variable defaults

# Set defaults for optional Azure AD variables if not provided
export SECRET_KEY="${SECRET_KEY:-change-this-in-production}"
export AZURE_AD_CLIENT_ID="${AZURE_AD_CLIENT_ID:-default-client-id}"
export AZURE_AD_CLIENT_SECRET="${AZURE_AD_CLIENT_SECRET:-default-client-secret}"
export AZURE_AD_TENANT_ID="${AZURE_AD_TENANT_ID:-default-tenant-id}"
export AZURE_AD_AUTHORITY="${AZURE_AD_AUTHORITY:-https://login.microsoftonline.com/default}"

# Auto-detect CORS origins based on environment
# If KOYEB_PUBLIC_DOMAIN is set, use it; otherwise allow all origins for simplicity
if [ -n "$KOYEB_PUBLIC_DOMAIN" ]; then
    export CORS_ORIGINS="${CORS_ORIGINS:-https://$KOYEB_PUBLIC_DOMAIN,http://localhost,http://localhost:3000,http://localhost:5173}"
else
    export CORS_ORIGINS="${CORS_ORIGINS:-*}"
fi

export ALGORITHM="${ALGORITHM:-HS256}"
export ACCESS_TOKEN_EXPIRE_MINUTES="${ACCESS_TOKEN_EXPIRE_MINUTES:-30}"
export ENVIRONMENT="${ENVIRONMENT:-development}"

# Database and Redis URLs (required)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/capyxperks"
export REDIS_URL="redis://localhost:6379/0"

# Debug output
echo ""
echo "========================================="
echo "🚀 BACKEND STARTING"
echo "========================================="
echo "ENVIRONMENT: $ENVIRONMENT"
echo "DATABASE_URL: $DATABASE_URL"
echo "REDIS_URL: $REDIS_URL"
echo "CORS_ORIGINS: $CORS_ORIGINS"
echo "SECRET_KEY: ${SECRET_KEY:0:10}... (truncated)"
echo "========================================="
echo ""

# Verify database connection
echo "Testing database connection..."
cd /app/backend
python -c "
from src.core.database import SessionLocal
from src.models import User
try:
    db = SessionLocal()
    user_count = db.query(User).count()
    print(f'✅ Database connected! Users in database: {user_count}')
    if user_count > 0:
        users = db.query(User).limit(5).all()
        print('Sample users:')
        for user in users:
            print(f'  - {user.email} ({user.role.value})')
    else:
        print('⚠️  WARNING: No users found in database!')
    db.close()
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    import traceback
    traceback.print_exc()
" 2>&1

echo ""
echo "Starting Uvicorn web server..."
echo "========================================="
echo ""

# Start uvicorn
exec /usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000

