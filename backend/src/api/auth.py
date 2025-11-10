"""Authentication API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import msal
import requests

from src.core.database import get_db
from src.core.config import settings
from src.core.security import create_access_token
from src.models import User, UserRole
from src.schemas.schemas import Token, DevLoginRequest, LoginRequest
from src.services.credit_service import grant_credits

router = APIRouter(prefix="/auth", tags=["Authentication"])


# Mock user accounts for development mode
MOCK_USERS = {
    "laurie.bardare@capyx.be": {
        "password": "capyx123",
        "name": "Laurie Bardare",
        "role": UserRole.ADMIN
    },
    "tomma.vlaemynck@capyx.be": {
        "password": "capyx123",
        "name": "Tomma Vlaemynck",
        "role": UserRole.EMPLOYEE
    },
    "guillaume.verhamme@capyx.be": {
        "password": "capyx123",
        "name": "Guillaume Verhamme",
        "role": UserRole.SENIOR
    },
    "tinael.devresse@capyx.be": {
        "password": "capyx123",
        "name": "Tinael Devresse",
        "role": UserRole.EMPLOYEE
    },
    "christophe.devos@capyx.be": {
        "password": "capyx123",
        "name": "Christophe Devos",
        "role": UserRole.EMPLOYEE
    }
}


def get_initial_credits(role: UserRole) -> float:
    """Get initial credits based on role"""
    credit_map = {
        UserRole.INTERN: 100.0,
        UserRole.EMPLOYEE: 200.0,
        UserRole.SENIOR: 300.0,
        UserRole.ADMIN: 1000.0
    }
    return credit_map.get(role, 100.0)


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password
    - In development: validates against mock user accounts
    - In production: validates against Azure AD
    """
    email = login_data.email.lower().strip()
    password = login_data.password
    
    # Development mode - use mock accounts
    if settings.environment == "development":
        # Check if email exists in mock users
        if email not in MOCK_USERS:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        mock_user = MOCK_USERS[email]
        
        # Validate password
        if password != mock_user["password"]:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Check if user exists in database
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user in development
            user = User(
                email=email,
                name=mock_user["name"],
                start_date=datetime.utcnow(),
                role=mock_user["role"]
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
    
    # Production mode - use Azure AD
    else:
        if not settings.azure_ad_client_id:
            raise HTTPException(
                status_code=501,
                detail="Azure AD not configured"
            )
        
        try:
            # Use MSAL Resource Owner Password Credentials (ROPC) flow
            # This allows username/password authentication with Azure AD
            app_msal = msal.PublicClientApplication(
                settings.azure_ad_client_id,
                authority=settings.azure_ad_authority,
            )
            
            result = app_msal.acquire_token_by_username_password(
                username=email,
                password=password,
                scopes=["User.Read"]
            )
            
            if "error" in result:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )
            
            # Extract user information from token
            claims = result.get("id_token_claims", {})
            user_email = claims.get("email") or claims.get("preferred_username") or email
            name = claims.get("name", email.split('@')[0].title())
            
            # Check if user exists in database
            user = db.query(User).filter(User.email == user_email).first()
            
            if not user:
                # Create new user
                user = User(
                    email=user_email,
                    name=name,
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
                data={"sub": user_email},
                expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
            )
            
            return {"access_token": access_token, "token_type": "bearer"}
            
        except Exception as e:
            print(f"Azure AD login error: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )


@router.get("/azure")
async def azure_login_url():
    """Get Azure AD login URL (deprecated - kept for backward compatibility)"""
    if not settings.azure_ad_client_id:
        raise HTTPException(
            status_code=501,
            detail="Azure AD not configured. Use /api/auth/login instead."
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


@router.get("/mock-users")
async def get_mock_users():
    """Get list of mock users available in development mode"""
    if settings.environment == "production":
        return []
    
    # Return mock users without passwords
    result = [
        {
            "email": email,
            "name": user_data["name"],
            "role": user_data["role"].value,
            "password": user_data["password"]  # Include in dev mode for easy reference
        }
        for email, user_data in MOCK_USERS.items()
    ]
    
    return result


@router.get("/dev/users")
async def get_dev_users(db: Session = Depends(get_db)):
    """Get list of users for development login (deprecated - kept for backward compatibility)"""
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

