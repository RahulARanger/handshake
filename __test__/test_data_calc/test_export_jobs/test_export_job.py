import json
from handshake.services.DBService.models import RunBase, SuiteBase, TaskBase
from handshake.services.SchedularService.start import (
    Scheduler,
    attachment_folder as af,
    JobType,
)
from os.path import relpath
from handshake.services.SchedularService.constants import (
    exportAttachmentFolderName,
    EXPORT_RUNS_PAGE_FILE_NAME,
    EXPORT_PROJECTS_FILE_NAME,
    EXPORT_RUN_PAGE_FILE_NAME,
    EXPORT_OVERVIEW_PAGE,
    EXPORT_ALL_SUITES,
    exportExportFileName,
)
from json import dumps
from handshake.services.DBService.models.enums import Status
from __test__.conftest import helper_to_test_date_operator
from handshake.services.SchedularService.register import (
    register_patch_test_run,
    register_patch_suite,
)
from subprocess import run, PIPE, TimeoutExpired
from pytest import mark
from handshake.Exporters.excel_exporter import excel_export
from handshake.services.DBService.lifecycle import (
    handshake_meta_dashboard,
    handshake_meta,
)
from handshake.Exporters.html_reporter import HTMLExporter
from handshake import __version__
from shutil import rmtree
from pytest import fixture
from pathlib import Path


@fixture()
def clean_test_results():
    export_results_to = Path(__file__).parent.parent.parent.parent / "TestSampleResults"
    if export_results_to.exists():
        rmtree(export_results_to)
    yield export_results_to


@mark.usefixtures("clean_close")
class TestMinimalExport:
    async def test_with_export_disabled(self, root_dir):
        scheduler = Scheduler(root_dir)
        assert scheduler.skip_export
        # assert scheduler.dashboard_build is None

    async def test_with_no_runs_json_export(self, root_dir, report_dir):
        scheduler = Scheduler(
            root_dir, report_dir, export_mode="json", include_excel_export=True
        )
        assert scheduler.exporter.save_in == report_dir / "Import"

        await scheduler.start()

        assert len(list((report_dir / exportAttachmentFolderName).iterdir())) == 2

        assert (
            report_dir / exportAttachmentFolderName / "runs.json"
        ).read_text() == "[]"
        assert (
            report_dir / exportAttachmentFolderName / "projects.json"
        ).read_text() == "{}"


