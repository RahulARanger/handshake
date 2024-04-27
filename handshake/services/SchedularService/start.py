import json
from asyncio import gather, to_thread, TaskGroup
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    db_path,
    close_connection,
)
from shutil import rmtree
from tarfile import open
from pathlib import Path
from typing import Optional
from loguru import logger
from tortoise.expressions import Q, RawSQL
from handshake.services.DBService.models.result_base import (
    RunBase,
    SuiteBase,
    SuiteType,
)
from tortoise import connections, BaseDBAsyncClient
from handshake.services.DBService.models.config_base import (
    ConfigBase,
    ConfigKeys,
)
from handshake.services.SchedularService.constants import (
    writtenAttachmentFolderName,
    exportAttachmentFolderName,
    DASHBOARD_ZIP_FILE,
    EXPORT_RUN_PAGE_FILE_NAME,
    EXPORT_PROJECTS_FILE_NAME,
    EXPORT_RUNS_PAGE_FILE_NAME,
    EXPORT_OVERVIEW_PAGE,
    EXPORT_ALL_SUITES,
)
from handshake.services.DBService.models.dynamic_base import TaskBase, JobType
from handshake.services.SchedularService.pruneTasks import pruneTasks
from handshake.services.SchedularService.handleTestResults import delete_test_attachment
from handshake.services.SchedularService.handlePending import patch_jobs
from handshake.services.SchedularService.refer_types import (
    SubSetOfRunBaseRequiredForProjectExport,
    SuiteSummary,
)


