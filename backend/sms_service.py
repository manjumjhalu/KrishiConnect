"""
sms_service.py — Twilio SMS delivery + regional language SMS templates.

Supported languages: en, kn (Kannada), hi (Hindi), te (Telugu), ta (Tamil), ml (Malayalam)
"""

import os
import requests
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

EXOTEL_API_KEY = os.getenv("EXOTEL_API_KEY", "")
EXOTEL_API_TOKEN = os.getenv("EXOTEL_API_TOKEN", "")
EXOTEL_ACCOUNT_SID = os.getenv("EXOTEL_ACCOUNT_SID", "")
EXOTEL_SUBDOMAIN = os.getenv("EXOTEL_SUBDOMAIN", "api.exotel.com")
EXOTEL_SMS_SENDER = os.getenv("EXOTEL_SMS_SENDER", "EXOTEL")

# ── SMS Templates per language ────────────────────────────────────────────────
# Variables: {crop}, {price}, {mandi}, {district}, {buyer}, {buyer_ph}, {scheme}
SMS_TEMPLATES = {
    "en": (
        "KrishiConnect:\n"
        "Crop: {crop} | Price: Rs.{price}/qtl\n"
        "Mandi: {mandi}, {district}\n"
        "Buyer: {buyer} - {buyer_ph}\n"
        "Scheme: {scheme}\n"
        "For help: reply HELP"
    ),
    "kn": (
        "ಕೃಷಿಕನೆಕ್ಟ್:\n"
        "ಬೆಳೆ: {crop} | ₹{price}/ಕ್ವಿಂ\n"
        "ಮಂಡಿ: {mandi}, {district}\n"
        "ಖರೀದಿದಾರ: {buyer} - {buyer_ph}\n"
        "ಯೋಜನೆ: {scheme}"
    ),
    "hi": (
        "कृषिकनेक्ट:\n"
        "फसल: {crop} | ₹{price}/क्विं\n"
        "मंडी: {mandi}, {district}\n"
        "खरीदार: {buyer} - {buyer_ph}\n"
        "योजना: {scheme}"
    ),
    "te": (
        "కృషికనెక్ట్:\n"
        "పంట: {crop} | ₹{price}/క్విం\n"
        "మండి: {mandi}, {district}\n"
        "కొనుగోలుదారు: {buyer} - {buyer_ph}\n"
        "పథకం: {scheme}"
    ),
    "ta": (
        "கிருஷிகனெக்ட்:\n"
        "பயிர்: {crop} | ₹{price}/குவிண்\n"
        "மார்க்கெட்: {mandi}, {district}\n"
        "வாங்குபவர்: {buyer} - {buyer_ph}\n"
        "திட்டம்: {scheme}"
    ),
    "ml": (
        "കൃഷികണക്ട്:\n"
        "വിള: {crop} | ₹{price}/ക്വിൻ\n"
        "മണ്ടി: {mandi}, {district}\n"
        "വാങ്ങുന്നയാൾ: {buyer} - {buyer_ph}\n"
        "പദ്ധതി: {scheme}"
    ),
}

# Fallback to English if language not found
DEFAULT_LANG = "en"


def build_sms(
    language: str,
    crop: str,
    price: float,
    mandi: str,
    district: str,
    buyer: str,
    buyer_ph: str,
    scheme: str,
) -> str:
    """Fill the language template and return the final SMS string."""
    template = SMS_TEMPLATES.get(language, SMS_TEMPLATES[DEFAULT_LANG])
    return template.format(
        crop=crop,
        price=int(price),
        mandi=mandi,
        district=district,
        buyer=buyer,
        buyer_ph=buyer_ph,
        scheme=scheme,
    )


def send_sms(to_number: str, message: str) -> bool:
    """
    Send SMS via Exotel. Returns True on success, False on failure.
    to_number should be in E.164 format: +919845XXXXXX
    """
    if not EXOTEL_API_KEY or not EXOTEL_API_TOKEN or not EXOTEL_ACCOUNT_SID:
        logger.warning("Exotel credentials not set — SMS not sent (set env vars)")
        logger.info(f"[MOCK SMS] To: {to_number}\n{message}")
        return False

    try:
        clean_number = to_number.replace("+", "")
        
        url = f"https://{EXOTEL_SUBDOMAIN}/v1/Accounts/{EXOTEL_ACCOUNT_SID}/Sms/send.json"
        data = {
            "From": EXOTEL_SMS_SENDER,
            "To": clean_number,
            "Body": message
        }
        
        response = requests.post(url, auth=(EXOTEL_API_KEY, EXOTEL_API_TOKEN), data=data)
        response.raise_for_status()
        
        res_data = response.json()
        sid = res_data.get("SMSMessage", {}).get("Sid", "Unknown")
        
        logger.info(f"✅ SMS sent: SID={sid} | To={to_number}")
        return True
    except Exception as e:
        logger.error(f"❌ Exotel send failed: {e}")
        return False


def format_phone_e164(phone: str) -> str:
    """Convert 10-digit Indian number to E.164 format (+91XXXXXXXXXX)."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        return phone
    if phone.startswith("91") and len(phone) == 12:
        return f"+{phone}"
    if len(phone) == 10:
        return f"+91{phone}"
    return phone  # return as-is if already formatted or unknown
