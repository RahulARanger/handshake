from asyncio import gather, to_thread
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    db_path,
    close_connection,
    attachment_folder,
)
from shutil import rmtree
from pathlib import Path
from typing import Optional
from loguru import logger
from tortoise.expressions import Q, Subquery
from ansitohtml.parser import Parser
from handshake.services.DBService.models.result_base import RunBase
from tortoise import connections, BaseDBAsyncClient
from handshake.services.DBService.models.config_base import (
    ConfigBase,
    ConfigKeys,
)
from handshake.services.SchedularService.register import register_bulk_excel_export
from handshake.services.DBService.models.dynamic_base import TaskBase, JobType
from handshake.services.SchedularService.flag_tasks import pruneTasks
from handshake.services.SchedularService.handlePending import patch_jobs
from handshake.Exporters.json_exporter import JsonExporter
from handshake.Exporters.excel_exporter import excel_export
from handshake.Exporters.html_reporter import HTMLExporter


class Scheduler:
    RUNS_PAGE_VERSION = 1

    def __init__(
        self,
        root_dir: str,
        out_dir: Optional[str] = None,
        manual_reset: Optional[bool] = False,
        inside_test_results: Optional[bool] = False,
        dev: Optional[bool] = False,
        export_mode: str = "json",
        include_excel_export: Optional[bool] = False,
    ):
        self.db_path = db_path(root_dir)
        if not export_mode and export_mode != "json" and export_mode != "html":
            logger.warning(
                "export mode was not defined, please mention it either has html or json."
                " For example, handshake export TestResults -e html",
                export_mode,
            )

        self.exporter = (
            JsonExporter(
                self.db_path,
                (
                    Path(out_dir)
                    if out_dir and not inside_test_results
                    else self.db_path.parent
                ),
                dev or inside_test_results,
            )
            if export_mode == "json"
            else HTMLExporter(
                self.db_path,
                Path(out_dir),
                dev or inside_test_results,
            )
        )
        self.excel_export = include_excel_export
        self.skip_export = out_dir is None and not inside_test_results
        if self.skip_export and self.exporter:
            logger.warning(
                "Calculating Results but please note Export would be skipped,"
                " if you need the results to be exported then please pass export mode and output directory,"
                " for example: handshake export TestResults -e json -o TestReports"
            )
        self.converter = Parser()
        self.db_path = db_path(root_dir)
        self.reset = manual_reset
        self.connection: Optional[BaseDBAsyncClient] = None

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
        await gather(
            RunBase.filter(Q(testID__in=to_delete_runs)).delete(),
            *(
                to_thread(
                    rmtree,
                    attachment_folder(self.db_path, test_id),
                    ignore_errors=False,
                    onerror=None,
                )
                for test_id in to_delete_runs
                if attachment_folder(self.db_path, test_id).exists()
            ),
        )

        logger.info(
            "We have deleted {} test runs under the project name: {}. due to the max. threshold of {} test runs",
            will_be_deleted,
            projectName,
            to_delete,
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

        logger.debug("Delete job is completed.")

    async def init_jobs(self):
        await pruneTasks()

        prev_picked_tasks = await TaskBase.filter(processed=False, picked=True).all()
        reset_from_config = await ConfigBase.filter(
            key=ConfigKeys.reset_test_run
        ).first()

        self.reset = self.reset or reset_from_config.value

        if self.reset:
            logger.debug(
                "we would be processing the test runs again, we can expect updated results."
            )

        to_reset = (
            (Q(type=JobType.MODIFY_TEST_RUN) | Q(type=JobType.EXPORT_EXCEL))
            if self.excel_export and excel_export
            else Q(type=JobType.MODIFY_TEST_RUN)
        )

        to_modify_test_runs = (
            await TaskBase.filter(to_reset & Q(processed=True)).all()
            if self.reset
            else []
        )
        to_pick = prev_picked_tasks + to_modify_test_runs

        async def pick_old_tasks():
            for task in to_pick:
                logger.debug(
                    "This unfinished task: {}[{}] would run in this iteration",
                    task.type,
                    task.ticketID,
                )
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
                logger.debug("Reset done for {} test runs!", len(runs))
                await RunBase.bulk_update(runs, ("standing",), 100)

            if reset_from_config:
                reset_from_config.value = ""
                await reset_from_config.save()

        async def add_export_jobs():
            if not self.excel_export:
                return None

            test_ids_to_pick = await RunBase.filter(
                ~Q(
                    testID__in=Subquery(
                        TaskBase.filter(type=JobType.EXPORT_EXCEL).values_list(
                            "test_id", flat=True
                        )
                    ),
                )
            ).values_list("testID", flat=True)

            if not excel_export:
                return logger.warning(
                    "Excel Export due to non-availability of the library, please proceed with the pip install "
                    "handshakes[excel-export] to download the openpyxl which is required for the excel export",
                )

            test_ids_to_pick and await register_bulk_excel_export(test_ids_to_pick)

        await gather(pick_old_tasks(), reset_completed_runs(), add_export_jobs())
        logger.debug("Pre-Patch Jobs have been initiated")

    async def start(self, config_path: Optional[str] = None, meta_file: str  = ""):
        await init_tortoise_orm(self.db_path, True, config_path=config_path)
        self.connection = connections.get("default")
        await self.rotate_test_runs()
        await self.init_jobs()

        await patch_jobs(self.excel_export, self.db_path, meta_file)

        if not self.skip_export:
            await self.exporter.start_exporting()

        await close_connection()

if __name__ == "__main__":
    import asyncio

    asyncio.run(Scheduler("../../../TestResults", dev=True).start(meta_file=Path("../../../test_pytest_reporter.toml")))