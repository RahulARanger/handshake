import sys
from asyncio import get_event_loop
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from nextpyreports.services.DBService.models.dynamic_base import TaskBase
from nextpyreports.services.DBService.lifecycle import close_connection
from nextpyreports.services.SchedularService.constants import JobType
from datetime import datetime
from loguru import logger


def verify_pending_jobs(scheduler: AsyncIOScheduler):
    scheduler.add_job(
        say_bye_if_required,
        id=JobType.EXECUTOR,
        name='execute-loop-if-required',
        next_run_time=datetime.now(),
        coalesce=True
    )


async def say_bye_if_required():
    pending_tasks = await TaskBase.all().count()
    if pending_tasks > 0:
        return

    logger.info("No Pending Tasks found, shutting down loop")
    await close_connection()
    logger.info("DB Services are now offline.")
    current_running_loop = get_event_loop()
    current_running_loop.stop()


def start_loop():
    loop = get_event_loop()
    try:
        loop.run_forever()  # blocking
    except (SystemExit, KeyboardInterrupt):
        pass
    finally:
        if loop.is_running():
            loop.close()
