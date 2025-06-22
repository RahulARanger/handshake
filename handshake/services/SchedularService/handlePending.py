from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.result_base import SuiteBase, Status, SuiteType
from handshake.services.SchedularService.loadConfigFile import load_from_meta
from handshake.services.SchedularService.modifySuites import patchTestSuite
from handshake.services.SchedularService.constants import JobType
from handshake.services.SchedularService.completeTestRun import patchTestRun
from handshake.services.SchedularService.flag_tasks import pruneTasks
from loguru import logger
from tortoise.expressions import Q, Subquery
from tortoise.functions import Min
from asyncio import TaskGroup
from pathlib import Path
from handshake.services.SchedularService.register import cancel_patch_for_test_run
from handshake.Exporters.excel_exporter import excel_export, ExcelExporter
from click import progressbar


async def safety_checks():
    prune_task = await TaskBase.filter(type=JobType.PRUNE_TASKS).first()
    if prune_task:
        await pruneTasks(prune_task.ticketID)


async def get_tasks():
    return (
        await TaskBase.filter(
            Q(picked=False)
            & Q(processed=False)
            & Q(processed=False)
            & Q(type=JobType.MODIFY_SUITE)
        )
        .order_by("dropped")  # old is on top
        .only("ticketID")
        .values_list("ticketID", flat=True)
    )


async def patch_jobs(include_excel_export: bool = False, db_path: Path = None, meta_file: str = ""):
    tasks = await get_tasks()
    first_time = True
    before = len(tasks)

    with progressbar(length=before, label="Processing Test Suites") as bar:
        while True:
            await safety_checks()

            async with TaskGroup() as patcher:
                # list of tasks which were not picked and processed and are specific to MODIFY_SUITE
                tasks = tasks if first_time else (await get_tasks())
                bar.update(before - (len(tasks) if tasks else 0))

                if first_time:
                    first_time = False

                if not tasks:
                    break

                # providers are list of child suites that needs to be processed before processing their parents
                providers = SuiteBase.filter(
                    Q(parent__in=tasks)
                    & (
                        Q(standing=Status.YET_TO_CALCULATE)
                        | Q(standing=Status.PROCESSING)
                    )
                    & Q(suiteType=SuiteType.SUITE)
                )
                # these are the list of the suites that needs to be processed and can be processed
                required_suites = SuiteBase.filter(
                    Q(suiteID__in=tasks)
                    & ~Q(suiteID__in=Subquery(providers.values("parent")))
                )

                # get a list of tasks which do not have children that are yet to process
                to_process = await TaskBase.filter(
                    Q(
                        ticketID__in=Subquery(
                            SuiteBase.filter(
                                # these are the list of suites that can be processed
                                # but filters out the suites whose previous retries were not processed
                                Q(
                                    suiteID__in=Subquery(
                                        required_suites.values("suiteID")
                                    )
                                )
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

                # so we process the suites whose child suites are all processed and their previous retries were
                # processed

                # if there are no such tasks to process, then check if the tasks are there for the child suites
                if not (
                    to_process
                    or await TaskBase.filter(
                        Q(ticketID=Subquery(providers.values("suiteID")))
                    ).exists()
                ):
                    # if so, mark each of the tests runs as banned.
                    for task in await TaskBase.filter(Q(ticketID__in=tasks)).all():
                        await cancel_patch_for_test_run(
                            task.test_id,
                            "Failed to find a way to process a parent suite, as the child suite was not registered.",
                            True,
                            "patcher-for-next-test-run-patch",
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

        bar.update(before if before else 1)

    logger.debug("Processing Test Runs & Loading from meta file")
    async with TaskGroup() as patcher:
        for job in await TaskBase.filter(
            Q(type=JobType.MODIFY_TEST_RUN) & Q(picked=False) & Q(processed=False)
        ).all():
            job.picked = True
            await job.save()
            patcher.create_task(patchTestRun(job.ticketID), name=job.ticketID)

    async with TaskGroup() as importer:
        for job in await TaskBase.filter(
            Q(type=JobType.LOAD_META_FILE)
            & Q(picked=False) & Q(processed=False)
        ).all():
            job.picked = True
            await job.save()
            importer.create_task(load_from_meta(job.ticketID, meta_file), name=job.ticketID)

    if not (db_path and include_excel_export and excel_export):
        logger.debug("Done!")
        return

    logger.debug("Exporting Test Runs")
    async with TaskGroup() as patcher:
        for job in await TaskBase.filter(
            Q(type=JobType.EXPORT_EXCEL)
            & Q(picked=False)
            & Q(processed=False)
            & ~Q(test__standing=Status.PENDING)
        ).all():
            exporter = ExcelExporter(db_path)
            job.picked = True
            await job.save()
            patcher.create_task(
                exporter.start_exporting(job.test_id), name=job.ticketID
            )

    logger.info("Done!")