@mark.usefixtures("clean_close")
class TestJSONExportsWithRuns:
    async def test_with_a_single_run(
        self,
        helper_create_test_run,
        create_session_with_hierarchy_with_no_retries,
        attach_config,
        root_dir,
        report_dir,
    ):
        test_run = await helper_create_test_run(add_test_config=True)
        await create_session_with_hierarchy_with_no_retries(test_run.testID)
        await create_session_with_hierarchy_with_no_retries(test_run.testID)
        await create_session_with_hierarchy_with_no_retries(test_run.testID)

        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, out_dir=report_dir, export_mode="json").start()

        # TESTING runs.json
        feed = (
            report_dir / exportAttachmentFolderName / EXPORT_RUNS_PAGE_FILE_NAME
        ).read_text()
        assert feed != "[]"
        runs = json.loads(feed)
        assert len(runs) == 1
        first_run = runs[0]

        assert first_run["projectName"] == test_run.projectName
        assert first_run["timelineIndex"] == 1
        assert first_run["projectIndex"] == 1
        assert not first_run["excelExport"], "Excel Export was not enabled"

        after_patch = await RunBase.filter(testID=test_run.testID).first()

        helper_to_test_date_operator(after_patch.started, first_run["started"])
        helper_to_test_date_operator(after_patch.ended, first_run["ended"])
        assert after_patch.duration == first_run["duration"]

        # we get cols from Run Base
        assert first_run["standing"] == after_patch.standing
        # and Test ConfigBase
        assert first_run["framework"] == "pytest"

        # TESTING projects.json
        feed = json.loads(
            (
                report_dir / exportAttachmentFolderName / EXPORT_PROJECTS_FILE_NAME
            ).read_text()
        )
        for_this_project = feed[test_run.projectName]
        assert len(for_this_project) == 1

        first_run = for_this_project[0]
        for required in (
            "testID",
            "passed",
            "failed",
            "skipped",
            "xfailed",
            "xpassed",
            "tests",
            "passedSuites",
            "failedSuites",
            "skippedSuites",
            "suites",
            "duration",
        ):
            assert required in first_run
            assert first_run[required] is not None

        assert first_run["suites"] == 3 * 3
        assert first_run["tests"] == 3 * 3 * 9
        assert (
            first_run["passed"]
            == first_run["skipped"]
            == first_run["failed"]
            == (3 * 3 * 3)
        )
        assert first_run["xpassed"] == first_run["xfailed"] == 0
        assert first_run["passedSuites"] == first_run["skippedSuites"] == 0
        assert first_run["failedSuites"] == 3 * 3
        assert first_run["xfailedSuites"] == first_run["xpassedSuites"] == 0
        assert first_run["duration"] == after_patch.duration

        # Testing the presence of the run directory
        assert (report_dir / exportAttachmentFolderName / str(test_run.testID)).exists()

        # Testing Runs.json

        first_run = json.loads(
            (
                report_dir
                / exportAttachmentFolderName
                / str(test_run.testID)
                / EXPORT_RUN_PAGE_FILE_NAME
            ).read_text()
        )
        for required in (
            "testID",
            "passed",
            "failed",
            "skipped",
            "tests",
            "suites",
            "passedSuites",
            "failedSuites",
            "skippedSuites",
            "xfailedSuites",
            "xpassedSuites",
            "duration",
            "specStructure",
        ):
            assert required in first_run
            assert first_run[required] is not None

        assert first_run["tests"] == 3 * 3 * 9
        assert (
            first_run["passed"]
            == first_run["skipped"]
            == first_run["failed"]
            == (3 * 3 * 3)
        )
        assert first_run["xfailed"] == first_run["xpassed"] == 0
        assert first_run["duration"] == after_patch.duration

        # TESTING Overview Page
        feed = json.loads(
            (
                report_dir
                / exportAttachmentFolderName
                / str(test_run.testID)
                / EXPORT_OVERVIEW_PAGE
            ).read_text()
        )
        assert "recentSuites" in feed

        recent_suites = feed["recentSuites"]
        assert len(recent_suites) == 6

        noted = set()
        for suite in recent_suites:
            for required in (
                "title",
                "passed",
                "failed",
                "skipped",
                "xfailed",
                "xpassed",
                "duration",
                "suiteID",
                "started",
            ):
                assert required in suite
                assert suite[required] is not None

            noted.add(suite["suiteID"])
            assert suite["passed"] == 3
            assert suite["failed"] == 3
            assert suite["skipped"] == 3
            assert suite["xpassed"] == 0
            assert suite["xfailed"] == 0

        not_included = (
            await SuiteBase.filter(session__test_id=test_run.testID)
            .order_by("ended")
            .limit(3)
            .order_by("-ended")
            .first()
            .values_list("suiteID", flat=True)
        )
        assert not_included not in noted  # we only the latest 6 suites

        aggregated = feed["aggregated"]
        assert aggregated["sessions"] == 9
        assert aggregated["files"] == 3

        # TESTING suites.json

        feed = json.loads(
            (
                report_dir
                / exportAttachmentFolderName
                / str(test_run.testID)
                / EXPORT_ALL_SUITES
            ).read_text()
        )

        assert len(feed) == 9
        for suite in feed:
            for required in (
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
                "suiteID",
                "parent",
                "started",
                "ended",
                "entityName",
                "entityVersion",
                "hooks",
                "simplified",
                "rollup_passed",
                "rollup_failed",
                "rollup_skipped",
                "rollup_xfailed",
                "rollup_xpassed",
                "rollup_tests",
                "retried_later",
                "setup_duration",
                "teardown_duration",
            ):
                assert required in suite
                assert suite[required] is not None
            assert suite["passed"] == suite["failed"] == suite["skipped"] == 3
            assert not suite["hasChildSuite"]
            assert suite["numberOfErrors"] == 3
            assert suite["errors"][0] == json.loads(suite["error"])

            saved_suite = await SuiteBase.filter(suiteID=suite["suiteID"]).first()
            helper_to_test_date_operator(saved_suite.started, suite["started"])
            helper_to_test_date_operator(saved_suite.ended, suite["ended"])
            assert saved_suite.duration == suite["duration"]

    async def test_with_parent_suite(
        self,
        helper_create_test_run,
        helper_create_test_session,
        create_suite,
        root_dir,
        report_dir,
        zipped_build,
    ):
        test_run = await helper_create_test_run(add_test_config=True)
        session = await helper_create_test_session(test_run.testID)

        suite = await create_suite(session.sessionID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(child.suiteID, test_run.testID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(suite.suiteID, test_run.testID)
        await register_patch_suite(child.suiteID, test_run.testID)
        await register_patch_test_run(test_run.testID)

        run(
            f'handshake export "{root_dir}" -o "{report_dir}" -e json',
            shell=True,
            stderr=PIPE,
        )

        assert report_dir.exists()
        assert (report_dir / exportAttachmentFolderName).exists()

        feed = json.loads(
            (
                report_dir / exportAttachmentFolderName / EXPORT_RUNS_PAGE_FILE_NAME
            ).read_text()
        )
        assert len(feed) <= 2  # can even include the previous test run

        feed = json.loads(
            (
                report_dir
                / exportAttachmentFolderName
                / str(test_run.testID)
                / EXPORT_ALL_SUITES
            ).read_text()
        )
        assert len(feed) == 3  # can even include the previous test run

        for _suite in feed:
            if _suite["suiteID"] == str(suite.suiteID):
                assert _suite["hasChildSuite"] == 2
            else:
                assert not _suite["hasChildSuite"]

    async def test_with_multiple_runs_in_single_project(
        self, helper_create_test_run, report_dir, root_dir
    ):
        first = await helper_create_test_run("test-1", add_test_config=True)
        test_run = await helper_create_test_run("test-1", add_test_config=True)
        project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, out_dir=report_dir, export_mode="json").start()

        # TESTING projects.json
        feed = json.loads(
            (
                report_dir / exportAttachmentFolderName / EXPORT_PROJECTS_FILE_NAME
            ).read_text()
        )
        for_this_project = feed[project]
        assert len(for_this_project) == 2

    async def test_with_multiple_runs_in_multiple_project(
        self, helper_create_test_run, report_dir, root_dir
    ):
        first = await helper_create_test_run("test-1", add_test_config=True)
        test_run = await helper_create_test_run("test-1", add_test_config=True)
        project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        first = await helper_create_test_run("test-2", add_test_config=True)
        test_run = await helper_create_test_run("test-2", add_test_config=True)

        second_project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, out_dir=report_dir, export_mode="json").start()

        # TESTING projects.json
        feed = json.loads(
            (
                report_dir / exportAttachmentFolderName / EXPORT_PROJECTS_FILE_NAME
            ).read_text()
        )
        for_this_project = feed[project]
        assert len(for_this_project) == 2

        for_this_project = feed[second_project]
        assert len(for_this_project) == 2

    async def test_import_from_handshake_file(
        self, root_dir, report_dir, helper_create_test_run, helper_create_test_session
    ):
        target = root_dir / "handshake.json"
        if not target.exists():
            run(
                f'handshake init "{root_dir}"',
                cwd=root_dir,
                shell=True,
            )
        assert target.exists()
        target.write_text(
            dumps(
                {
                    "MAX_RUNS_PER_PROJECT": 10,
                    "COMMANDS": {
                        "EXPORT": {
                            "OUTPUT_FOLDER": str(report_dir),
                            "EXPORT_MODE": "json",
                        }
                    },
                }
            )
        )

        first = await helper_create_test_run("test-1", add_test_config=True)
        test_run = await helper_create_test_run("test-1", add_test_config=True)
        project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        first = await helper_create_test_run("test-2", add_test_config=True)
        test_run = await helper_create_test_run("test-2", add_test_config=True)

        second_project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        # notice we are not providing any options to mention out directory and the JSON export mode
        run(
            f'handshake export "{root_dir}"',
            cwd=root_dir,
            shell=True,
            stderr=PIPE,
            stdout=PIPE,
        )

        # TESTING projects.json
        feed = json.loads(
            (
                report_dir / exportAttachmentFolderName / EXPORT_PROJECTS_FILE_NAME
            ).read_text()
        )
        for_this_project = feed[project]
        assert len(for_this_project) == 2

        for_this_project = feed[second_project]
        assert len(for_this_project) == 2


