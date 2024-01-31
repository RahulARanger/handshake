from handshake.services.DBService.models.result_base import RunBase
from handshake.services.DBService.models.config_base import ConfigBase, ConfigKeys
from handshake.services.SchedularService.constants import (
    JobType,
)
from loguru import logger
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path
from typing import List
from tortoise.expressions import Q
from handshake.services.SchedularService.handleTestResults import (
    deleteTestRunsRelatedAttachments,
)


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

    deleteTestRunsRelatedAttachments(db_path, runs)

    record, _ = await ConfigBase.update_or_create(key=ConfigKeys.recentlyDeleted)
    await record.update_from_dict(dict(value=str(recently_deleted)))
    await record.save()

    logger.info("Delete job is completed.")
    return punch_out.pop()
