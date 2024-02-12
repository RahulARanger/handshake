from asyncio import get_event_loop
from typing import List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.lifecycle import close_connection
from handshake.services.SchedularService.constants import JobType
from datetime import datetime
from loguru import logger
from asyncio import run


def verify_pending_jobs(scheduler: AsyncIOScheduler, mapped: List[bool]):
    # we are adding a job to execute an async function in sync call
    scheduler.add_job(
        say_bye_if_required,
        args=(scheduler, mapped),
        id=JobType.EXECUTOR,
        name="execute-loop-if-required",
        next_run_time=datetime.now(),
        coalesce=True,
    )


async def say_bye_if_required(scheduler: AsyncIOScheduler, mapped: List[bool]):
    pending_tasks = await TaskBase.filter(processed=False).count()

    if len(mapped) > 0 or pending_tasks > 0:
        return

    scheduler.remove_all_jobs()
    # we can't shut down scheduler because you are now inside one of the core job

    # closing db connection
    await close_connection()

    current_running_loop = get_event_loop()
    current_running_loop.stop()


def start_loop():
    loop = get_event_loop()
    try:
        loop.run_forever()  # blocking
    except (KeyboardInterrupt, SystemExit):
        logger.error("Received your signal, closing the loop.")
        run(close_connection())
    finally:
        loop.close()