class Scheduler:
    RUNS_PAGE_VERSION = 1

    def __init__(
        self,
        root_dir: str,
        out_dir: Optional[str] = None,
        manual_reset: Optional[bool] = False,
        zipped_build: Optional[str] = None,
    ):
        self.export = out_dir is None
        self.dashboard_build = zipped_build
        self.export_dir = Path(out_dir) if out_dir and zipped_build else None
        self.db_path = db_path(root_dir)
        self.import_dir = (
            None
            if not self.export_dir
            else self.export_dir / exportAttachmentFolderName
        )
        self.reset = manual_reset
        self.connection: Optional[BaseDBAsyncClient] = None

    async def start(self):
        await init_tortoise_orm(self.db_path, True)
        self.connection = connections.get("default")
        await self.rotate_test_runs()
        await self.init_jobs()
        await patch_jobs()
        await self.export_jobs()

        await close_connection()

    async def rotate_test_run(self, projectName: str, to_delete: int):
        project_runs = RunBase.filter(projectName=projectName).all()
        will_be_deleted = await project_runs.count() - to_delete

        if will_be_deleted <= 0:
            logger.debug(
                "Test Runs for the project: {} has not yet reached the limit,"
                " hence skipping the deletion Task for this project",
                projectName,
            )
            return 0

        to_delete_runs = await (
            project_runs.order_by("started")
            .limit(will_be_deleted)
            .values_list("testID", flat=True)
        )
        attachment_folder = self.db_path.parent / writtenAttachmentFolderName
        await gather(
            RunBase.filter(Q(testID__in=to_delete_runs)).delete(),
            *(
                to_thread(delete_test_attachment, test_id, attachment_folder)
                for test_id in to_delete_runs
            ),
        )

        logger.warning(
            "Deleted {} test runs of this project {}", will_be_deleted, projectName
        )
        return will_be_deleted

    async def rotate_test_runs(self):
        runs_per_project = await ConfigBase.filter(
            key=ConfigKeys.maxRunsPerProject
        ).first()
        requested = max(int(runs_per_project.value), 2)

        recently_deleted = sum(
            await gather(
                *(
                    self.rotate_test_run(projectName, requested)
                    for projectName in await RunBase.all()
                    .distinct()
                    .values_list("projectName", flat=True)
                )
            )
        )

        record = await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()
        if record:
            await record.update_from_dict(dict(value=str(recently_deleted)))
            await record.save()
        else:
            await ConfigBase.create(
                key=ConfigKeys.recentlyDeleted, value=str(recently_deleted)
            )

        logger.info("Delete job is completed.")

    async def init_jobs(self):
        await pruneTasks()

        prev_picked_tasks = await TaskBase.filter(processed=False, picked=True).all()
        reset_from_config = await ConfigBase.filter(
            key=ConfigKeys.reset_test_run
        ).first()

        self.reset = self.reset or reset_from_config.value

        if self.reset:
            logger.info("It was requested to reset all of the completed test runs")

        to_modify_test_runs = (
            await TaskBase.filter(type=JobType.MODIFY_TEST_RUN, processed=True).all()
            if self.reset
            else []
        )
        to_pick = prev_picked_tasks + to_modify_test_runs

        async def pick_old_tasks():
            for task in to_pick:
                logger.info("scheduling old task {} for this iteration", task.ticketID)
                task.picked = False
                task.processed = False

            if to_pick:
                await TaskBase.bulk_update(to_pick, ("picked", "processed"), 100)
                logger.debug("Done!, Marked {} old tasks for processing", len(to_pick))

        async def reset_completed_runs():
            runs = []
            for ticket in to_modify_test_runs:
                test: RunBase = await ticket.test
                logger.debug("Reset for test run: {}", test.testID)
                test.standing = "PENDING"
                runs.append(test)

            if runs:
                logger.info("Reset done for {} test runs!", len(runs))
                await RunBase.bulk_update(runs, ("standing",), 100)

            if reset_from_config:
                reset_from_config.value = ""
                await reset_from_config.save()

        await gather(pick_old_tasks(), reset_completed_runs())
        logger.debug("Pre-Patch Jobs have been initiated")

    async def export_jobs(self):
        if not self.export_dir:
            logger.debug("Skipping export, as the output directory was not provided.")
            return

        logger.debug("Exporting reports...")
        await to_thread(self.export_files)
        logger.info("Exporting results...")
        self.import_dir.mkdir(exist_ok=False)

        await self.export_runs_page()
        logger.info("Done!")

    async def export_runs_page(self):
        logger.debug("Exporting Runs Page...")

        async with TaskGroup() as exporter:
            runs = []
            projects = {}

            for row in (
                await self.connection.execute_query(
                    """
select rb.*, cb.*,
rank()	over (order by rb.ended desc) as timelineIndex,
rank() over (partition by projectName order by rb.ended desc) as projectIndex
from RUNBASE rb
left join testconfigbase cb on rb.testID = cb.test_id 
WHERE rb.ended <> '' order by rb.started;
-- note for: projectIndex and timelineIndex, latest -> oldest => 0 - ...
"""
                )
            )[-1]:
                run = dict(row)
                test_run = SubSetOfRunBaseRequiredForProjectExport.model_validate(run)
                runs.append(run)

                logger.info(
                    "Exporting runs page for {} - {}",
                    test_run.projectName,
                    test_run.testID,
                )

                projects[test_run.projectName] = projects.get(test_run.projectName, [])
                suite_summary: SuiteSummary = json.loads(test_run.suiteSummary)
                projects[test_run.projectName].append(
                    dict(
                        testID=test_run.testID,
                        passed=test_run.passed,
                        failed=test_run.failed,
                        skipped=test_run.skipped,
                        tests=test_run.tests,
                        passedSuites=suite_summary["passed"],
                        failedSuites=suite_summary["failed"],
                        skippedSuites=suite_summary["skipped"],
                        suites=suite_summary["count"],
                        duration=test_run.duration,
                    )
                )

                (self.import_dir / str(test_run.testID)).mkdir(exist_ok=True)

                exporter.create_task(
                    to_thread(
                        self.save_run_query,
                        str(test_run.testID),
                        json.dumps(run),
                    ),
                    name="export-run-page",
                )

                exporter.create_task(
                    self.export_run_page(test_run.testID),
                    name="export-more-for-run-page",
                )

            exporter.create_task(
                to_thread(self.save_runs_query, json.dumps(runs), json.dumps(projects)),
                name="export-runs-page",
            )

            logger.info("Exported Runs Page!")

    async def export_run_page(self, run_id: str):
        await gather(self.export_overview_page(run_id), self.export_all_suites(run_id))

    async def export_overview_page(self, run_id: str):
        recent_suites = await (
            SuiteBase.filter(Q(session__test_id=run_id) & Q(suiteType=SuiteType.SUITE))
            .order_by("-started")
            .limit(6)
            .annotate(
                # numberOfErrors=RawSQL("json_array_length(errors)"),
                id=RawSQL("suiteID"),
                s=RawSQL("suitebase.started"),
            )
            .values(
                "title",
                "passed",
                "failed",
                "skipped",
                "duration",
                suiteID="id",
                started="s",
            )
        )

        aggregated = (
            await SuiteBase.filter(session__test_id=run_id)
            .annotate(
                sessions=RawSQL("count(DISTINCT session_id)"),
                files=RawSQL("count(DISTINCT file)"),
            )
            .only("sessions", "files")
            .first()
            .values("sessions", "files")
        )

        await to_thread(
            self.save_overview_query,
            run_id,
            json.dumps(dict(recentSuites=recent_suites, aggregated=aggregated)),
        )

    async def export_all_suites(self, run_id: str):
        all_suites = await (
            SuiteBase.filter(Q(session__test_id=run_id) & Q(suiteType=SuiteType.SUITE))
            .order_by("started")
            .prefetch_related("rollup")
            .annotate(
                numberOfErrors=RawSQL("json_array_length(errors)"),
                id=RawSQL("suiteID"),
                p_id=RawSQL("parent"),
                s=RawSQL("suitebase.started"),
                e=RawSQL("suitebase.ended"),
                error=RawSQL("errors ->> '[0]'"),
                hasChildSuite=RawSQL(
                    "(select count(*) from suitebase sb where sb.parent=suitebase.suiteID "
                    "and sb.suiteType='SUITE' LIMIT 1)"
                ),
            )
            .values(
                "title",
                "passed",
                "failed",
                "standing",
                "skipped",
                "duration",
                "file",
                "retried",
                "tags",
                "description",
                "errors",
                "error",
                "numberOfErrors",
                "hasChildSuite",
                suiteID="id",
                parent="p_id",
                started="s",
                ended="e",
                entityName="session__entityName",
                entityVersion="session__entityVersion",
                hooks="session__hooks",
                simplified="session__simplified",
                rollup_passed="rollup__passed",
                rollup_failed="rollup__failed",
                rollup_skipped="rollup__skipped",
                rollup_tests="rollup__tests",
            )
        )

        await to_thread(
            self.save_all_suites_query,
            run_id,
            json.dumps(all_suites),
        )

    def export_files(self):
        # we reset entire export folder
        if self.export_dir.exists():
            logger.debug("removing previous results")
            rmtree(self.export_dir)

        self.export_dir.mkdir(exist_ok=False)

        tar_file = open(self.dashboard_build, "r:bz2")
        tar_file.extractall(self.export_dir)

    def save_runs_query(self, feed: str, projectsFeed: str):
        (self.import_dir / EXPORT_RUNS_PAGE_FILE_NAME).write_text(feed)
        (self.import_dir / EXPORT_PROJECTS_FILE_NAME).write_text(projectsFeed)

    def save_run_query(self, testID: str, feed: str):
        (self.import_dir / testID / EXPORT_RUN_PAGE_FILE_NAME).write_text(feed)

    def save_overview_query(self, testID: str, feed: str):
        (self.import_dir / testID / EXPORT_OVERVIEW_PAGE).write_text(feed)

    def save_all_suites_query(self, testID: str, feed: str):
        (self.import_dir / testID / EXPORT_ALL_SUITES).write_text(feed)
