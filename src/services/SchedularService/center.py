from src.services.SchedularService.constants import JobType
from src.services.SchedularService.handlePending import lookup_for_tasks
from src.services.DBService.models.config_base import ConfigBase
from src.services.DBService.lifecycle import init_tortoise_orm, close_connection
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from asyncio import get_event_loop, run
from loguru import logger
from datetime import datetime
from src.services.DBService.models.task_base import TaskBase


def init_scheduler(db_path: str):
    logger.info("Starting the scheduler service...")
    __scheduler = AsyncIOScheduler({"logger": logger})
    __scheduler.add_job(
        init_jobs_connections, id=JobType.INIT_CONNECTION_JOBS,
        args=(db_path, __scheduler), next_run_time=datetime.now()
    )
    __scheduler.start()
    logger.info("Scheduler service is now online")

    loop = get_event_loop()
    try:
        loop.run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("as per request, we will not pick new tasks, hence completing the pending ones")
        # __scheduler.shutdown(wait=True)
        logger.info("Requested for the service termination, request accepted.")
        # loop.run(
        #     close_connection()
        # )
    finally:
        logger.info("as per request, we will not pick new tasks, hence completing the pending ones")
        loop.close()


async def init_jobs_connections(db_path: str, _scheduler: AsyncIOScheduler):
    await init_tortoise_orm(db_path)
    logger.info("DB Services are now online 🌍")
    config = await ConfigBase.first()

    prev_picked_tasks = await TaskBase.filter(picked=True).all()
    for task in prev_picked_tasks:
        logger.info("scheduling old task {} for this iteration", task.ticketID)
        task.picked = False
    await TaskBase.bulk_update(prev_picked_tasks, ("picked", ), 100)

    _scheduler.add_job(
        lookup_for_tasks, "interval", seconds=config.lookupFreq, id=JobType.LOOKUP_JOB,
        name="clearing up the pending tasks if present", args=(_scheduler, )
    )
