"""
seed.py — Populate MongoDB with demo data for hackathon judging.

Run once: python seed.py

Seeds:
  • 6 test farmers (Karnataka + Telangana)
  • 10 crop prices (realistic 2026 values)
  • 5 verified buyers
  • 1 hobli office admin
  • All 6 government schemes
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "krishiconnect")


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]

    print("Seeding KrishiConnect database...\n")

    # ── Hobli office staff ────────────────────────────────────────────────────
    await db.hobli_offices.drop()
    await db.hobli_offices.insert_many([
        {
            "unique_id":   "admin123",
            "password":    "password123",
            "hobli_id":    "ramanagara_001",
            "district":    "Ramanagara",
            "staff_name":  "Demo Admin",
            "hobli_name":  "Ramanagara Hobli Office",
        },
        {
            "unique_id":   "hobli_kana",
            "password":    "kana2026",
            "hobli_id":    "kanakapura_001",
            "district":    "Kanakapura",
            "staff_name":  "Kavitha S",
            "hobli_name":  "Kanakapura Hobli Office",
        },
    ])
    print("DONE: Hobli offices seeded")

    # ── Farmers ───────────────────────────────────────────────────────────────
    await db.farmers.drop()
    farmers = [
        {
            "name": "Rajesh Kumar", "phone": "9876543210",
            "hobli_id": "ramanagara_001", "district": "Ramanagara",
            "language": "kn", "acres": 3.5,
            "current_crop": {
                "crop_name": "Tomato", "village": "Kanakapura",
                "survey_number": "SV-001", "surnoc": "SN-123", "hissa_no": "H-45",
                "sowing_date": "2026-04-15", "harvest_month": "July 2026", "status": "Growing",
            },
            "crop_history": [
                {"crop_name": "Rice", "village": "Kanakapura", "sowing_date": "2025-11-10",
                 "harvest_date": "2026-03-15", "status": "Harvested"},
            ],
            "registered_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        },
        {
            "name": "Suresh Patil", "phone": "9876543211",
            "hobli_id": "ramanagara_001", "district": "Ramanagara",
            "language": "kn", "acres": 2.0,
            "current_crop": {
                "crop_name": "Rice", "village": "Ramanagara",
                "survey_number": "SV-002", "surnoc": "SN-124", "hissa_no": "H-46",
                "sowing_date": "2026-04-20", "harvest_month": "October 2026", "status": "Growing",
            },
            "crop_history": [],
            "registered_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        },
        {
            "name": "Vijay Singh", "phone": "9876543212",
            "hobli_id": "kanakapura_001", "district": "Kanakapura",
            "language": "kn", "acres": 5.0,
            "current_crop": {
                "crop_name": "Ragi", "village": "Channapatna",
                "survey_number": "SV-003", "surnoc": "SN-125", "hissa_no": "H-47",
                "sowing_date": "2026-04-10", "harvest_month": "August 2026", "status": "Growing",
            },
            "crop_history": [],
            "registered_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        },
        {
            "name": "Lakshmi Devi", "phone": "9988776655",
            "hobli_id": "ramanagara_001", "district": "Ramanagara",
            "language": "te", "acres": 1.5,
            "current_crop": {
                "crop_name": "Onion", "village": "Bidadi",
                "survey_number": "SV-004", "surnoc": "SN-126", "hissa_no": "H-48",
                "sowing_date": "2026-03-01", "harvest_month": "June 2026", "status": "Growing",
            },
            "crop_history": [],
            "registered_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        },
        {
            "name": "Ramu Nayak", "phone": "9900001111",
            "hobli_id": "kanakapura_001", "district": "Kanakapura",
            "language": "kn", "acres": 4.0,
            "current_crop": {
                "crop_name": "Groundnut", "village": "Sathanur",
                "survey_number": "SV-005", "surnoc": "SN-127", "hissa_no": "H-49",
                "sowing_date": "2026-04-05", "harvest_month": "September 2026", "status": "Growing",
            },
            "crop_history": [],
            "registered_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        },
    ]
    # Add phone index after drop
    await db.farmers.create_index("phone", unique=True)
    await db.farmers.insert_many(farmers)
    print(f"DONE: {len(farmers)} farmers seeded")

    # ── Crop Prices ───────────────────────────────────────────────────────────
    await db.crop_prices.drop()
    prices = [
        {"crop": "Tomato",    "state": "Karnataka", "district": "Ramanagara", "mandi": "Ramanagara APMC",
         "price_min": 2200, "price_max": 3100, "price_modal": 2840, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Onion",     "state": "Karnataka", "district": "Ramanagara", "mandi": "Ramanagara APMC",
         "price_min": 1200, "price_max": 1800, "price_modal": 1520, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Rice",      "state": "Karnataka", "district": "Ramanagara", "mandi": "Kanakapura APMC",
         "price_min": 2800, "price_max": 3400, "price_modal": 3100, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Ragi",      "state": "Karnataka", "district": "Kanakapura", "mandi": "Channapatna APMC",
         "price_min": 3500, "price_max": 4100, "price_modal": 3800, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Groundnut", "state": "Karnataka", "district": "Kanakapura", "mandi": "Sathanur Mandi",
         "price_min": 5200, "price_max": 6000, "price_modal": 5640, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Wheat",     "state": "Karnataka", "district": "Ramanagara", "mandi": "Ramanagara APMC",
         "price_min": 2400, "price_max": 2800, "price_modal": 2600, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Cotton",    "state": "Karnataka", "district": "Kanakapura", "mandi": "Channapatna APMC",
         "price_min": 6200, "price_max": 7000, "price_modal": 6600, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Maize",     "state": "Karnataka", "district": "Ramanagara", "mandi": "Ramanagara APMC",
         "price_min": 1800, "price_max": 2200, "price_modal": 2000, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Tomato",    "state": "Telangana", "district": "Kurnool", "mandi": "Kurnool APMC",
         "price_min": 2400, "price_max": 3200, "price_modal": 2900, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
        {"crop": "Rice",      "state": "Telangana", "district": "Nizamabad", "mandi": "Nizamabad APMC",
         "price_min": 2900, "price_max": 3600, "price_modal": 3250, "unit": "quintal",
         "fetched_at": datetime.utcnow(), "source": "seed"},
    ]
    await db.crop_prices.insert_many(prices)
    print(f"DONE: {len(prices)} crop prices seeded")

    # ── Buyers ────────────────────────────────────────────────────────────────
    await db.buyers.drop()
    buyers = [
        {"name": "Ramesh Traders",    "phone": "9900123456", "district": "Ramanagara",
         "crops": ["Tomato", "Onion", "Ragi"], "verified": True},
        {"name": "Suresh Agro Pvt Ltd", "phone": "9900234567", "district": "Ramanagara",
         "crops": ["Rice", "Wheat", "Maize"], "verified": True},
        {"name": "Karnataka Fresh Co", "phone": "9900345678", "district": "Kanakapura",
         "crops": ["Tomato", "Onion", "Potato"], "verified": True},
        {"name": "Deccan Oilseeds",    "phone": "9900456789", "district": "Kanakapura",
         "crops": ["Groundnut", "Soybean", "Cotton"], "verified": True},
        {"name": "Nandini Agro Traders","phone": "9900567890", "district": "Ramanagara",
         "crops": ["Cotton", "Ragi", "Groundnut"], "verified": True},
    ]
    await db.buyers.insert_many(buyers)
    print(f"DONE: {len(buyers)} buyers seeded")

    # ── Schemes (also loaded by data_fetcher on startup) ──────────────────────
    from data_fetcher import refresh_all_schemes
    n = await refresh_all_schemes(db)
    print(f"DONE: {n} government schemes seeded")

    print("\nDatabase seeded successfully! You can now run: uvicorn main:app --reload")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
