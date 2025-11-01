"""User profile API routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.core.database import get_db
from src.core.security import get_current_user
from src.models import User, CreditLedger
from src.schemas.schemas import UserResponse, CreditBalance, CreditLedgerResponse
from src.services.credit_service import get_user_balance

router = APIRouter(tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.get("/credits/balance", response_model=CreditBalance)
async def get_credits_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's credit balance"""
    balance = get_user_balance(db, current_user.id)
    return {"balance": balance, "user_id": current_user.id}


@router.get("/credits/ledger", response_model=List[CreditLedgerResponse])
async def get_credits_ledger(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get user's credit transaction history"""
    ledger = db.query(CreditLedger).filter(
        CreditLedger.user_id == current_user.id
    ).order_by(
        CreditLedger.created_at.desc()
    ).offset(offset).limit(limit).all()
    return ledger

