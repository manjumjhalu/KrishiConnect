import os
from dotenv import load_dotenv
from pymongo import MongoClient
import sys

# Add smsAndcall path to load its mongo_config if needed, or just do it directly
load_dotenv(dotenv_path="e:/KrishiConnect/backend/smsAndcall/.env")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

try:
    client = MongoClient(MONGO_URI)
    db = client["krishiconnect"]
    farmers_collection = db["farmers"]
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    sys.exit(1)

farmers_data = {
    "9019263545": {
        "crop": "ಟೊಮೇಟೊ",
        "pani_no": "PNI2026001",
        "location_kn": "ರಾಮನಗರ",
        "price": "₹2840 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",
        "language": "Kannada"
    },
    "8217495270": {
        "crop": "ಅಕ್ಕಿ",
        "pani_no": "PNI2026002",
        "location_kn": "ಮಂಡ್ಯ",
        "price": "₹3200 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",
        "language": "Kannada"
    },
    "7483507306": {
        "crop": "ಮೆಕ್ಕೆಜೋಳ",
        "pani_no": "PNI2026003",
        "location_kn": "ಹಾಸನ",
        "price": "₹2100 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",
        "language": "Kannada"
    },
    "8123796771": {
        "crop": "ಮೆಕ್ಕೆಜೋಳ",
        "pani_no": "PNI2026004",
        "location_kn": "ಹಾಸನ",
        "price": "₹2100 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",
        "language": "Kannada"
    }
}

count = 0
for phone, data in farmers_data.items():
    result = farmers_collection.update_many(
        {"phone": {"$regex": f".*{phone}$"}},
        {"$set": {
            "pani_no": data["pani_no"],
            "language": data["language"]
        }}
    )
    count += result.modified_count

print(f"Updated {count} farmers with pani_no and language.")
