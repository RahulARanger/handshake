from nextpyreports.services.DBService.models.task_base import TaskBase
from nextpyreports.services.SchedularService.modifySuites import handleSuiteStatus
from nextpyreports.services.SchedularService.constants import JobType
from nextpyreports.services.SchedularService.completeTestRun import complete_test_run
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger


async def lookup_for_tasks(_scheduler: AsyncIOScheduler):
    logger.info("Looking up for the tasks")
    task = await TaskBase.filter(picked=False).order_by("dropped").first()  # ascending

    if not task:
        return logger.warning("No Task found in this iteration")

    await task.update_from_dict(dict(picked=True))
    await task.save()

    match task.type:
        case JobType.MODIFY_SUITE:
            job = _scheduler.add_job(
                handleSuiteStatus,
                args=[task.ticketID, task.test_id],
                name=f'update suite: {task.ticketID}', id=task.ticketID
            )
            logger.info("Picked a job {} to modify a suite. {}", job.name, task.ticketID)

        case JobType.MODIFY_TEST_RUN:
            job = _scheduler.add_job(
                complete_test_run,
                args=[task.ticketID, task.test_id],
                name=f'update suite: {task.ticketID}', id=task.ticketID
            )
            logger.info("Picked a job {} to modify a suite. {}", job.name, task.ticketID)

        case _:
            print("Not Implemented yet..")