@mark.usefixtures("clean_close")
async def test_patch_interruption(
    helper_create_test_run, root_dir, report_dir, zipped_build
):
    test_run = await helper_create_test_run(add_test_config=True)
    await register_patch_test_run(test_run.testID)
    found_error = False

    try:
        run(
            f'handshake export "{root_dir}" -o "{report_dir}" -e json',
            shell=True,
            stderr=PIPE,
            timeout=0.1,  # 1 second is not enough, so it fails
        )
    except TimeoutExpired:
        found_error = True

    assert found_error, "Expected TimeoutExpired Error"


class TestExcelExport:
    @mark.skipif(not excel_export, reason="extras were not installed")
    async def test_with_parent_suite(
        self,
        helper_create_test_run,
        helper_create_test_session,
        create_suite,
        root_dir,
        report_dir,
        zipped_build,
        db_path,
    ):
        test_run = await helper_create_test_run(add_test_config=True)
        session = await helper_create_test_session(test_run.testID)

        suite = await create_suite(session.sessionID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(child.suiteID, test_run.testID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(suite.suiteID, test_run.testID)
        await register_patch_suite(child.suiteID, test_run.testID)
        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, include_excel_export=True).start()

        task = await TaskBase.filter(
            type=JobType.EXPORT_EXCEL, test_id=test_run.testID
        ).first()
        previously = task.dropped
        assert task.processed, "Excel export task must be processed by now"

        assert (
            af(db_path) / str(test_run.testID) / exportExportFileName
        ).exists(), list((af(db_path) / str(test_run.testID)).iterdir())

        await Scheduler(root_dir, include_excel_export=True).start()

        task = await TaskBase.filter(
            type=JobType.EXPORT_EXCEL, test_id=test_run.testID
        ).first()
        assert task.dropped == previously, "excel will not be exported again"

        await Scheduler(root_dir, include_excel_export=True, manual_reset=True).start()

        task = await TaskBase.filter(
            type=JobType.EXPORT_EXCEL, test_id=test_run.testID
        ).first()
        assert task.dropped > previously, "Excel should be exported again"

        assert (
            af(db_path) / str(test_run.testID) / exportExportFileName
        ).exists(), list((af(db_path) / str(test_run.testID)).iterdir())

    @mark.skipif(not excel_export, reason="extras were not installed")
    async def test_with_skip_export_if_not_processed(
        self,
        helper_create_test_run,
        helper_create_test_session,
        create_suite,
        root_dir,
        db_path,
    ):
        test_run = await helper_create_test_run(add_test_config=True)
        session = await helper_create_test_session(test_run.testID)

        await create_suite(session.sessionID)
        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, include_excel_export=True).start()
        task = await TaskBase.filter(
            type=JobType.EXPORT_EXCEL, test_id=test_run.testID
        ).first()
        assert not task.picked and not task.processed
        assert not (
            af(db_path) / str(test_run.testID) / exportExportFileName
        ).exists(), list((af(db_path) / str(test_run.testID)).iterdir())

    @mark.skipif(excel_export, reason="extras were installed")
    async def test_skip_export_if_not_installed(
        self,
        helper_create_test_run,
        helper_create_test_session,
        create_suite,
        root_dir,
        db_path,
    ):
        test_run = await helper_create_test_run(add_test_config=True)
        session = await helper_create_test_session(test_run.testID)

        suite = await create_suite(session.sessionID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(child.suiteID, test_run.testID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(suite.suiteID, test_run.testID)
        await register_patch_suite(child.suiteID, test_run.testID)
        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, include_excel_export=True).start()
        assert not (
            await TaskBase.filter(
                type=JobType.EXPORT_EXCEL, test_id=test_run.testID
            ).exists()
        )
        assert not (
            af(db_path) / str(test_run.testID) / exportExportFileName
        ).exists(), list((af(db_path) / str(test_run.testID)).iterdir())

        test_run = await RunBase.filter(testID=test_run.testID).first()
        assert test_run.standing != Status.PENDING


class TestHTMLExport:
    async def test_download_html_export(self):
        for_testing = HTMLExporter.template
        for_testing.unlink(missing_ok=True)

        await HTMLExporter.download_zip()

        meta_dashboard = handshake_meta_dashboard()
        assert meta_dashboard["version"] == __version__
        assert (
            meta_dashboard["browser_download_url_for_dashboard"]
            == handshake_meta()["0"]["browser_download_url"]
        )

    async def test_with_normal_run_with_html_not_installed(
        self,
        helper_create_test_run,
        helper_create_test_session,
        create_suite,
        root_dir,
        report_dir,
        zipped_build,
        db_path,
        clean_test_results,
    ):
        for_testing = HTMLExporter.template
        for_testing.unlink(missing_ok=True)

        test_run = await helper_create_test_run(add_test_config=True)
        session = await helper_create_test_session(test_run.testID)

        suite = await create_suite(session.sessionID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(child.suiteID, test_run.testID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(suite.suiteID, test_run.testID)
        await register_patch_suite(child.suiteID, test_run.testID)
        await register_patch_test_run(test_run.testID)

        assert not clean_test_results.exists(), "No Results before (assumption)"

        await Scheduler(
            root_dir,
            export_mode="html",
            out_dir=str(clean_test_results),
        ).start()

        assert HTMLExporter.template.exists(), "notice the zip file now exists"
        assert clean_test_results.exists(), "must be exported here"

        json_dir = clean_test_results / exportAttachmentFolderName
        assert json_dir.exists(), "json export must be present"

    async def test_with_normal_run_with_html_installed(
        self,
        helper_create_test_run,
        helper_create_test_session,
        create_suite,
        root_dir,
        report_dir,
        zipped_build,
        db_path,
        clean_test_results,
    ):
        if HTMLExporter.template.exists():
            await HTMLExporter.download_zip()

        test_run = await helper_create_test_run(add_test_config=True)
        session = await helper_create_test_session(test_run.testID)

        suite = await create_suite(session.sessionID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(child.suiteID, test_run.testID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(suite.suiteID, test_run.testID)
        await register_patch_suite(child.suiteID, test_run.testID)
        await register_patch_test_run(test_run.testID)

        assert HTMLExporter.template.exists(), "zip file exists before"
        before = handshake_meta_dashboard()["downloaded_dashboard_at"]

        await Scheduler(
            root_dir,
            include_excel_export=False,
            export_mode="html",
            out_dir=str(clean_test_results),
        ).start()

        assert (
            before == handshake_meta_dashboard()["downloaded_dashboard_at"]
        ), "newly downloaded"
        assert HTMLExporter.template.exists(), "zip file still exists, no impact"
