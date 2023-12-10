from handshake.services.DBService.models.result_base import RunBase
from handshake.services.DBService.models.config_base import ConfigBase, ConfigKeys
from handshake.services.SchedularService.constants import (
    JobType,
    writtenAttachmentFolderName,
)
from loguru import logger
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path
from shutil import rmtree
from typing import List
from tortoise.expressions import Q


def addDeleteJob(_scheduler: AsyncIOScheduler, path: Path, mapped: List[bool]):
    _scheduler.add_job(
        deleteOldRuns,
        id=JobType.DELETE_RUNS,
        name="clearing up the old runs",
        args=(path, mapped),
        next_run_time=datetime.now(),
        max_instances=2,
    )


async def deleteOldRuns(db_path: Path, punch_out: List[bool]):
    max_requested = await ConfigBase.filter(key=ConfigKeys.maxRuns).first()
    count_of_all_runs = await RunBase.all().count()

    requested = max(int(max_requested.value), 2)

    if count_of_all_runs <= requested:
        logger.info(
            "Limit not exceeded, hence skipping deleteRuns Job. Found {} but max is {}",
            count_of_all_runs,
            requested,
        )
        return punch_out.pop()

    recently_deleted = count_of_all_runs - requested

    runs = (
        await RunBase.all()
        .order_by("started")
        .limit(count_of_all_runs - requested)
        .values_list("testID", flat=True)
    )
    await RunBase.filter(Q(testID__in=runs)).delete()

    collection = db_path.parent / writtenAttachmentFolderName

    for _run in runs:
        run = str(_run)  # UUID to string

        entry = collection / run
        if not entry.exists():
            continue

        logger.warning("Deleting the attachments for run {}", run)
        rmtree(entry)

    await ConfigBase.update_or_create(
        key=ConfigKeys.recentlyDeleted, value=str(recently_deleted)
    )
    logger.info("Delete job is completed.")
    return punch_out.pop()
