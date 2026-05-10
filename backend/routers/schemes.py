"""
routers/schemes.py — Government scheme endpoints.
"""

from fastapi import APIRouter
from database import get_db
from data_fetcher import get_active_schemes, refresh_all_schemes

router = APIRouter()


@router.get("/")
async def list_schemes(language: str = "en", category: str = ""):
    db      = get_db()
    schemes = await get_active_schemes(db, language=language, category=category or None)
    return {"schemes": schemes}


@router.post("/refresh")
async def refresh_schemes():
    db = get_db()
    n  = await refresh_all_schemes(db)
    return {"success": True, "schemes_saved": n}
