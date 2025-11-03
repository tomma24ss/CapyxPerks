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
from src.api import auth, products, users, orders, admin

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
    """Initialize database tables on startup with retry logic"""
    import time
    max_retries = 30
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            init_db()
            print("✅ Database initialized successfully")
            if settings.environment == "development":
                print("🔧 Running in DEVELOPMENT mode")
                print("📝 Dev login available at: POST /api/auth/dev/login")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                if attempt == 0:
                    print(f"⏳ Database not ready yet, waiting for initialization...")
                print(f"   Retry {attempt + 1}/{max_retries}: {str(e)[:100]}")
                time.sleep(retry_delay)
            else:
                print(f"❌ Failed to initialize database after {max_retries} attempts")
                print(f"   Last error: {e}")
                raise


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
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.environment == "development" else False
    )
