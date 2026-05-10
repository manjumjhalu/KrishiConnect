"""
routers/hobli.py — Hobli office admin endpoints.
Connects to: HobliAdmin.tsx (frontend)

Admin login → register new farmer → edit/search farmers → trigger bulk SMS.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from sms_service import send_sms, format_phone_e164
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Pydantic models ───────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    unique_id: str
    password:  str

class FarmerRegister(BaseModel):
    name:          str
    phone:         str
    hobli_id:      str
    district:      str
    crop_name:     str
    village:       str
    survey_number: str
    surnoc:        str
    hissa_no:      str
    sowing_date:   str
    harvest_month: str | None = None
    acres:         float | None = None
    language:      str = "kn"   # default Kannada for Karnataka

class FarmerEdit(FarmerRegister):
    pass   # same fields, reuse model


# ── Admin login ───────────────────────────────────────────────────────────────

@router.post("/login")
async def hobli_login(creds: AdminLogin):
    """
    Verify Hobli office staff credentials.
    In production: bcrypt-hashed passwords in MongoDB.
    For hackathon: demo credentials stored in DB or hardcoded.
    """
    db = get_db()

    staff = await db.hobli_offices.find_one({
        "unique_id": creds.unique_id,
        "password":  creds.password,  # ⚠ hash this in prod
    })

    if not staff:
        # Demo fallback for hackathon judging
        if creds.unique_id == "admin123" and creds.password == "password123":
            return {
                "success":  True,
                "hobli_id": "ramanagara_001",
                "district": "Ramanagara",
                "staff_name": "Demo Admin",
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")

    staff.pop("_id", None)
    staff.pop("password", None)
    return {"success": True, **staff}


# ── Register new farmer (paper pani → DB) ────────────────────────────────────

@router.post("/register-farmer")
async def register_farmer(data: FarmerRegister):
    """
    Hobli staff enters a farmer's pani form details.
    Creates the farmer profile in MongoDB.
    Sends a welcome SMS to confirm registration.
    """
    db = get_db()

    existing = await db.farmers.find_one({"phone": data.phone})
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Farmer with this phone already registered. Use update-crop instead."
        )

    farmer_doc = {
        "name":     data.name,
        "phone":    data.phone,
        "hobli_id": data.hobli_id,
        "district": data.district,
        "language": data.language,
        "acres":    data.acres or 0,
        "current_crop": {
            "crop_name":     data.crop_name,
            "village":       data.village,
            "survey_number": data.survey_number,
            "surnoc":        data.surnoc,
            "hissa_no":      data.hissa_no,
            "sowing_date":   data.sowing_date,
            "harvest_month": data.harvest_month or "",
            "status":        "Growing",
        },
        "crop_history":  [],
        "registered_by": "hobli_office",
        "registered_at": datetime.utcnow(),
        "updated_at":    datetime.utcnow(),
    }

    await db.farmers.insert_one(farmer_doc)

    # Welcome SMS
    welcome_msgs = {
        "kn": f"ಸ್ವಾಗತ {data.name}! KrishiConnect ನಲ್ಲಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಬೆಳೆ ಬೆಲೆ ತಿಳಿಯಲು ನಮ್ಮ ಟೋಲ್-ಫ್ರೀ ಗೆ ಮಿಸ್ಡ್ ಕಾಲ್ ಮಾಡಿ.",
        "te": f"స్వాగతం {data.name}! KrishiConnect లో నమోదు అయింది. మిస్డ్ కాల్ ద్వారా పంట ధర తెలుసుకోండి.",
        "hi": f"स्वागत {data.name}! KrishiConnect में पंजीकृत। फसल भाव जानने के लिए मिस्ड कॉल करें।",
        "en": f"Welcome {data.name}! Registered on KrishiConnect. Give a missed call to get crop prices in seconds.",
    }
    msg = welcome_msgs.get(data.language, welcome_msgs["en"])
    send_sms(format_phone_e164(data.phone), msg)

    return {"success": True, "message": f"Farmer {data.name} registered successfully"}


# ── Edit farmer ───────────────────────────────────────────────────────────────

@router.put("/edit-farmer/{phone}")
async def edit_farmer(phone: str, data: FarmerEdit):
    db = get_db()
    result = await db.farmers.update_one(
        {"phone": phone},
        {"$set": {
            "name":     data.name,
            "district": data.district,
            "language": data.language,
            "acres":    data.acres or 0,
            "current_crop": {
                "crop_name":     data.crop_name,
                "village":       data.village,
                "survey_number": data.survey_number,
                "surnoc":        data.surnoc,
                "hissa_no":      data.hissa_no,
                "sowing_date":   data.sowing_date,
                "harvest_month": data.harvest_month or "",
                "status":        "Growing",
            },
            "updated_at": datetime.utcnow(),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {"success": True, "message": "Farmer updated"}


# ── Search / list farmers ─────────────────────────────────────────────────────

@router.get("/farmers")
async def list_farmers(hobli_id: str = "", search: str = "", limit: int = 50):
    """
    List farmers for a Hobli, optionally filtered by search query.
    Used by HobliAdmin.tsx farmer table.
    """
    db    = get_db()
    query = {}

    if hobli_id:
        query["hobli_id"] = hobli_id

    if search:
        query["$or"] = [
            {"name":  {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"current_crop.crop_name": {"$regex": search, "$options": "i"}},
        ]

    cursor  = db.farmers.find(query, {"_id": 0}).limit(limit)
    farmers = []
    async for f in cursor:
        farmers.append({
            "id":            str(f.get("registered_at", "")),
            "name":          f.get("name", ""),
            "phone":         f.get("phone", ""),
            "current_crop":  f.get("current_crop", {}),
            "district":      f.get("district", ""),
            "language":      f.get("language", "en"),
            "registered_at": str(f.get("registered_at", "")),
        })

    return {"farmers": farmers, "count": len(farmers)}


# ── Broadcast SMS to all farmers in a Hobli ──────────────────────────────────

@router.post("/broadcast-sms")
async def broadcast_sms(hobli_id: str, message: str):
    """
    Send a custom SMS to all registered farmers in a Hobli.
    Used for scheme announcements, weather alerts, etc.
    """
    db     = get_db()
    cursor = db.farmers.find({"hobli_id": hobli_id}, {"phone": 1, "language": 1})

    sent = 0
    async for farmer in cursor:
        result = send_sms(format_phone_e164(farmer["phone"]), message)
        if result:
            sent += 1

    return {"success": True, "sent": sent}
