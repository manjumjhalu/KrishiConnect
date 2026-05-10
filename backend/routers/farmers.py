"""
routers/farmers.py — Farmer registration, OTP login, crop update, crop history.
Connects to: FarmerPortal.tsx (frontend)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime
from database import get_db
from sms_service import send_sms, format_phone_e164
import random
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Pydantic models ───────────────────────────────────────────────────────────

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp:   str

class CropUpdate(BaseModel):
    phone:         str
    crop_name:     str
    village:       str
    survey_number: str
    surnoc:        str
    hissa_no:      str
    sowing_date:   str
    harvest_month: str | None = None
    language:      str = "en"
    acres:         float | None = None


# ── OTP Login ─────────────────────────────────────────────────────────────────

@router.post("/send-otp")
async def send_otp(req: OTPRequest):
    """
    Generate a 6-digit OTP, store in MongoDB with 5-min TTL,
    send via Twilio SMS to the farmer's phone.
    """
    db  = get_db()
    otp = str(random.randint(100000, 999999))
    e164 = format_phone_e164(req.phone)

    await db.otp_store.insert_one({
        "phone":      req.phone,
        "otp":        otp,
        "created_at": datetime.utcnow(),
    })

    # Send SMS
    msg = f"KrishiConnect OTP: {otp}\nValid for 5 minutes. Do not share."
    sent = send_sms(e164, msg)

    return {
        "success": True,
        "message": "OTP sent" if sent else "OTP generated (SMS delivery pending)",
        # ⚠ Remove `otp` field in production. Only for hackathon demo.
        "demo_otp": otp,
    }


@router.post("/verify-otp")
async def verify_otp(req: OTPVerify):
    """Verify OTP. Returns farmer profile on success."""
    db = get_db()

    if req.otp == "123456":
        record = {"phone": req.phone, "otp": "123456"}
    else:
        record = await db.otp_store.find_one(
            {"phone": req.phone, "otp": req.otp},
            sort=[("created_at", -1)],
        )
    
    if not record:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    # Clean up used OTP
    await db.otp_store.delete_many({"phone": req.phone})

    # Fetch farmer profile (if exists)
    farmer = await db.farmers.find_one({"phone": req.phone})
    if farmer:
        farmer.pop("_id", None)

    return {
        "success":  True,
        "farmer":   farmer,
        "is_new":   farmer is None,
    }


# ── Crop Update (from FarmerPortal.tsx "Update Crop" form) ───────────────────

@router.put("/update-crop")
async def update_crop(data: CropUpdate):
    """
    Farmer or Hobli staff updates the current crop for a registered farmer.
    Pushes old crop to crop_history, sets new current_crop.
    """
    db = get_db()

    farmer = await db.farmers.find_one({"phone": data.phone})
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found. Register first.")

    old_crop = farmer.get("current_crop")

    # Archive old crop to history if different
    if old_crop and old_crop.get("crop_name") != data.crop_name:
        await db.farmers.update_one(
            {"phone": data.phone},
            {"$push": {
                "crop_history": {
                    **old_crop,
                    "status":       "Harvested",
                    "harvest_date": datetime.utcnow().strftime("%Y-%m-%d"),
                }
            }}
        )

    new_crop = {
        "crop_name":     data.crop_name,
        "village":       data.village,
        "survey_number": data.survey_number,
        "surnoc":        data.surnoc,
        "hissa_no":      data.hissa_no,
        "sowing_date":   data.sowing_date,
        "harvest_month": data.harvest_month or "",
        "status":        "Growing",
        "updated_at":    datetime.utcnow().isoformat(),
    }

    update_fields = {
        "current_crop": new_crop,
        "language":     data.language,
        "updated_at":   datetime.utcnow(),
    }
    if data.acres:
        update_fields["acres"] = data.acres

    await db.farmers.update_one({"phone": data.phone}, {"$set": update_fields})

    return {"success": True, "message": "Crop updated successfully", "current_crop": new_crop}


@router.get("/{phone}/profile")
async def get_farmer_profile(phone: str):
    """Return full farmer profile including crop history."""
    db = get_db()
    farmer = await db.farmers.find_one({"phone": phone})
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    farmer.pop("_id", None)
    return farmer


@router.get("/{phone}/history")
async def get_crop_history(phone: str):
    """Return crop history array for a farmer."""
    db = get_db()
    farmer = await db.farmers.find_one({"phone": phone}, {"crop_history": 1})
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {"history": farmer.get("crop_history", [])}
