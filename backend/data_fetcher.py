"""
data_fetcher.py — Fetches live crop prices and government scheme data from:

  1. data.gov.in  — official open government data API (free, no auth needed)
  2. Agmarknet    — National Agriculture Market price portal
  3. eNAM portal  — electronic National Agriculture Market
  4. BeautifulSoup scraper fallback for scheme pages

The scheduler (scheduler.py) calls refresh_all_prices() and
refresh_all_schemes() every 15 minutes in the background.
"""

import os
import httpx
import asyncio
import logging
from datetime import datetime
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ── data.gov.in config ────────────────────────────────────────────────────────
# Free API — get your key at https://data.gov.in/user/register
# Resource IDs for commodity prices datasets on data.gov.in:
DATA_GOV_API_KEY     = os.getenv("DATA_GOV_API_KEY", "579b464db66ec23d318f0000")  # demo key
DATA_GOV_BASE        = "https://api.data.gov.in/resource"
AGMARKNET_RESOURCE   = "9ef84268-d588-465a-a308-a864a43d0070"   # Agmarknet daily arrival/price

# ── Target districts & crops (expand as needed) ───────────────────────────────
TARGET_STATES    = ["Karnataka", "Telangana", "Tamil Nadu", "Maharashtra"]
TARGET_CROPS     = ["Tomato", "Onion", "Rice", "Ragi", "Groundnut", "Wheat",
                    "Cotton", "Maize", "Sugarcane", "Soybean", "Potato", "Cabbage"]


# ══════════════════════════════════════════════════════════════════════════════
#  CROP PRICES
# ══════════════════════════════════════════════════════════════════════════════

