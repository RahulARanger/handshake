from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.services.SchedularService.updateRecords import find_and_update_suites
from apscheduler.triggers.interval import IntervalTrigger


async def create_scheduler_and_tasks():
    schedular = AsyncIOScheduler()
    schedular.add_job(
        find_and_update_suites, IntervalTrigger(seconds=3), coalesce=True, replace_existing=True,
        name="update suites", id='update-suites'
    )
    schedular.start()
    return schedular
