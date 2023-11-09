from graspit.services.SchedularService.constants import JobType
from graspit.services.SchedularService.handlePending import add_lookup_task
from graspit.services.DBService.lifecycle import init_tortoise_orm
from graspit.services.SchedularService.lifecycle import verify_pending_jobs
from graspit.services.SchedularService.pruneTasks import pruneTasks
from graspit.services.SchedularService.deleteRuns import addDeleteJob
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger
from datetime import datetime
from typing import List
from graspit.services.DBService.models.dynamic_base import TaskBase
from apscheduler.events import EVENT_JOB_EXECUTED
from pathlib import Path


def start_service(db_path: Path) -> AsyncIOScheduler:
    logger.info("Starting the scheduler service...")
    __scheduler = AsyncIOScheduler({"logger": logger})

    # for deletes
    mapped = [False]

    __scheduler.add_job(
        init_jobs_connections,
        id=JobType.INIT_CONNECTION_JOBS,
        args=(db_path, __scheduler, mapped),
        next_run_time=datetime.now(),
    )
    # safe function #1
    # scheduler closes itself whenever it's jobs are done

    __scheduler.add_listener(
        lambda _: verify_pending_jobs(__scheduler, mapped), EVENT_JOB_EXECUTED
    )
    __scheduler.start()
    return __scheduler


async def pick_previous_tasks():
    await pruneTasks()
    prev_picked_tasks = await TaskBase.filter(picked=True).all()
    for task in prev_picked_tasks:
        logger.info("scheduling old task {} for this iteration", task.ticketID)
        task.picked = False
    await TaskBase.bulk_update(prev_picked_tasks, ("picked",), 100)


async def init_jobs_connections(
    db_path: str, _scheduler: AsyncIOScheduler, mapped: List[bool]
):
    await init_tortoise_orm(db_path)
    logger.info("DB Services are now online 🌍")
    await pick_previous_tasks()

    addDeleteJob(_scheduler, db_path, mapped)
    add_lookup_task(_scheduler)
