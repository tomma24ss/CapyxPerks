"""Credit management service"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models import CreditLedger, CreditType


def get_user_balance(db: Session, user_id: int) -> float:
    """Calculate user's current credit balance"""
    result = db.query(func.sum(CreditLedger.amount)).filter(
        CreditLedger.user_id == user_id
    ).scalar()
    return float(result or 0.0)


def grant_credits(
    db: Session,
    user_id: int,
    amount: float,
    description: str,
    order_id: int = None
) -> CreditLedger:
    """Grant credits to a user"""
    ledger_entry = CreditLedger(
        user_id=user_id,
        amount=amount,
        credit_type=CreditType.GRANT,
        description=description,
        reference_order_id=order_id
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(ledger_entry)
    return ledger_entry


def deduct_credits(
    db: Session,
    user_id: int,
    amount: float,
    description: str,
    order_id: int
) -> CreditLedger:
    """Deduct credits from a user"""
    ledger_entry = CreditLedger(
        user_id=user_id,
        amount=-amount,
        credit_type=CreditType.DEBIT,
        description=description,
        reference_order_id=order_id
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(ledger_entry)
    return ledger_entry

