"""
routers/prices.py — Crop price endpoints for the frontend dashboard.
"""

from fastapi import APIRouter, HTTPException
from database import get_db
from data_fetcher import refresh_all_prices
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def get_prices(crop: str = "", district: str = "", state: str = "", limit: int = 20):
    """
    Return latest crop prices from DB.
    Frontend uses this to show the live price table in FarmerPortal and dashboard.
    """
    db    = get_db()
    query = {}

    if crop:
        query["crop"] = {"$regex": crop, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}

    cursor = db.crop_prices.find(query, {"_id": 0}).sort("fetched_at", -1).limit(limit)
    prices = []
    async for p in cursor:
        prices.append(p)

    return {"prices": prices, "count": len(prices)}


@router.post("/refresh")
async def manual_refresh():
    """Manually trigger a price refresh (admin use)."""
    db = get_db()
    n  = await refresh_all_prices(db)
    return {"success": True, "records_saved": n}


@router.get("/summary")
async def price_summary():
    """
    Return one latest price per major crop across all districts.
    Used by the dashboard price ticker.
    """
    db     = get_db()
    crops  = ["Tomato", "Onion", "Rice", "Ragi", "Groundnut", "Wheat", "Cotton"]
    result = []

    for crop in crops:
        record = await db.crop_prices.find_one(
            {"crop": {"$regex": crop, "$options": "i"}},
            sort=[("fetched_at", -1)],
        )
        if record:
            record.pop("_id", None)
            result.append(record)

    return {"summary": result}
