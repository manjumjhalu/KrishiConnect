"""
routers/sms_webhook.py — The CORE of KrishiConnect.

POST /api/sms-webhook  — called by Twilio when farmer gives a missed call.

Full pipeline in one request:
  1. Extract caller phone from Twilio POST body
  2. Lookup farmer in MongoDB → get crop, district, language
  3. Fetch current crop price (data.gov.in / Agmarknet)
  4. Find nearest verified buyer
  5. Get top active govt scheme
  6. Build regionalised SMS
  7. Send via Twilio
  8. Return TwiML <Response/> to Twilio (hangs up the call cleanly)

Also exposes POST /api/trigger-sms for hackathon demo testing
(simulates a missed call without needing an actual phone).
"""

from fastapi import APIRouter, Form, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from database import get_db
from sms_service import build_sms, send_sms, format_phone_e164
from data_fetcher import get_price_for_crop, get_active_schemes
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# TwiML response to return to Twilio — accepts and immediately ends the call
TWIML_HANGUP = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN WEBHOOK — called by Twilio automatically on missed call
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/sms-webhook",
    response_class=PlainTextResponse,
    summary="Twilio missed-call webhook",
)
async def sms_webhook(
    From: str = Form(default=""),   # caller's E.164 phone number
    To:   str = Form(default=""),
    CallStatus: str = Form(default=""),
):
    """
    Twilio fires this POST when a call comes in.
    We hang up immediately (free for farmer) then send them an SMS.
    """
    caller = From.strip()
    logger.info(f"[Webhook] Incoming call from {caller} | status={CallStatus}")

    if not caller:
        return PlainTextResponse(TWIML_HANGUP, media_type="text/xml")

    # Run the full pipeline (errors are caught so Twilio always gets a clean response)
    try:
        await _run_sms_pipeline(caller)
    except Exception as e:
        logger.error(f"[Webhook] Pipeline error for {caller}: {e}")

    # Always return valid TwiML — this tells Twilio to hang up cleanly
    return PlainTextResponse(TWIML_HANGUP, media_type="text/xml")


# ══════════════════════════════════════════════════════════════════════════════
#  DEMO TRIGGER — POST body with phone number (for hackathon testing)
# ══════════════════════════════════════════════════════════════════════════════

class TriggerRequest(BaseModel):
    phone: str   # 10-digit or +91XXXXXXXXXX


@router.post("/trigger-sms", summary="Manually trigger the SMS pipeline (demo/test)")
async def trigger_sms(req: TriggerRequest):
    """
    For hackathon demo: simulates a missed call without an actual phone call.
    Send a POST with {"phone": "9845XXXXXX"} and the farmer gets an SMS.
    """
    result = await _run_sms_pipeline(format_phone_e164(req.phone))
    return result


# ══════════════════════════════════════════════════════════════════════════════
#  CORE PIPELINE
# ══════════════════════════════════════════════════════════════════════════════

