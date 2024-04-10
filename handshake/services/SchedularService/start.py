import json
from asyncio import gather, to_thread, TaskGroup
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    db_path,
    close_connection,
)
from shutil import copytree, rmtree
from zipfile import ZipFile
from pathlib import Path
from typing import Optional
from loguru import logger
from tortoise.expressions import Q
from handshake.services.DBService.models.result_base import (
    RunBase,
)
from handshake.services.SchedularService.handleTestResults import (
    saveRunsQuery,
    saveRunQuery,
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
)
from handshake.services.DBService.models.dynamic_base import TaskBase, JobType
from handshake.services.SchedularService.pruneTasks import pruneTasks
from handshake.services.SchedularService.handleTestResults import delete_test_attachment
from handshake.services.SchedularService.handlePending import patch_jobs


class Scheduler:
    RUNS_PAGE_VERSION = 1

    def __init__(
        self,
        root_dir: str,
        out_dir: Optional[str] = None,
        manual_reset: Optional[bool] = False,
    ):
        self.export = out_dir is None
        self.export_dir = Path(out_dir) if out_dir else None
        self.db_path = db_path(root_dir)
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
        skip = (
            (
                await ConfigBase.filter(key=ConfigKeys.export_runs_page)
                .only("value")
                .first()
            ).value
            or False
        ) == self.RUNS_PAGE_VERSION

        logger.info("Exporting results to json.")

        async with TaskGroup() as exporter:
            if not skip:
                exporter.create_task(self.export_runs_page())

        logger.info("Done!")

        if not self.export_dir:
            logger.debug("Skipping export, as the output directory was not provided.")
            return

        logger.debug("Exporting Test Results...")
        await to_thread(self.export_files)

    async def export_runs_page(self):
        logger.debug("Exporting Runs Page...")

        runs = []

        for row in (
            await self.connection.execute_query(
                """
select rb.*, cb.* from RUNBASE rb
left join testconfigbase cb on rb.testID = cb.test_id 
WHERE rb.ended <> '' order by rb.started;
"""
            )
        )[-1]:
            run = dict(row)
            runs.append(run)
            logger.info(
                "Exporting runs page for {} - {}", run["projectName"], run["testID"]
            )
            await to_thread(
                saveRunQuery,
                self.db_path,
                run["testID"],
                json.dumps(run),
            )

        await to_thread(
            saveRunsQuery,
            self.db_path,
            json.dumps(runs),
        )
        logger.info("Exported Runs Page!")

    def export_files(self):
        if self.export_dir.exists():
            logger.debug("removing previous results")
            rmtree(self.export_dir)

        self.export_dir.mkdir(exist_ok=False)

        logger.info("copying json files")

        copytree(
            self.db_path.parent / exportAttachmentFolderName,
            self.export_dir / exportAttachmentFolderName,
        )
        logger.debug("Done!")

        logger.info("Copying html files")

        with ZipFile(
            Path(__file__).parent.parent.parent / DASHBOARD_ZIP_FILE, "r"
        ) as zip_file:
            zip_file.extractall(self.export_dir)

        logger.info("Done!")
