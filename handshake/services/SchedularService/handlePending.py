from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.result_base import SuiteBase, Status, SuiteType
from handshake.services.SchedularService.modifySuites import patchTestSuite
from handshake.services.SchedularService.constants import JobType
from handshake.services.SchedularService.completeTestRun import patchTestRun
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from handshake.services.SchedularService.pruneTasks import pruneTasks
from loguru import logger
from tortoise.expressions import Q
from asyncio import TaskGroup
from handshake.services.SchedularService.register import skip_test_run


async def patch_jobs():
    while True:
        if await TaskBase.filter(type=JobType.PRUNE_TASKS).exists():
            await pruneTasks()

        async with TaskGroup() as patcher:
            # list of tasks which were not picked and processed and specific MODIFY_SUITE
            tasks = (
                await TaskBase.filter(
                    Q(picked=False) & Q(processed=False) & Q(type=JobType.MODIFY_SUITE)
                )
                .order_by("dropped")  # old are on top
                .only("ticketID")
                .values_list("ticketID", flat=True)
            )

            if not tasks:
                break

            providers = SuiteBase.filter(
                Q(parent__in=tasks)
                & Q(standing=Status.YET_TO_CALCULATE)
                & Q(suiteType=SuiteType.SUITE)
            )

            to_process = await TaskBase.filter(
                Q(ticketID__in=tasks)
                & ~Q(
                    ticketID__in=await providers.only("parent").values_list(
                        "parent", flat=True
                    )
                )
            ).all()

            if not (
                to_process
                or await TaskBase.filter(
                    Q(
                        ticketID__in=await providers.only("suiteID").values_list(
                            "suiteID", flat=True
                        )
                    )
                ).exists()
            ):
                for task in await TaskBase.filter(Q(ticketID__in=tasks)).all():
                    await skip_test_run(
                        task.test_id,
                        "Failed to find a way to process a parent suite, as the child suite was not registered.",
                        parent_suite=task.ticketID,
                        job=task.type,
                    )

            for task in to_process:
                task.picked = True
                await task.save()

                patcher.create_task(
                    patchTestSuite(task.ticketID, task.test_id),
                    name=task.ticketID,
                )

            # NOTE: make sure to pick the task before adding a new task


async def lookup_for_tasks(_scheduler: AsyncIOScheduler):
    logger.info("Looking up for the tasks")

    task = (
        await TaskBase.filter(
            Q(picked=False)
            & Q(processed=False)
            & (
                Q(type=JobType.MODIFY_SUITE)
                | Q(type=JobType.MODIFY_TEST_RUN)
                | Q(type=JobType.PRUNE_TASKS)
            )
        )
        .order_by("dropped")
        .first()
    )  # ascending

    if not task:
        return logger.warning("No Task found in this iteration")

    await task.update_from_dict(dict(picked=True))
    await task.save()

    is_task_processed = False

    match task.type:
        case JobType.MODIFY_SUITE:
            is_task_processed = await patchTestSuite(task.ticketID, task.test_id)

        case JobType.MODIFY_TEST_RUN:
            is_task_processed = await patchTestRun(task.ticketID, task.test_id)

        case JobType.PRUNE_TASKS:
            await pruneTasks(task.ticketID)
            is_task_processed = True

        case _:
            logger.warning("Not Implemented yet..")

    if is_task_processed:
        await task.update_from_dict(dict(processed=True))
        await task.save()
    else:
        logger.info(
            "This Task: {} - {} will continue in the next iteration",
            task.ticketID,
            task.type,
        )

    logger.info("Rescheduling for lookup task")
    add_lookup_task(_scheduler)