async def fetch_prices_from_data_gov(state: str, crop: str) -> list[dict]:
    """
    Hits the data.gov.in Agmarknet commodity prices API.
    Returns a list of price dicts: {crop, district, mandi, price_min,
    price_max, price_modal, unit, fetched_at}
    """
    url = f"{DATA_GOV_BASE}/{AGMARKNET_RESOURCE}"
    params = {
        "api-key": DATA_GOV_API_KEY,
        "format":  "json",
        "limit":   100,
        "filters[State.keyword]":     state,
        "filters[Commodity.keyword]": crop,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        records = data.get("records", [])
        prices  = []

        for r in records:
            try:
                prices.append({
                    "crop":         r.get("Commodity", crop),
                    "state":        r.get("State", state),
                    "district":     r.get("District", ""),
                    "mandi":        r.get("Market", ""),
                    "variety":      r.get("Variety", ""),
                    "price_min":    float(r.get("Min Price",   0) or 0),
                    "price_max":    float(r.get("Max Price",   0) or 0),
                    "price_modal":  float(r.get("Modal Price", 0) or 0),
                    "unit":         "quintal",
                    "arrival_date": r.get("Arrival_Date", ""),
                    "fetched_at":   datetime.utcnow(),
                    "source":       "data.gov.in/agmarknet",
                })
            except (ValueError, TypeError):
                continue

        logger.info(f"  data.gov.in → {state}/{crop}: {len(prices)} records")
        return prices

    except httpx.HTTPStatusError as e:
        logger.warning(f"  data.gov.in HTTP error for {state}/{crop}: {e.response.status_code}")
        return []
    except Exception as e:
        logger.warning(f"  data.gov.in fetch failed for {state}/{crop}: {e}")
        return []


async def fetch_prices_agmarknet_scrape(crop: str, state: str = "Karnataka") -> list[dict]:
    """
    Lightweight BeautifulSoup scrape of Agmarknet's public price table
    as a fallback when the API quota is exhausted.
    URL pattern: http://agmarknet.gov.in/SearchCmmMkt.aspx
    """
    url = "http://agmarknet.gov.in/SearchCmmMkt.aspx"
    payload = {
        "Tx_Commodity": crop,
        "Tx_State":     state,
        "Tx_District":  "0",
        "Tx_Market":    "0",
        "DateFrom":     datetime.now().strftime("%d-%b-%Y"),
        "DateTo":       datetime.now().strftime("%d-%b-%Y"),
        "Fr_Date":      datetime.now().strftime("%d-%b-%Y"),
        "To_Date":      datetime.now().strftime("%d-%b-%Y"),
        "Tx_Trend":     "0",
        "Tx_CommodityHead": crop,
        "Tx_StateHead":    state,
    }

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.post(url, data=payload)
            resp.raise_for_status()

        soup  = BeautifulSoup(resp.text, "html.parser")
        table = soup.find("table", {"id": "cphBody_GridPriceData"})
        if not table:
            return []

        prices = []
        rows   = table.find_all("tr")[1:]   # skip header

        for row in rows:
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 8:
                continue
            try:
                prices.append({
                    "crop":        cols[2],
                    "state":       state,
                    "district":    cols[1],
                    "mandi":       cols[3],
                    "variety":     cols[4],
                    "price_min":   float(cols[5].replace(",", "") or 0),
                    "price_max":   float(cols[6].replace(",", "") or 0),
                    "price_modal": float(cols[7].replace(",", "") or 0),
                    "unit":        "quintal",
                    "fetched_at":  datetime.utcnow(),
                    "source":      "agmarknet_scrape",
                })
            except (ValueError, IndexError):
                continue

        logger.info(f"  Agmarknet scrape → {state}/{crop}: {len(prices)} records")
        return prices

    except Exception as e:
        logger.warning(f"  Agmarknet scrape failed for {state}/{crop}: {e}")
        return []


async def refresh_all_prices(db) -> int:
    """
    Called by scheduler every 15 minutes.
    Fetches prices for all TARGET_CROPS × TARGET_STATES,
    upserts into MongoDB crop_prices collection.
    Returns total records saved.
    """
    total = 0
    tasks = []

    for state in TARGET_STATES:
        for crop in TARGET_CROPS:
            tasks.append(fetch_prices_from_data_gov(state, crop))

    results = await asyncio.gather(*tasks)

    for price_list in results:
        for price in price_list:
            if price["price_modal"] <= 0:
                continue
            # Upsert: unique key = crop + district + mandi
            await db.crop_prices.update_one(
                {
                    "crop":     price["crop"],
                    "district": price["district"],
                    "mandi":    price["mandi"],
                },
                {"$set": price},
                upsert=True,
            )
            total += 1

    # If data.gov.in returned nothing, fall back to Agmarknet scrape for Karnataka
    if total == 0:
        logger.warning("data.gov.in returned 0 records — falling back to Agmarknet scrape")
        for crop in TARGET_CROPS[:5]:   # scrape top 5 crops only to be polite
            fallback = await fetch_prices_agmarknet_scrape(crop)
            for price in fallback:
                await db.crop_prices.update_one(
                    {"crop": price["crop"], "district": price["district"], "mandi": price["mandi"]},
                    {"$set": price},
                    upsert=True,
                )
                total += 1

    logger.info(f"✅ Price refresh complete: {total} records saved")
    return total


async def get_price_for_crop(db, crop: str, district: str) -> dict | None:
    """
    Returns the best matching price record for a given crop + district.
    Falls back to state-wide average if no exact district match.
    """
    # Exact match first
    record = await db.crop_prices.find_one(
        {"crop": {"$regex": crop, "$options": "i"},
         "district": {"$regex": district, "$options": "i"}},
        sort=[("fetched_at", -1)],
    )
    if record:
        return record

    # State-wide fallback (any district)
    record = await db.crop_prices.find_one(
        {"crop": {"$regex": crop, "$options": "i"}},
        sort=[("fetched_at", -1)],
    )
    return record


# ══════════════════════════════════════════════════════════════════════════════
#  GOVERNMENT SCHEMES
# ══════════════════════════════════════════════════════════════════════════════

# Static seed data (authoritative source: india.gov.in / agricoop.nic.in)
# These change infrequently — refreshed once per day.
STATIC_SCHEMES = [
    {
        "name":        "PM-KISAN Samman Nidhi",
        "name_kn":     "ಪಿಎಂ-ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ",
        "name_te":     "పీఎం-కిసాన్ సమ్మాన్ నిధి",
        "name_hi":     "पीएम-किसान सम्मान निधि",
        "description": "₹6,000/year direct benefit transfer in 3 installments to small/marginal farmers.",
        "deadline":    "Rolling — apply anytime via pmkisan.gov.in",
        "apply_url":   "https://pmkisan.gov.in",
        "active":      True,
        "category":    "income_support",
    },
    {
        "name":        "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "name_kn":     "ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ",
        "name_te":     "ప్రధానమంత్రి ఫసల్ బీమా యోజన",
        "name_hi":     "प्रधानमंत्री फसल बीमा योजना",
        "description": "Crop insurance against natural calamities, pests & diseases. Low premium (2% Kharif, 1.5% Rabi).",
        "deadline":    "Kharif: before sowing | Rabi: Nov–Dec",
        "apply_url":   "https://pmfby.gov.in",
        "active":      True,
        "category":    "crop_insurance",
    },
    {
        "name":        "Kisan Credit Card (KCC)",
        "name_kn":     "ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್",
        "name_te":     "కిసాన్ క్రెడిట్ కార్డ్",
        "name_hi":     "किसान क्रेडिट कार्ड",
        "description": "Flexible credit up to ₹3 lakh at 4% p.a. for crop production, post-harvest expenses & allied activities.",
        "deadline":    "Open enrollment — apply at any bank",
        "apply_url":   "https://www.nabard.org/content.aspx?id=572",
        "active":      True,
        "category":    "credit",
    },
    {
        "name":        "eNAM — National Agriculture Market",
        "name_kn":     "ಇ-ನ್ಯಾಮ್ ರಾಷ್ಟ್ರೀಯ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ",
        "name_te":     "ఈ-నామ్ జాతీయ వ్యవసాయ మార్కెట్",
        "name_hi":     "ई-नाम राष्ट्रीय कृषि बाजार",
        "description": "List your produce on the national online trading platform. Get competitive bids from buyers across India.",
        "deadline":    "Always open — register at enam.gov.in",
        "apply_url":   "https://enam.gov.in",
        "active":      True,
        "category":    "market_access",
    },
    {
        "name":        "Soil Health Card Scheme",
        "name_kn":     "ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಯೋಜನೆ",
        "name_te":     "నేల ఆరోగ్య కార్డు పథకం",
        "name_hi":     "मृदा स्वास्थ्य कार्ड योजना",
        "description": "Free soil testing every 2 years + nutrient recommendations to improve yield and reduce input costs.",
        "deadline":    "Year-round — contact your local KVK",
        "apply_url":   "https://soilhealth.dac.gov.in",
        "active":      True,
        "category":    "soil_health",
    },
    {
        "name":        "Raitha Siri (Karnataka)",
        "name_kn":     "ರೈತ ಸಿರಿ ಯೋಜನೆ",
        "name_te":     "",
        "name_hi":     "",
        "description": "Karnataka state scheme: input subsidy + equipment assistance for small farmers.",
        "deadline":    "Seasonal — check with Hobli office",
        "apply_url":   "https://raitamitra.karnataka.gov.in",
        "active":      True,
        "category":    "state_scheme",
    },
]


async def refresh_all_schemes(db) -> int:
    """Upsert all static schemes into MongoDB once per day."""
    for scheme in STATIC_SCHEMES:
        await db.schemes.update_one(
            {"name": scheme["name"]},
            {"$set": {**scheme, "updated_at": datetime.utcnow()}},
            upsert=True,
        )
    logger.info(f"✅ Scheme refresh: {len(STATIC_SCHEMES)} schemes upserted")
    return len(STATIC_SCHEMES)


async def get_active_schemes(db, language: str = "en", category: str | None = None) -> list[dict]:
    """Return active schemes, optionally filtered by category."""
    query = {"active": True}
    if category:
        query["category"] = category

    cursor = db.schemes.find(query)
    schemes = []
    async for s in cursor:
        s.pop("_id", None)
        # Return the localised name if available
        lang_key = f"name_{language}"
        if language != "en" and s.get(lang_key):
            s["display_name"] = s[lang_key]
        else:
            s["display_name"] = s["name"]
        schemes.append(s)
    return schemes
