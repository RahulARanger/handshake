from apscheduler.schedulers.asyncio import AsyncIOScheduler

_scheduler = None


def init_scheduler():
    global _scheduler
    _scheduler = AsyncIOScheduler()
    return _scheduler
