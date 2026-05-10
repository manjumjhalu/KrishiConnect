"""
KrishiConnect Backend — main.py
FastAPI application with MongoDB Atlas, Twilio SMS, and live data fetching
from data.gov.in + Agmarknet + government scheme portals.
"""

from fastapi import FastAPI, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from database import connect_db, close_db
from routers import farmers, hobli, sms_webhook, prices, schemes
from scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect DB + start data-refresh scheduler. Shutdown: clean up."""
    await connect_db()
    start_scheduler()
    logger.info("DONE: KrishiConnect backend started")
    yield
    stop_scheduler()
    await close_db()
    logger.info("DONE: KrishiConnect backend stopped")


app = FastAPI(
    title="KrishiConnect API",
    description="Backend for KrishiConnect — real-time crop prices, farmer registration, and SMS alerts.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS: allow the React frontend (Vercel) to call this backend ──────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",       # local Vite dev
        "http://localhost:3000",
        "https://*.vercel.app",        # Vercel preview / prod
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(farmers.router,     prefix="/api/farmers",  tags=["Farmers"])
app.include_router(hobli.router,       prefix="/api/hobli",    tags=["Hobli Admin"])
app.include_router(sms_webhook.router, prefix="/api",          tags=["SMS / Missed-call"])
app.include_router(prices.router,      prefix="/api/prices",   tags=["Crop Prices"])
app.include_router(schemes.router,     prefix="/api/schemes",  tags=["Govt Schemes"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "KrishiConnect API v1.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
