from src.services.DBService.models.task_base import TaskBase
from src.services.SchedularService.modifySuites import handleSuiteStatus
from src.services.SchedularService.constants import JobType, MODIFY_SUITE_JOB
from src.services.SchedularService.shared import get_scheduler_logger
from src.services.SchedularService.specific import _scheduler
from logging import Logger


async def _lookup_for_tasks(logger: Logger):
    task = await TaskBase.first()
    if not task:
        return

    await task.delete()
    match task.type:
        case JobType.MODIFY_SUITE:
            logger.info("Adding a job to modify a suite.")
            _scheduler.add_job(
                handleSuiteStatus, "interval", seconds=2,
                args=[task.ticketID],
                name=f'update suite: {task.ticketID}', id=f'{MODIFY_SUITE_JOB}-{task.ticketID}',
                max_instances=1, coalesce=True, replace_existing=False
            )

        case _:
            print("Not Implemented yet..")


async def lookup_for_tasks():
    logger = get_scheduler_logger()
    logger.info("looking up for tasks")
    try:
        await _lookup_for_tasks(logger)
    except Exception as e:
        logger.exception("Failed while looking up for tasks", exc_info=True)
