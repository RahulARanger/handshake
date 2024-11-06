import datetime
import pathlib
from pytest import mark
from handshake.services.DBService.models import (
    RunBase,
    TaskBase,
    TestLogBase,
    SuiteBase,
)
from subprocess import run
from handshake.services.DBService.models.enums import Status, LogType, SuiteType
from handshake.services.SchedularService.modifySuites import patchTestSuite
from handshake.services.SchedularService.completeTestRun import patchTestRun
from handshake.services.SchedularService.register import (
    register_patch_test_run,
    register_patch_suite,
)
from __test__.test_patch_jobs.test_patch_jobs.test_patch_suite import TestPatchSuiteJob
from handshake.services.SchedularService.handlePending import patch_jobs
from tortoise.expressions import Q
from handshake.services.SchedularService.constants import JobType


async def case_index(test_id):
    t_record = await SuiteBase.filter(suiteID=test_id).first()
    return t_record.case_index


@mark.usefixtures("sample_test_session")
class TestPatchRunJob:
    async def test_empty_run(self, helper_create_test_run):
        test = await helper_create_test_run()

        await register_patch_test_run(test.testID)
        assert await patchTestRun(test.testID)

        empty = await RunBase.filter(testID=test.testID).first()
        assert empty.standing == Status.PASSED
        assert empty.passed == empty.failed == empty.skipped == empty.tests == 0
        assert (
            empty.suiteSummary["passed"]
            == empty.suiteSummary["failed"]
            == empty.suiteSummary["count"]
            == empty.suiteSummary["skipped"]
        )
        assert empty.tests == empty.passed == empty.failed == empty.skipped == 0

    async def test_avoidParentSuitesInCount(
        self,
        sample_test_session,
        create_hierarchy,
        attach_config,
        create_suite,
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        await attach_config(test.testID, avoidParentSuitesInCount=True)
        check_for = str(pathlib.Path("inside-1") / "spec-1.js")

        parent_suite = await create_suite(
            session_id, file=check_for
        )  # this should not be counted in summary

        tests, suites = await create_hierarchy(
            session_id,
            parent_suite.suiteID,
            test.testID,
            suite_files=[
                check_for,
                check_for,
                check_for,
            ],
        )
        await register_patch_test_run(test.testID)

        for suite in suites:
            assert await patchTestSuite(suite, test.testID)

        await register_patch_suite(parent_suite.suiteID, test.testID)
        assert await patchTestSuite(parent_suite.suiteID, test.testID)

        await patchTestRun(test.testID)

        record = await RunBase.filter(testID=test.testID).first()
        assert record.suiteSummary["count"] == 3  # notice this is not 4
        assert record.suiteSummary["passed"] == 0
        assert record.suiteSummary["failed"] == 3
        assert record.suiteSummary["skipped"] == 0

        assert check_for in record.specStructure
        assert (
            pathlib.Path(record.specStructure[check_for]["current"])
            == pathlib.Path("inside-1") / "spec-1.js"
        )

        # no changes in the test cases count calculated
        assert record.tests == 9
        assert record.passed == record.failed == record.skipped == 3

        # edge case test: if started and ended are same
        # we then check the parent is null or not, if null lower index else higher index
        # if parent is not null, next preference is over the title of the suite/test
        # still same, then suiteID

        parent_suite = await SuiteBase.filter(suiteID=parent_suite.suiteID).first()

        assert await case_index(parent_suite.suiteID) == "TS01"
        for index, suite in enumerate(suites):
            assert await case_index(suite) == f"TS0{index + 2}", "case index must match"

        assert await case_index(tests[0][0]) == "TC01"
        assert (
            await case_index(tests[1][0]) == "TC02"
        )  # because the ended timestamp is same for the first test case
        # of every suite
        assert await case_index(tests[2][0]) == "TC03"

        assert await case_index(tests[0][-1]) == "TC07"
        assert await case_index(tests[1][-1]) == "TC08"
        assert await case_index(tests[2][-1]) == "TC09"

    async def test_normal_run(
        self, sample_test_session, create_hierarchy, create_session
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        second_session = await create_session(test.testID)

        first_tests, suites = await create_hierarchy(session_id, "", test.testID)
        _, second_suites = await create_hierarchy(
            second_session.sessionID, "", test.testID
        )
        await register_patch_test_run(test.testID)

        for suite in suites + second_suites:
            result = await patchTestSuite(suite, test.testID)
            assert result is True, suite

        await session.update_from_dict(dict(passed=3, failed=3, skipped=3, tests=9))
        await second_session.update_from_dict(
            dict(passed=3, failed=3, skipped=3, tests=9)
        )
        await session.save()
        await second_session.save()

        assert await patchTestRun(test.testID)

        # case_index testing
        note = {"TS001", "TS002"}
        note_2 = {"TS005", "TS006"}

        note.remove(await case_index(suites[0]))
        assert len(note) == 1
        note.remove(await case_index(second_suites[0]))
        assert len(note) == 0

        note_2.remove(await case_index(suites[-1]))
        assert len(note_2) == 1
        note_2.remove(await case_index(second_suites[-1]))
        assert len(note_2) == 0

        assert await case_index(first_tests[-1][-1]) in {"TC018", "TC017"}

        test_record = await RunBase.filter(testID=test.testID).first()

        # test cases count calculated
        assert test_record.tests == 9 + 9
        assert test_record.passed == test_record.failed == test_record.skipped == 3 + 3

        # job related
        assert test_record.standing == Status.FAILED
        assert test_record.suiteSummary["passed"] == 0
        assert test_record.suiteSummary["failed"] == 3 + 3
        assert test_record.suiteSummary["skipped"] == 0
        assert test_record.suiteSummary["count"] == 3 + 3

        # assumption
        assert session.started < second_session.started
        assert session.ended < second_session.ended

        # tests
        assert test_record.started == session.started
        assert test_record.ended == second_session.ended
        assert (
            test_record.duration
            == (test_record.ended - test_record.started).total_seconds() * 1000
        )

    async def test_case_index_for_diff_types(self, create_suite, sample_test_session):
        session = await sample_test_session
        test = await session.test

        parent_suite = await create_suite(
            session.sessionID,
            started=datetime.datetime.now(),
            duration=datetime.timedelta(seconds=10),
        )
        p_setup = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=parent_suite.suiteID,
            hook=SuiteType.SETUP,
            started=parent_suite.started,
            duration=datetime.timedelta(seconds=2),
        )

        test_case = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=parent_suite.suiteID,
            is_test=True,
            started=parent_suite.started + datetime.timedelta(seconds=4),
            duration=datetime.timedelta(seconds=2),
        )
        setup = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=test_case.suiteID,
            hook=SuiteType.SETUP,
            started=p_setup.ended,
            duration=datetime.timedelta(seconds=2),
        )
        teardown = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=test_case.suiteID,
            hook=SuiteType.TEARDOWN,
            started=test_case.ended,
            duration=datetime.timedelta(seconds=2),
        )

        p_teardown = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=parent_suite.suiteID,
            hook=SuiteType.TEARDOWN,
            started=teardown.ended,
            duration=datetime.timedelta(seconds=2),
        )

        await register_patch_suite(parent_suite.suiteID, test.testID)
        assert await patchTestSuite(parent_suite.suiteID, test.testID)

        await session.update_from_dict(dict(passed=1, failed=0, skipped=0, tests=1))
        await session.save()

        await register_patch_test_run(test.testID)
        await patchTestRun(test.testID)

        test = await RunBase.filter(testID=test.testID).first()
        assert test.suiteSummary["count"] == 1
        assert test.suiteSummary["passed"] == 1

        assert await case_index(parent_suite.suiteID) == "TS01"
        assert await case_index(p_setup.suiteID) == "ST01"
        assert await case_index(setup.suiteID) == "ST02"
        assert await case_index(test_case.suiteID) == "TC01"
        assert await case_index(teardown.suiteID) == "TD01"
        assert await case_index(p_teardown.suiteID) == "TD02"

    async def test_case_index_for_retried_cases(
        self, create_suite, sample_test_session, attach_config
    ):
        session = await sample_test_session
        test = await session.test
        await attach_config(str(test.testID), 4)

        old_parent_suite = await create_suite(
            session.sessionID,
            started=datetime.datetime.now(),
            duration=datetime.timedelta(seconds=10),
            retried=0,
        )
        old_test_case = await create_suite(
            session.sessionID,
            standing=Status.FAILED,
            parent=old_parent_suite.suiteID,
            is_test=True,
            started=old_parent_suite.started,
            duration=datetime.timedelta(seconds=10),
            retried=0,
        )

        parent_suite = await create_suite(
            session.sessionID,
            started=old_test_case.started + datetime.timedelta(seconds=11),
            duration=datetime.timedelta(seconds=10),
            retried=1,
        )
        test_case = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=parent_suite.suiteID,
            is_test=True,
            started=parent_suite.started,
            duration=datetime.timedelta(seconds=6),
            retried=1,
        )

        await register_patch_suite(old_parent_suite.suiteID, test.testID)
        await register_patch_suite(parent_suite.suiteID, test.testID)

        await session.update_from_dict(dict(passed=1, failed=0, skipped=0, tests=1))
        await session.save()

        assert await patchTestSuite(old_parent_suite.suiteID, test.testID)
        assert await patchTestSuite(parent_suite.suiteID, test.testID)

        await register_patch_test_run(test.testID)
        await patchTestRun(test.testID)

        old_parent_suite = await SuiteBase.filter(
            suiteID=old_parent_suite.suiteID
        ).first()
        assert await case_index(parent_suite.suiteID) == "TS01"
        assert old_parent_suite.standing == Status.RETRIED
        assert await case_index(old_parent_suite.suiteID) == "TRS01"

        assert await case_index(test_case.suiteID) == "TC01"
        assert await case_index(old_test_case.suiteID) == "TC02"

    async def test_after_retries(
        self,
        sample_test_session,
        create_hierarchy,
        attach_config,
        create_suite,
        create_session,
    ):
        tester = TestPatchSuiteJob()
        test = await tester.test_many_retries(
            sample_test_session,
            create_hierarchy,
            attach_config,
            create_suite,
            create_session,
        )

        await register_patch_test_run(test.testID)
        await patchTestRun(test.testID)

        record = await RunBase.filter(testID=test.testID).first()
        assert record.failed == record.skipped == record.passed == 3
        assert record.tests == 9
        assert record.standing == Status.FAILED

        suite_agg = record.suiteSummary
        assert suite_agg["passed"] == suite_agg["skipped"] == 0
        assert suite_agg["count"] == suite_agg["failed"] == 4

        assert record.retried == 2

    async def test_patch_job_with_errors(
        self,
        sample_test_session,
        create_hierarchy,
    ):
        session = await sample_test_session
        test = session.test_id

        await create_hierarchy(session.sessionID, "", test)

        await session.update_from_dict(dict(passed=9, failed=9, skipped=9, tests=27))
        await session.save()

        assert not await patchTestRun(test)

        test_records = await TestLogBase.filter(
            Q(type=LogType.ERROR) & Q(test_id=test)
        ).all()
        assert len(test_records) == 1

        log = test_records[0]
        assert log.feed["type"] == JobType.MODIFY_TEST_RUN
        assert log.feed["incomplete"] == (await session.test).projectName
        assert log.feed["pending_suites"] == 3

    async def test_patch_job_with_processed_state(
        self,
        sample_test_session,
        create_hierarchy,
    ):
        session = await sample_test_session
        test = session.test_id

        await create_hierarchy(session.sessionID, "", test)

        test_run = await RunBase.filter(testID=test).first()
        test_run.standing = "FAILED"
        await test_run.save()

        task = await register_patch_test_run(test)
        assert not task.processed
        assert not await patchTestRun(test)
        assert (await TaskBase.filter(ticketID=test).first()).processed