async def _run_sms_pipeline(phone_e164: str) -> dict:
    """
    The complete missed-call → SMS pipeline.
    Returns a dict describing what was sent (useful for /trigger-sms response).
    """
    db = get_db()

    # ── Step 1: Normalize phone ───────────────────────────────────────────────
    # Strip +91 prefix for DB lookup (stored as 10-digit in some cases)
    phone_10 = phone_e164.lstrip("+").lstrip("91") if phone_e164.startswith("+91") else phone_e164

    # ── Step 2: Lookup farmer by phone ───────────────────────────────────────
    farmer = await db.farmers.find_one({
        "$or": [{"phone": phone_e164}, {"phone": phone_10}]
    })

    if not farmer:
        # Unknown number — send a registration prompt
        msg = (
            "Hello! You called KrishiConnect.\n"
            "To get crop prices by missed call, please register at your "
            "nearest Hobli Agriculture Office.\n"
            "It's free! 🌾"
        )
        send_sms(phone_e164, msg)
        logger.info(f"[Pipeline] Unregistered number {phone_e164} — sent registration prompt")
        return {"status": "unregistered", "sms_sent": True}

    crop_info = farmer.get("current_crop", {})
    crop_name = crop_info.get("crop_name", "")
    district  = farmer.get("district", "")
    language  = farmer.get("language", "en")
    name      = farmer.get("name", "Farmer")

    if not crop_name:
        msg = f"Hello {name}! Please update your crop details at the Hobli office or krishiconnect.in"
        send_sms(phone_e164, msg)
        return {"status": "no_crop", "sms_sent": True}

    # ── Step 3: Fetch live crop price ────────────────────────────────────────
    price_record = await get_price_for_crop(db, crop_name, district)

    if price_record:
        price    = price_record.get("price_modal", 0) or price_record.get("price_max", 0)
        mandi    = price_record.get("mandi", "Nearest APMC")
        district = price_record.get("district", district)
    else:
        # No price data yet — use a fallback message
        price    = 0
        mandi    = "Check local APMC"

    # ── Step 4: Find nearest buyer ───────────────────────────────────────────
    buyer_doc = await db.buyers.find_one({
        "$or": [
            {"crops": {"$regex": crop_name, "$options": "i"}},
            {"crops": crop_name},
        ],
        "district": {"$regex": district, "$options": "i"},
    })

    if buyer_doc:
        buyer_name = buyer_doc.get("name", "Local Trader")
        buyer_ph   = buyer_doc.get("phone", "Contact Hobli office")
    else:
        buyer_name = "Contact Hobli office"
        buyer_ph   = "for buyer details"

    # ── Step 5: Get top active scheme ────────────────────────────────────────
    active_schemes = await get_active_schemes(db, language=language)
    if active_schemes:
        top_scheme = active_schemes[0].get("display_name", active_schemes[0]["name"])
    else:
        top_scheme = "PM-KISAN — apply at pmkisan.gov.in"

    # ── Step 6: Build SMS in farmer's language ───────────────────────────────
    if price > 0:
        sms_text = build_sms(
            language  = language,
            crop      = crop_name,
            price     = price,
            mandi     = mandi,
            district  = district,
            buyer     = buyer_name,
            buyer_ph  = buyer_ph,
            scheme    = top_scheme,
        )
    else:
        # Price not available yet — still useful partial SMS
        no_price_msgs = {
            "kn": f"{crop_name} ಬೆಲೆ ಲಭ್ಯವಿಲ್ಲ. ಮಂಡಿ: {mandi}. ಖರೀದಿದಾರ: {buyer_name} {buyer_ph}. ಯೋಜನೆ: {top_scheme}",
            "en": f"Price for {crop_name} not yet updated. Mandi: {mandi}. Buyer: {buyer_name} {buyer_ph}. Scheme: {top_scheme}",
            "hi": f"{crop_name} का भाव उपलब्ध नहीं। मंडी: {mandi}। खरीदार: {buyer_name} {buyer_ph}।",
            "te": f"{crop_name} ధర అందుబాటులో లేదు. మండి: {mandi}. కొనుగోలుదారు: {buyer_name} {buyer_ph}.",
        }
        sms_text = no_price_msgs.get(language, no_price_msgs["en"])

    # ── Step 7: Send SMS ─────────────────────────────────────────────────────
    sent = send_sms(phone_e164, sms_text)

    logger.info(
        f"[Pipeline] ✅ {name} | crop={crop_name} | price=₹{price} | "
        f"mandi={mandi} | lang={language} | sms_sent={sent}"
    )

    return {
        "status":    "ok",
        "farmer":    name,
        "crop":      crop_name,
        "price":     price,
        "mandi":     mandi,
        "buyer":     buyer_name,
        "scheme":    top_scheme,
        "language":  language,
        "sms_sent":  sent,
        "sms_text":  sms_text,   # shown in demo /trigger-sms response
    }
