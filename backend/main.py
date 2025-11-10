"""
CapyxPerks Backend Application

Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from src.core.config import settings
from src.core.database import init_db
from src.api import auth, products, users, orders, admin, demo

# Create FastAPI application
app = FastAPI(
    title="CapyxPerks API",
    version="2.0.0",
    description="Employee Benefits Platform - Redeem credits for company perks",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
# Allow all origins in development since nginx handles the proxying
cors_origins = settings.cors_origins + ["http://localhost:3001"]
if settings.environment == "development":
    cors_origins = ["*"]  # Allow all origins in development

print(f"🌐 CORS Origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Ensure database tables exist (idempotent operation)"""
    from src.core.database import engine, SessionLocal
    from src.models import User
    import sqlalchemy
    
    # Debug: Check database connection
    print(f"🔍 Database URL: {settings.database_url}")
    print(f"🔍 Engine URL: {engine.url}")
    
    # Test connection and check current database
    try:
        with engine.connect() as conn:
            result = conn.execute(sqlalchemy.text("SELECT current_database()"))
            current_db = result.scalar()
            print(f"🔍 Connected to database: {current_db}")
            
            # Check if users table exists
            result = conn.execute(sqlalchemy.text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
            ))
            table_exists = result.scalar()
            print(f"🔍 Users table exists: {table_exists}")
            
            if table_exists:
                # Count users
                result = conn.execute(sqlalchemy.text("SELECT COUNT(*) FROM users"))
                user_count = result.scalar()
                print(f"🔍 Users in database: {user_count}")
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Call init_db() to ensure tables exist
    # This is idempotent - only creates tables if they don't exist
    init_db()
    print("✅ Database tables verified")
    
    if settings.environment == "development":
        print("🔧 Running in DEVELOPMENT mode")
        print("📝 Login with mock accounts at: POST /api/auth/login")
        print("📝 Mock users available at: GET /api/auth/mock-users")


# Mount static files for uploads
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(demo.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": "CapyxPerks API",
        "version": "2.0.0",
        "status": "running",
        "environment": settings.environment,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from src.core.database import SessionLocal
    from src.models import User
    import os
    
    # Count users in database
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
    finally:
        db.close()
    
    return {
        "status": "healthy",
        "environment": settings.environment,
        "hostname": os.getenv("HOSTNAME", "unknown"),
        "user_count": user_count
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.environment == "development" else False
    )