class TestPatchTestRunThroughScheduler:
    async def test_patch_command(
        self,
        sample_test_session,
        create_session,
        create_hierarchy,
        create_suite,
        create_tests,
        root_dir,
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        second_session = await create_session(test.testID)

        _, suites = await create_hierarchy(session_id, "", test.testID)
        _, second_suites = await create_hierarchy(
            second_session.sessionID, "", test.testID
        )
        task = await register_patch_test_run(test.testID)
        assert not task.processed

        for suite in suites + second_suites:
            result = await patchTestSuite(suite, test.testID)
            assert result is True, suite

        await session.update_from_dict(dict(passed=9, failed=9, skipped=9, tests=27))
        await second_session.update_from_dict(
            dict(passed=9, failed=9, skipped=9, tests=27)
        )
        await session.save()
        await second_session.save()

        result = run(f'handshake patch "{root_dir}"', shell=True)
        assert result.returncode == 0

        test_record = await RunBase.filter(testID=test.testID).first()
        # case_index testing
        note = {"TS1", "TS2"}

        note.remove(await case_index(suites[0]))
        assert len(note) == 1
        note.remove(await case_index(second_suites[0]))
        assert len(note) == 0

        assert test_record.tests == (2 * (3 * 3)) * 3
        assert test_record.standing == Status.FAILED
        assert test_record.suiteSummary["count"] == 3 + 3

        assert (await TaskBase.filter(ticketID=task.ticketID).first()).processed

    async def test_patch_job_with_normal_runs(
        self,
        helper_create_test_run,
        create_suite,
        create_hierarchy,
        helper_create_test_session,
    ):
        test_1 = await helper_create_test_run()
        test_2 = await helper_create_test_run()

        session_11, session_12 = await helper_create_test_session(
            test_1.testID
        ), await helper_create_test_session(test_1.testID)
        session_21, session_22 = await helper_create_test_session(
            test_2.testID
        ), await helper_create_test_session(test_2.testID)

        first_tests, first_suites = await create_hierarchy(
            session_11.sessionID, "", test_1.testID
        )
        second_tests, second_suites = await create_hierarchy(
            session_12.sessionID, "", test_1.testID
        )
        await create_hierarchy(session_21.sessionID, "", test_2.testID)
        last_tests, last_suites = await create_hierarchy(
            session_22.sessionID, "", test_2.testID
        )

        await session_11.update_from_dict(dict(passed=3, failed=3, skipped=3, tests=18))
        await session_12.update_from_dict(dict(passed=3, failed=3, skipped=3, tests=18))
        await session_21.update_from_dict(dict(passed=3, failed=3, skipped=3, tests=18))
        await session_22.update_from_dict(dict(passed=3, failed=3, skipped=3, tests=18))
        await session_11.save()
        await session_12.save()
        await session_21.save()
        await session_22.save()

        await register_patch_test_run(test_1.testID)
        await register_patch_test_run(test_2.testID)

        await patch_jobs()

        assert await case_index(first_tests[0][0]) in {"TC1", "TC2"}
        assert await case_index(second_tests[0][0]) in {"TC1", "TC2"}
        assert await case_index(last_tests[0][0]) in {"TC1", "TC2"}

        assert await case_index(first_suites[0]) in {"TS1", "TS2"}
        assert await case_index(second_suites[0]) in {"TS1", "TS2"}
        assert await case_index(last_suites[0]) in {"TS1", "TS2"}

        test_record = await RunBase.filter(testID=test_1.testID).first()

        assert test_record.tests == (2 * (3 * 3)) * 3
        assert test_record.standing == Status.FAILED
        assert test_record.suiteSummary["count"] == 3 + 3

        assert (await TaskBase.filter(ticketID=test_2.testID).first()).processed

        test_record = await RunBase.filter(testID=test_2.testID).first()

        assert test_record.tests == (2 * (3 * 3)) * 3
        assert test_record.standing == Status.FAILED
        assert test_record.suiteSummary["count"] == 3 + 3

        assert (await TaskBase.filter(ticketID=test_2.testID).first()).processed
