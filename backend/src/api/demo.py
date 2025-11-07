"""Demo/Public API routes"""
from fastapi import APIRouter
from src.core.config import settings

router = APIRouter(tags=["Demo"])


@router.get("/demo/password")
async def get_demo_password():
    """Get demo password for demo access gate (public endpoint)"""
    return {
        "password": settings.demo_password
    }

