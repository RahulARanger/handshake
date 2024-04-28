import json
from handshake.services.DBService.models import RunBase, SuiteBase
from handshake.services.SchedularService.start import Scheduler
from handshake.services.SchedularService.constants import (
    exportAttachmentFolderName,
    EXPORT_RUNS_PAGE_FILE_NAME,
    EXPORT_PROJECTS_FILE_NAME,
    EXPORT_RUN_PAGE_FILE_NAME,
    EXPORT_OVERVIEW_PAGE,
    EXPORT_ALL_SUITES,
)
from __test__.conftest import helper_to_test_date_operator
from handshake.services.SchedularService.register import (
    register_patch_test_run,
    register_patch_suite,
)
from subprocess import run, PIPE


class TestMinimalExport:
    async def test_with_export_disabled(self, root_dir):
        scheduler = Scheduler(root_dir)
        assert scheduler.export_dir is None
        assert scheduler.dashboard_build is None

    async def test_with_no_runs(self, root_dir, report_dir, zipped_build):
        scheduler = Scheduler(root_dir, report_dir, zipped_build=zipped_build)
        assert scheduler.export_dir == report_dir
        assert scheduler.dashboard_build == zipped_build

        await scheduler.start()

        assert (report_dir / "RUNS").exists()
        assert (report_dir / "RUNS" / "index.html").exists()

        assert len(list((report_dir / exportAttachmentFolderName).iterdir())) == 2

        assert (
            report_dir / exportAttachmentFolderName / "runs.json"
        ).read_text() == "[]"
        assert (
            report_dir / exportAttachmentFolderName / "projects.json"
        ).read_text() == "{}"


class TestExportsWithRuns:
    async def test_with_a_single_run(
        self,
        helper_create_test_run,
        create_session_with_hierarchy_with_no_retries,
        attach_config,
        root_dir,
        report_dir,
        zipped_build,
    ):
        test_run = await helper_create_test_run()
        await attach_config(test_run.testID)
        await create_session_with_hierarchy_with_no_retries(test_run.testID)
        await create_session_with_hierarchy_with_no_retries(test_run.testID)
        await create_session_with_hierarchy_with_no_retries(test_run.testID)

        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, out_dir=report_dir, zipped_build=zipped_build).start()
        assert (report_dir / "RUNS").exists()

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
        assert first_run["passedSuites"] == first_run["skippedSuites"] == 0
        assert first_run["failedSuites"] == 3 * 3
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
            "suiteSummary",
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

        not_included = (
            await SuiteBase.filter(session__test_id=test_run.testID)
            .order_by("ended")
            .limit(3)
            .order_by("-ended")
            .first()
            .values_list("suiteID", flat=True)
        )
        assert not_included not in noted  # we only latest 6 suites

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
                "rollup_tests",
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
        test_run = await helper_create_test_run()
        session = await helper_create_test_session(test_run.testID)

        suite = await create_suite(session.sessionID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(child.suiteID, test_run.testID)
        child = await create_suite(session.sessionID, parent=suite.suiteID)
        await register_patch_suite(suite.suiteID, test_run.testID)
        await register_patch_suite(child.suiteID, test_run.testID)

        run(
            f'handshake patch "{root_dir}" -o "{report_dir}" -b "{zipped_build}"',
            shell=True,
            stderr=PIPE,
        )

        assert report_dir.exists()
        assert (report_dir / exportAttachmentFolderName).exists()
        assert (report_dir / "RUNS" / "index.html").exists()

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
        self, helper_create_test_run, report_dir, zipped_build, root_dir
    ):
        first = await helper_create_test_run("test-1")
        test_run = await helper_create_test_run("test-1")
        project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, out_dir=report_dir, zipped_build=zipped_build).start()

        # TESTING projects.json
        feed = json.loads(
            (
                report_dir / exportAttachmentFolderName / EXPORT_PROJECTS_FILE_NAME
            ).read_text()
        )
        for_this_project = feed[project]
        assert len(for_this_project) == 2

    async def test_with_multiple_runs_in_multiple_project(
        self, helper_create_test_run, report_dir, zipped_build, root_dir
    ):
        first = await helper_create_test_run("test-1")
        test_run = await helper_create_test_run("test-1")
        project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        first = await helper_create_test_run("test-2")
        test_run = await helper_create_test_run("test-2")

        second_project = test_run.projectName

        await register_patch_test_run(first.testID)
        await register_patch_test_run(test_run.testID)

        await Scheduler(root_dir, out_dir=report_dir, zipped_build=zipped_build).start()

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
