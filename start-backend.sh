#!/bin/bash
# Backend startup script with environment variable defaults

# Set defaults for optional Azure AD variables if not provided
export SECRET_KEY="${SECRET_KEY:-change-this-in-production}"
export AZURE_AD_CLIENT_ID="${AZURE_AD_CLIENT_ID:-default-client-id}"
export AZURE_AD_CLIENT_SECRET="${AZURE_AD_CLIENT_SECRET:-default-client-secret}"
export AZURE_AD_TENANT_ID="${AZURE_AD_TENANT_ID:-default-tenant-id}"
export AZURE_AD_AUTHORITY="${AZURE_AD_AUTHORITY:-https://login.microsoftonline.com/default}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost}"
export ALGORITHM="${ALGORITHM:-HS256}"
export ACCESS_TOKEN_EXPIRE_MINUTES="${ACCESS_TOKEN_EXPIRE_MINUTES:-30}"
export ENVIRONMENT="${ENVIRONMENT:-production}"

# Database and Redis URLs (required)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/capyxperks"
export REDIS_URL="redis://localhost:6379/0"

# Start uvicorn
cd /app/backend
exec /usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000

