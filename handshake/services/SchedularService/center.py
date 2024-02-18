from handshake.services.SchedularService.constants import JobType
from handshake.services.SchedularService.handlePending import add_lookup_task
from handshake.services.DBService.lifecycle import init_tortoise_orm
from handshake.services.SchedularService.lifecycle import verify_pending_jobs
from handshake.services.SchedularService.pruneTasks import pruneTasks
from handshake.services.SchedularService.deleteRuns import addDeleteJob
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger
from datetime import datetime
from typing import List
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.config_base import ConfigBase, ConfigKeys
from handshake.services.DBService.models.result_base import RunBase, Status
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
    # since we are starting a-new we would just pick the ones which are picked previously
    prev_picked_tasks = await TaskBase.filter(processed=False, picked=True).all()
    reset_test_run = await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()

    to_modify_test_runs = (
        await TaskBase.filter(type=JobType.MODIFY_TEST_RUN, processed=True).all()
        if reset_test_run.value
        else []
    )

    to_pick = prev_picked_tasks + to_modify_test_runs
    for task in to_pick:
        logger.info("scheduling old task {} for this iteration", task.ticketID)
        task.picked = False
        task.processed = False

    if to_pick:
        await TaskBase.bulk_update(to_pick, ("picked", "processed"), 100)

    runs = []
    for ticket in to_modify_test_runs:
        test = await ticket.test
        test.standing = "PENDING"
        runs.append(test)

    if runs:
        await RunBase.bulk_update(runs, ("standing",), 100)

    if reset_test_run:
        reset_test_run.value = ""
        await reset_test_run.save()


async def init_jobs_connections(
    db_path: Path, _scheduler: AsyncIOScheduler, mapped: List[bool]
):
    await init_tortoise_orm(db_path, True)
    await pick_previous_tasks()
    addDeleteJob(_scheduler, db_path, mapped)
    add_lookup_task(_scheduler)
