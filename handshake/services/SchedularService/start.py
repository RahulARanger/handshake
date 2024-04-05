from asyncio import run, TaskGroup, gather, to_thread
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    db_path,
    close_connection,
)
from typing import Optional, Union
from uuid import UUID
from loguru import logger
from tortoise.expressions import Q
from handshake.services.DBService.models.result_base import (
    SuiteBase,
    RunBase,
    TestLogBase,
    LogType,
)
from handshake.services.DBService.models.config_base import (
    ConfigBase,
    TestConfigBase,
    ConfigKeys,
)
from handshake.services.SchedularService.constants import (
    writtenAttachmentFolderName,
)
from handshake.services.DBService.models.dynamic_base import TaskBase, JobType
from handshake.services.SchedularService.pruneTasks import pruneTasks
from handshake.services.SchedularService.handleTestResults import delete_test_attachment
from handshake.services.SchedularService.handlePending import patch_jobs


class Scheduler:
    def __init__(
        self,
        root_dir: str,
        out_dir: Optional[str] = None,
        manual_reset: Optional[bool] = False,
    ):
        self.export = out_dir is None
        self.export_dir = out_dir
        self.db_path = db_path(root_dir)
        self.reset = manual_reset

    async def start(self):
        await init_tortoise_orm(self.db_path, True)
        await self.rotate_test_runs()
        await self.init_jobs()
        await patch_jobs()

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
