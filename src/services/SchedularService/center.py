from src.services.SchedularService.constants import JobType
from src.services.SchedularService.handlePending import lookup_for_tasks
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.services.DBService.lifecycle import init_tortoise_orm, close_connection
from src.services.SchedularService.specific import init_scheduler as start_service, _scheduler
from asyncio import run, get_event_loop
from loguru import logger


async def close_service():
    await close_connection()
    await _scheduler.shutdown(wait=True)


async def init_scheduler(db_path: str):
    __scheduler = start_service()

    await init_tortoise_orm(db_path)

    __scheduler.add_job(
        lookup_for_tasks, "interval", seconds=2,
        id=JobType.LOOKUP_JOB, name='lookup for tasks', max_instances=1,
    )

    __scheduler.start()
    logger.info("Scheduler and DB services have started")
    return __scheduler


def run_service(db_path: str):
    try:
        run(
            init_scheduler(db_path)
        )
    except KeyboardInterrupt:
        logger.warning("Received a request to shutdown the scheduler")
        run(
            close_service()
        )
    finally:
        logger.info("Bye!, done")
        exit(0)
