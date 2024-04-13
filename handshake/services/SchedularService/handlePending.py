from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.result_base import SuiteBase, Status, SuiteType
from handshake.services.SchedularService.modifySuites import patchTestSuite
from handshake.services.SchedularService.constants import JobType
from handshake.services.SchedularService.completeTestRun import patchTestRun
from handshake.services.SchedularService.pruneTasks import pruneTasks
from loguru import logger
from tortoise.expressions import Q, Subquery, F
from tortoise.functions import Min
from asyncio import TaskGroup
from handshake.services.SchedularService.register import skip_test_run


async def patch_jobs():
    while True:
        prune_task = await TaskBase.filter(type=JobType.PRUNE_TASKS).first()
        if prune_task:
            await pruneTasks(prune_task.ticketID)

        async with TaskGroup() as patcher:
            # list of tasks which were not picked and processed and are specific to MODIFY_SUITE
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

            # providers are list of child suites that needs to be processed and whose parents
            # are planned for processing
            providers = SuiteBase.filter(
                Q(parent__in=tasks)
                & Q(standing=Status.YET_TO_CALCULATE)
                & Q(suiteType=SuiteType.SUITE)
            )
            # these are the list of the suites that needs to be processed and can be processed
            required_suites = SuiteBase.filter(
                Q(suiteID__in=tasks)
                & ~Q(suiteID__in=Subquery(providers.values("parent")))
            )

            # get list of tasks which do not have children that are yet to processed
            to_process = await TaskBase.filter(
                Q(
                    ticketID__in=Subquery(
                        SuiteBase.filter(
                            # these are the list of suites that can be processed
                            # but filters out the suites whose previous retries were not processed
                            Q(suiteID__in=Subquery(required_suites.values("suiteID")))
                            & Q(
                                retried=Subquery(
                                    required_suites.only("retried")
                                    .annotate(minRetries=Min("retried"))
                                    .first()
                                    .values("minRetries")
                                )
                            )
                        ).values("suiteID")
                    )
                )
            ).all()

            # so we process the suites whose child suites are all processed and their previous retries were processed

            # if there are no such tasks to process then check if the tasks are there for the child suites
            if not (
                to_process
                or await TaskBase.filter(
                    Q(ticketID=Subquery(providers.values("suiteID")))
                ).exists()
            ):
                # if so mark each of the tests runs as banned.
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

    logger.debug("Processing Test Runs")
    async with TaskGroup() as patcher:
        for job in await TaskBase.filter(
            Q(type=JobType.MODIFY_TEST_RUN) & Q(picked=False) & Q(processed=False)
        ).all():
            job.picked = True
            await job.save()
            patcher.create_task(patchTestRun(job.ticketID), name=job.ticketID)

    logger.debug("Done!")
