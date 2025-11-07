from typing import List
import os


class Settings:
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/capyxperks")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Azure AD
    azure_ad_client_id: str = os.getenv("AZURE_AD_CLIENT_ID", "")
    azure_ad_client_secret: str = os.getenv("AZURE_AD_CLIENT_SECRET", "")
    azure_ad_tenant_id: str = os.getenv("AZURE_AD_TENANT_ID", "")
    azure_ad_authority: str = os.getenv("AZURE_AD_AUTHORITY", "")
    
    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Application
    environment: str = os.getenv("ENVIRONMENT", "development")
    cors_origins: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    
    # Demo Password Protection
    demo_password: str = os.getenv("DEMO_PASSWORD", "capyx2024")


settings = Settings()

