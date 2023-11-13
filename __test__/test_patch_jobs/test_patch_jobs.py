import datetime

from pytest import mark
from graspit.services.DBService.models import (
    SuiteBase,
    RollupBase,
    RunBase,
    SessionBase,
    RetriedBase,
    TestConfigBase,
)
from graspit.services.DBService.models.enums import Status, AttachmentType
from graspit.services.SchedularService.modifySuites import patchTestSuite
from graspit.services.SchedularService.completeTestRun import patchTestRun
from graspit.services.SchedularService.register import (
    register_patch_suite,
    register_patch_test_run,
)


@mark.usefixtures("sample_test_session")
class TestPatchSuiteJob:
    async def test_empty_suite(self, sample_test_session, create_suite):
        session = await sample_test_session
        test_id = session.test_id

        session_id = str(session.sessionID)

        parent_suite = await create_suite(session_id, "suite-parent")
        parent_id = str(parent_suite.suiteID)

        await register_patch_suite(parent_id, test_id)
        assert await patchTestSuite(parent_suite.suiteID, test_id)

        # if there are no test entities it won't make any change
        record = await RollupBase.filter(suite_id=parent_suite.suiteID).first()
        assert record.passed == record.failed == record.tests == record.skipped == 0
        await record.delete()

        parent_suite = await SuiteBase.filter(suiteID=parent_suite.suiteID).first()
        assert parent_suite.standing == Status.PASSED
        assert (
            parent_suite.passed
            == parent_suite.failed
            == parent_suite.skipped
            == parent_suite.tests
            == 0
        ), "Patching any empty suite has 0s with passed as status"

    async def test_rollup_values(
        self, sample_test_run, sample_test_session, create_suite, create_tests
    ):
        session = await sample_test_session
        test_id = session.test_id
        session_id = str(session.sessionID)

        parent_suite = await create_suite(session_id)
        parent_id = str(parent_suite.suiteID)

        suite = await create_suite(session_id, "suite-1", parent_id)
        suite_id = str(suite.suiteID)

        await create_tests(session_id, suite_id)
        await register_patch_suite(suite_id, test_id)
        await register_patch_suite(parent_id, test_id)

        assert await patchTestSuite(suite_id, test_id)
        assert await patchTestSuite(parent_id, test_id)

        child_suite = await SuiteBase.filter(suiteID=suite_id).first()
        assert child_suite.passed == child_suite.failed == child_suite.skipped == 3
        assert child_suite.tests == 9

        child_rollup_suite = await RollupBase.filter(suite_id=suite_id).first()
        assert (
            child_rollup_suite.passed
            == child_rollup_suite.failed
            == child_rollup_suite.skipped
            == 3
        )
        assert child_rollup_suite.tests == 9

        parent_suite = await SuiteBase.filter(suiteID=parent_id).first()
        assert parent_suite.passed == parent_suite.skipped == 0
        assert parent_suite.failed == 1
        assert parent_suite.tests == 1

        parent_rollup_suite = await RollupBase.filter(suite_id=parent_id).first()
        assert (
            parent_rollup_suite.passed
            == parent_rollup_suite.failed
            == parent_rollup_suite.skipped
            == 3
        )
        assert parent_rollup_suite.tests == 9

    async def test_rollup_errors(
        self, sample_test_session, create_suite, create_hierarchy
    ):
        session = await sample_test_session
        test_id = session.test_id
        session_id = session.sessionID
        parent_suite = await create_suite(session_id)

        tests, suites = await create_hierarchy(
            session_id, parent_suite.suiteID, test_id
        )
        await register_patch_suite(parent_suite.suiteID, test_id)

        for suite in suites:
            assert await patchTestSuite(suite, test_id)
        assert await patchTestSuite(parent_suite.suiteID, test_id)

        for index, suite in enumerate(suites):
            suite_record = await SuiteBase.filter(suiteID=suite).first()
            errors = suite_record.errors
            assert len(errors) == 3

            for _index, item in enumerate(errors):
                assert item["message"] == f"{index}-{_index}"
                assert item["mailedFrom"] == [str(tests[index][_index])]

        parent_errors = (
            await SuiteBase.filter(suiteID=parent_suite.suiteID).first()
        ).errors
        assert len(parent_errors) == 9

        for _index, suite in enumerate(suites):
            test_index = _index % 3
            suite_index = _index // 3

            item = parent_errors[_index]
            assert item["message"] == f"{suite_index}-{test_index}"
            assert item["mailedFrom"] == [
                str(tests[suite_index][test_index]),
                str(suites[suite_index]),
            ]

    async def test_dependency_of_suites(self, sample_test_session, create_suite):
        # we would have suite - 1 and suite - 2
        # suite - 2 is child of the suite - 1
        # suite - 2 is under processing but suite - 1 will now be processed so, in that case

        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test
        suites = []

        for suiteIndex in range(2):
            suite = await create_suite(session_id, f"sample-suite-{suiteIndex + 1}")
            suites.append(suite)
            await register_patch_suite(suite.suiteID, test.testID)

        child_suite = suites[1]
        parent_suite = suites[0]
        await child_suite.update_from_dict(dict(parent=parent_suite.suiteID))
        await child_suite.save()

        # if returned false, Task will not be deleted
        assert not await patchTestSuite(parent_suite.suiteID, session.test)

        assert await patchTestSuite(child_suite.suiteID, session.test)
        assert await patchTestSuite(parent_suite.suiteID, session.test)

    async def test_retried_suite_match(
        self, sample_test_session, create_suite, create_tests, attach_config
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        await attach_config(str(test.testID), 1)

        # initial suite
        suite = await create_suite(session_id)
        await create_tests(session_id, suite.suiteID)
        await register_patch_suite(suite.suiteID, test.testID)
        await patchTestSuite(suite.suiteID, test.testID)

        record = await RetriedBase.filter(suite_id=suite.suiteID).first()
        assert record is not None
        assert record.tests == [str(suite.suiteID)]
        assert record.length == 1
        assert (await record.suite).suiteID == suite.suiteID

        # retried suite
        retried_suite = await create_suite(session_id, retried=1)
        await create_tests(session_id, retried_suite.suiteID, retried=1)

        await register_patch_suite(retried_suite.suiteID, test.testID)
        await patchTestSuite(retried_suite.suiteID, test.testID)

        record = await RetriedBase.filter(suite_id=retried_suite.suiteID).first()
        assert record is not None
        assert record.tests == [str(suite.suiteID), str(retried_suite.suiteID)]
        assert record.length == 2
        assert (await record.suite).suiteID == retried_suite.suiteID

    async def test_many_retries(
        self, sample_test_session, create_hierarchy, attach_config, create_suite
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        await attach_config(str(test.testID), 2)

        parent_suite = await create_suite(session_id)
        first_tests, first_suites = await create_hierarchy(
            session_id,
            parent_suite.suiteID,
            test.testID,
        )

        parent_suite_2 = await create_suite(session_id, retried=1)
        second_tests, second_suites = await create_hierarchy(
            session_id, parent_suite_2.suiteID, test.testID, retried=1
        )

        parent_suite_3 = await create_suite(session_id, retried=2)
        third_tests, third_suites = await create_hierarchy(
            session_id, parent_suite_3.suiteID, test.testID, retried=2
        )

        for _ in [parent_suite, parent_suite_2, parent_suite_3]:
            await register_patch_suite(_.suiteID, test.testID)

        for index, suite in enumerate(
            [
                *first_suites,
                parent_suite.suiteID,
                *second_suites,
                parent_suite_2.suiteID,
                *third_suites,
                parent_suite_3.suiteID,
            ]
        ):
            assert await patchTestSuite(str(suite), str(test.testID)), index

        for index, suite in enumerate(
            [
                parent_suite.suiteID,
                *first_suites,
                parent_suite_2.suiteID,
                *second_suites,
            ]
        ):
            assert not await RetriedBase.exists(suite_id=suite), index

        for index, suites in enumerate(
            [
                [parent_suite.suiteID, parent_suite_2.suiteID, parent_suite_3.suiteID],
                *[
                    [first_suites[_], second_suites[_], third_suites[_]]
                    for _ in range(len(first_suites))
                ],
            ],
        ):
            record = await RetriedBase.filter(suite_id=suites[-1]).first()
            assert record is not None, "record should exist"
            assert record.tests == [str(_) for _ in suites]
            assert record.length == 3


@mark.usefixtures("sample_test_session")
class TestPatchRunJob:
    async def test_empty_run(self, sample_test_run):
        test = await sample_test_run

        await register_patch_test_run(test.testID)
        assert await patchTestRun(test.testID, test.testID)

        empty = await RunBase.filter(testID=test.testID).first()
        assert empty.standing == Status.PASSED
        assert empty.passed == empty.failed == empty.skipped == empty.tests == 0
        assert (
            empty.suiteSummary["passed"]
            == empty.suiteSummary["failed"]
            == empty.suiteSummary["count"]
            == empty.suiteSummary["skipped"]
        )

    async def test_run_with_no_sessions(self, sample_test_run):
        test = await sample_test_run
        await SessionBase.filter(test_id=test.testID).delete()
        assert not await SessionBase.filter(
            test_id=test.testID
        ).exists(), "Session should not exist!"
        await register_patch_test_run(test.testID)

        assert await patchTestRun(test.testID, test.testID)

        error = await TestConfigBase.filter(
            test_id=test.testID, type=AttachmentType.ERROR
        ).first()

        assert (
            error is not None
        ), "Test run should be marked with an error in case of any error"
        assert (
            "no sessions" in error.attachmentValue["reason"]
        ), "There should be a valid reason"

    async def test_normal_run(
        self, sample_test_session, create_hierarchy, create_session
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        second_session = await create_session(test.testID)

        _, suites = await create_hierarchy(session_id, "", test.testID)
        _, second_suites = await create_hierarchy(
            second_session.sessionID, "", test.testID
        )
        await register_patch_test_run(test.testID)

        for suite in suites + second_suites:
            assert await patchTestSuite(suite, test.testID)

        await session.update_from_dict(
            dict(passed=9, failed=9, skipped=9, tests=27, retried=3)
        )
        await second_session.update_from_dict(
            dict(passed=9, failed=9, skipped=9, tests=27, retried=5)
        )
        await session.save()
        await second_session.save()

        assert await patchTestRun(test.testID, test.testID)

        test_record = await RunBase.filter(testID=test.testID).first()

        # session dependant
        assert (
            test_record.passed
            == test_record.failed
            == test_record.skipped
            == 2 * (3 * 3)
        )
        assert test_record.tests == (2 * (3 * 3)) * 3

        # job related
        assert test_record.standing == Status.FAILED
        assert test_record.suiteSummary["passed"] == 0
        assert test_record.suiteSummary["failed"] == 3 + 3
        assert test_record.suiteSummary["skipped"] == 0
        assert test_record.suiteSummary["count"] == 3 + 3

        assert test_record.retried == 5 + 3

        # assumption
        assert session.started < second_session.started
        assert session.ended < second_session.ended

        # tests
        assert test_record.started == session.started
        assert test_record.ended == second_session.ended
        assert test_record.duration == (test_record.ended - test_record.started).seconds
