"""Authentication API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import msal

from src.core.database import get_db
from src.core.config import settings
from src.core.security import create_access_token
from src.models import User, UserRole
from src.schemas.schemas import Token, DevLoginRequest
from src.services.credit_service import grant_credits

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_initial_credits(role: UserRole) -> float:
    """Get initial credits based on role"""
    credit_map = {
        UserRole.INTERN: 100.0,
        UserRole.EMPLOYEE: 200.0,
        UserRole.SENIOR: 300.0,
        UserRole.ADMIN: 1000.0
    }
    return credit_map.get(role, 100.0)


@router.get("/azure")
async def azure_login_url():
    """Get Azure AD login URL"""
    if not settings.azure_ad_client_id:
        raise HTTPException(
            status_code=501,
            detail="Azure AD not configured. Use /api/auth/dev/login for development."
        )
    
    app_msal = msal.ConfidentialClientApplication(
        settings.azure_ad_client_id,
        authority=settings.azure_ad_authority,
        client_credential=settings.azure_ad_client_secret,
    )
    
    auth_url = app_msal.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri="http://localhost:3001/auth/callback"
    )
    return {"auth_url": auth_url}


@router.post("/callback", response_model=Token)
async def azure_callback(code: str = None, db: Session = Depends(get_db)):
    """Handle Azure AD callback and create/update user"""
    # Development fallback
    if not code or not settings.azure_ad_client_id:
        access_token = create_access_token(
            data={"sub": "demo@company.com"},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    try:
        app_msal = msal.ConfidentialClientApplication(
            settings.azure_ad_client_id,
            authority=settings.azure_ad_authority,
            client_credential=settings.azure_ad_client_secret,
        )
        
        result = app_msal.acquire_token_by_authorization_code(
            code,
            scopes=["User.Read"],
            redirect_uri="http://localhost:3001/auth/callback"
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=f"Azure AD error: {result['error']}")
        
        claims = result.get("id_token_claims", {})
        email = claims.get("email") or claims.get("preferred_username")
        name = claims.get("name", "")
        
        if not email:
            raise HTTPException(status_code=400, detail="Unable to extract email from Azure AD")
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user
            user = User(
                email=email,
                name=name,
                start_date=datetime.utcnow(),
                role=UserRole.EMPLOYEE
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Grant initial credits
            credit_amount = get_initial_credits(user.role)
            grant_credits(db, user.id, credit_amount, f"Initial credits for {user.role}")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": email},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dev/login", response_model=Token)
async def dev_login(login_data: DevLoginRequest, db: Session = Depends(get_db)):
    """
    Development login endpoint - bypass Azure AD authentication
    Allows logging in with just an email address
    """
    if settings.environment == "production":
        raise HTTPException(
            status_code=403,
            detail="Development login is disabled in production"
        )
    
    email = login_data.email.lower().strip()
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user in development
        user = User(
            email=email,
            name=login_data.name or email.split('@')[0].title(),
            start_date=datetime.utcnow(),
            role=UserRole.EMPLOYEE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Grant initial credits
        credit_amount = get_initial_credits(user.role)
        grant_credits(db, user.id, credit_amount, f"Initial credits for {user.role.value}")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/dev/users")
async def get_dev_users(db: Session = Depends(get_db)):
    """Get list of users for development login"""
    if settings.environment == "production":
        raise HTTPException(
            status_code=403,
            detail="Development endpoint disabled in production"
        )
    
    users = db.query(User).filter(User.is_active == True).all()
    result = [
        {
            "email": user.email,
            "name": user.name,
            "role": user.role.value
        }
        for user in users
    ]
    
    # Debug logging
    print(f"🔍 /api/auth/dev/users called - Returning {len(result)} users")
    if len(result) == 0:
        print("⚠️  WARNING: No users found in database!")
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        print(f"   Total users in DB: {total_users}")
        print(f"   Active users in DB: {active_users}")
    
    return result

