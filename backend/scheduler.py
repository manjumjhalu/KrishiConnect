"""
scheduler.py — APScheduler background jobs.

  • refresh_prices  — every 15 minutes (Agmarknet / data.gov.in)
  • refresh_schemes — every 24 hours
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
import asyncio

logger = logging.getLogger(__name__)
_scheduler = AsyncIOScheduler()


def start_scheduler():
    from database import get_db
    from data_fetcher import refresh_all_prices, refresh_all_schemes

    async def _price_job():
        db = get_db()
        if db is None:
            return
        try:
            n = await refresh_all_prices(db)
            logger.info(f"[Scheduler] Price refresh: {n} records")
        except Exception as e:
            logger.error(f"[Scheduler] Price refresh error: {e}")

    async def _scheme_job():
        db = get_db()
        if db is None:
            return
        try:
            n = await refresh_all_schemes(db)
            logger.info(f"[Scheduler] Scheme refresh: {n} records")
        except Exception as e:
            logger.error(f"[Scheduler] Scheme refresh error: {e}")

    # Prices every 15 min
    _scheduler.add_job(
        _price_job,
        IntervalTrigger(minutes=15),
        id="refresh_prices",
        replace_existing=True,
    )

    # Schemes once per day
    _scheduler.add_job(
        _scheme_job,
        IntervalTrigger(hours=24),
        id="refresh_schemes",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info("DONE: Scheduler started (prices every 15 min, schemes every 24 h)")

    # Run immediately on startup so DB is not empty on first request
    asyncio.ensure_future(_price_job())
    asyncio.ensure_future(_scheme_job())


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
