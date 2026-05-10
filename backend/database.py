"""
database.py — MongoDB Atlas connection via Motor (async driver).

Collections created automatically on first use:
  farmers        — registered farmer profiles (phone as unique key)
  crop_prices    — latest mandi prices fetched from Agmarknet / data.gov.in
  schemes        — government scheme info
  buyers         — verified APMC trader contacts
  hobli_offices  — Hobli office staff credentials
  otp_store      — temporary OTP storage (TTL index auto-expires in 5 min)
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "krishiconnect")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    await _ensure_indexes()
    logger.info(f"DONE: Connected to MongoDB: {DB_NAME}")


async def close_db():
    if client:
        client.close()
        logger.info("MongoDB connection closed")


async def _ensure_indexes():
    """Create indexes once at startup for fast lookups."""
    # farmers: unique phone + text search on name
    await db.farmers.create_index("phone", unique=True)
    await db.farmers.create_index("hobli_id")

    # crop_prices: fast lookup by crop + district
    await db.crop_prices.create_index([("crop", 1), ("district", 1)])

    # otp_store: auto-expire after 300 seconds
    await db.otp_store.create_index("created_at", expireAfterSeconds=300)

    # schemes: filter by active status
    await db.schemes.create_index("active")

    logger.info("DONE: MongoDB indexes ensured")


def get_db():
    return db
