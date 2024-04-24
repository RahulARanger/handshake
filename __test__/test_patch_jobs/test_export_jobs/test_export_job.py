import datetime
import json
from handshake.services.DBService.models import RunBase
from handshake.services.SchedularService.start import Scheduler
from handshake.services.SchedularService.constants import (
    exportAttachmentFolderName,
    EXPORT_RUNS_PAGE_FILE_NAME,
    EXPORT_RUN_PAGE_FILE_NAME,
)
from handshake.services.SchedularService.register import (
    register_patch_test_run,
    register_patch_suite,
)
from subprocess import run, PIPE


class TestRunsWithNoRuns:
    async def test_export_runs_page(self, root_dir):
        await Scheduler(root_dir).start()
        assert (
            root_dir / exportAttachmentFolderName / EXPORT_RUNS_PAGE_FILE_NAME
        ).read_text() == "[]"


class TestExportWithNoPatch:
    async def test_export_runs_page(
        self, helper_create_test_run, attach_config, root_dir
    ):
        test_run = await helper_create_test_run()
        await attach_config(test_run.testID)

        await Scheduler(root_dir).start()
        assert (
            root_dir / exportAttachmentFolderName / EXPORT_RUNS_PAGE_FILE_NAME
        ).read_text() == "[]"

        assert not (
            root_dir / exportAttachmentFolderName / str(test_run.testID)
        ).exists()


class TestWithSomeData:
    async def test_with_a_single_run(
        self, helper_create_test_run, attach_config, root_dir
    ):
        test_run = await helper_create_test_run()
        await attach_config(test_run.testID)

        await register_patch_test_run(test_run.testID)
        await Scheduler(root_dir).start()
        feed = (
            root_dir / exportAttachmentFolderName / EXPORT_RUNS_PAGE_FILE_NAME
        ).read_text()
        assert feed != "[]"

        test_run_feed = json.loads(
            (
                root_dir
                / exportAttachmentFolderName
                / str(test_run.testID)
                / EXPORT_RUN_PAGE_FILE_NAME
            ).read_text()
        )
        assert test_run_feed != "[]"

        assert (root_dir / exportAttachmentFolderName / str(test_run.testID)).exists()

        assert (
            root_dir
            / exportAttachmentFolderName
            / str(test_run.testID)
            / EXPORT_RUN_PAGE_FILE_NAME
        ).exists()

        runs = json.loads(feed)
        assert len(runs) == 1
        first_run = runs[0]

        assert first_run["projectName"] == test_run.projectName

        after_patch = await RunBase.filter(testID=test_run.testID).first()
        assert first_run["standing"] == after_patch.standing
        assert first_run["framework"] == "pytest"

        assert test_run_feed["projectName"] == test_run.projectName
        assert test_run_feed["standing"] == after_patch.standing
        assert test_run_feed["framework"] == "pytest"
        assert "maxInstances" in test_run_feed
        assert "fileRetries" in test_run_feed
        assert "bail" in test_run_feed
        assert "avoidParentSuitesInCount" in test_run_feed


class TestPatchExportCommand:
    async def test_with_a_single_run(
        self, helper_create_test_run, attach_config, root_dir, report_dir
    ):
        test_run = await helper_create_test_run()
        await attach_config(test_run.testID)
        await register_patch_test_run(test_run.testID)

        assert not report_dir.exists()

        run(f'handshake patch "{root_dir}" -o "{report_dir}"', shell=True, stderr=PIPE)

        assert report_dir.exists()
        assert (report_dir / exportAttachmentFolderName).exists()
        assert (report_dir / "RUNS").exists()

        feed = (
            report_dir / exportAttachmentFolderName / EXPORT_RUNS_PAGE_FILE_NAME
        ).read_text()
        assert feed != "[]"

        feed = (
            report_dir
            / exportAttachmentFolderName
            / str(test_run.testID)
            / EXPORT_RUN_PAGE_FILE_NAME
        ).read_text()
        assert feed != "[]"
