from pytest import mark
from handshake.services.DBService.models import (
    SuiteBase,
    RollupBase,
    SessionBase,
    RetriedBase,
    TaskBase,
    TestLogBase,
)
from subprocess import run
from handshake.services.DBService.models.enums import (
    Status,
    LogType,
    SuiteType,
    LogGeneratedBy,
)
from handshake.services.SchedularService.constants import JobType
from handshake.services.SchedularService.modifySuites import patchTestSuite
from handshake.services.SchedularService.register import register_patch_suite
from handshake.services.SchedularService.handlePending import patch_jobs
from datetime import datetime, timedelta


async def retried_later(test_id):
    t_record = await SuiteBase.filter(suiteID=test_id).first()
    return t_record.retried_later


@mark.usefixtures("sample_test_session")
class TestPatchSuiteJob:
    async def test_empty_suite(
        self,
        sample_test_session,
        create_suite,
        parent_id=None,
        test_id=None,
        return_created=False,
    ):
        if parent_id is None and test_id is None:
            session = await sample_test_session
            test_id = session.test_id

            session_id = str(session.sessionID)

            parent_suite = await create_suite(session_id, "suite-parent")
            parent_id = str(parent_suite.suiteID)

            await register_patch_suite(parent_id, test_id)

            if return_created:
                return parent_id, test_id

            assert await patchTestSuite(parent_id, test_id)

        # if there are no test entities, it won't make any change
        record = await RollupBase.filter(suite_id=parent_id).first()
        assert record, "Rollup record must have been created"
        assert record.passed == record.failed == record.tests == record.skipped == 0
        await record.delete()

        parent_suite = await SuiteBase.filter(suiteID=parent_id).first()
        assert parent_suite.standing == Status.PASSED
        assert (
            parent_suite.passed
            == parent_suite.failed
            == parent_suite.skipped
            == parent_suite.tests
            == 0
        ), "Patching any empty suite has 0s with passed as status"

        assert parent_suite.setup_duration == 0, "there are no setup steps"
        assert parent_suite.teardown_duration == 0, "there are no teardown steps"

    async def test_rollup_values(
        self,
        sample_test_session,
        create_suite,
        create_tests,
        suite_id=None,
        parent_id=None,
        return_created=False,
    ):
        if suite_id is None and parent_id is None:
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

            if return_created:
                return suite_id, parent_id

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
        # suite - 2 is under processing, but suite - 1 will now be processed so, in that case the parent suite
        # will not be processed until the child suite is processed

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

        test_id = (await session.test).testID
        assert not await patchTestSuite(parent_suite.suiteID, test_id)

        assert await patchTestSuite(child_suite.suiteID, test_id)
        assert await patchTestSuite(parent_suite.suiteID, test_id)

        for suite in (parent_suite, child_suite):
            assert suite.setup_duration == 0, "no setup steps are there"
            assert suite.teardown_duration == 0, "no teardown steps are there"

    async def test_dependency_on_hooks(
        self,
        sample_test_session,
        create_suite,
        create_tests,
        attach_config,
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        # initial suite
        top_suite = await create_suite(session_id, started=None)
        suite = await create_suite(session_id, started=None, parent=top_suite.suiteID)
        tests = await create_tests(session_id, suite.suiteID)

        await register_patch_suite(suite.suiteID, test.testID)
        await register_patch_suite(top_suite.suiteID, test.testID)

        # setting hooks
        tests[0].started = tests[0].started - timedelta(minutes=10)
        await tests[0].save()

        first_one = await create_suite(
            session_id,
            parent=tests[0].suiteID,
            hook="SETUP",
            standing=Status.PASSED,
            started=tests[0].started,
            duration=timedelta(minutes=10),
        )  # took 10 minutes

        await create_suite(
            session_id,
            standing=Status.PASSED,
            parent=tests[0].suiteID,
            hook="TEARDOWN",
            duration=timedelta(seconds=12),
        )
        await create_suite(
            session_id,
            standing=Status.PASSED,
            parent=suite.suiteID,
            hook="SETUP",
            duration=timedelta(seconds=12),
        )
        last_one = await create_suite(
            session_id,
            standing=Status.PASSED,
            parent=suite.suiteID,
            hook="TEARDOWN",
            duration=timedelta(seconds=12),
        )

        # this is assumed to be provided by the API
        suite.setup_duration = 12 * 1e3
        suite.teardown_duration = 12 * 1e3

        tests[0].setup_duration = 60 * 10 * 1e3
        tests[0].teardown_duration = 12 * 1e3

        await suite.save()
        await tests[0].save()

        assert not (suite.started or suite.ended), "we didn't get this info"
        assert await patchTestSuite(suite.suiteID, test.testID)
        assert await patchTestSuite(top_suite.suiteID, test.testID)

        suite = await SuiteBase.filter(suiteID=suite.suiteID).first()
        top_suite = await SuiteBase.filter(suiteID=top_suite.suiteID).first()
        assert suite.started == first_one.started, (
            "we patched the start date since we didn't get the start date from the user and we pick the first child "
            "entity even if it is a hook"
        )
        assert suite.ended == last_one.ended
        assert (
            suite.duration == (last_one.ended - first_one.started).total_seconds() * 1e3
        )

        assert suite.setup_duration == (600 + 12) * 1000
        assert suite.teardown_duration == (12 * 2) * 1000
        assert top_suite.setup_duration == (600 + 12) * 1000
        assert top_suite.teardown_duration == (12 * 2) * 1000

    async def test_retried_suite_match(
        self,
        sample_test_session,
        create_suite,
        create_tests,
        attach_config,
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        await attach_config(str(test.testID), 1)

        # initial suite
        suite = await create_suite(session_id)
        tests = await create_tests(session_id, suite.suiteID)
        await register_patch_suite(suite.suiteID, test.testID)
        await patchTestSuite(suite.suiteID, test.testID)

        # initially, this would be marked as not retried later
        assert not await retried_later(suite.suiteID)

        record = await RetriedBase.filter(suite_id=suite.suiteID).first()
        assert record is not None
        assert record.tests == [str(suite.suiteID)]
        assert record.length == 1
        assert (await record.suite).suiteID == suite.suiteID

        # retried suite
        retried_suite = await create_suite(session_id, retried=1, started=suite.ended)
        retried_tests = await create_tests(session_id, retried_suite.suiteID, retried=1)

        await register_patch_suite(retried_suite.suiteID, test.testID)
        await patchTestSuite(retried_suite.suiteID, test.testID)

        # but now
        assert await retried_later(suite.suiteID)
        for test in tests:
            assert await retried_later(test.suiteID)

        assert not await retried_later(retried_suite.suiteID)
        assert not await retried_later(retried_tests[0].suiteID)

        record = await RetriedBase.filter(suite_id=retried_suite.suiteID).first()
        assert record is not None
        assert record.tests == [str(suite.suiteID), str(retried_suite.suiteID)]
        assert record.length == 2
        assert (await record.suite).suiteID == retried_suite.suiteID

    async def test_many_retries(
        self,
        sample_test_session,
        create_hierarchy,
        attach_config,
        create_suite,
        create_session,
    ):
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        second_session = await create_session(test.testID)
        third_session = await create_session(test.testID)

        await attach_config(str(test.testID), 2)

        parent_suite = await create_suite(session_id)
        first_tests, first_suites = await create_hierarchy(
            session_id, parent_suite.suiteID, test.testID, started=parent_suite.started
        )

        parent_suite_2 = await create_suite(
            second_session.sessionID, retried=1, started=parent_suite.ended
        )
        second_tests, second_suites = await create_hierarchy(
            second_session.sessionID,
            parent_suite_2.suiteID,
            test.testID,
            retried=1,
            started=parent_suite_2.started,
        )

        parent_suite_3 = await create_suite(
            third_session.sessionID, retried=2, started=parent_suite_2.ended
        )
        third_tests, third_suites = await create_hierarchy(
            third_session.sessionID,
            parent_suite_3.suiteID,
            test.testID,
            retried=2,
            started=parent_suite_3.started,
        )

        for _ in [parent_suite, parent_suite_2, parent_suite_3]:
            await register_patch_suite(_.suiteID, test.testID)

        await patch_jobs()

        # trying to re-patching things which were already patched
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
            result = await patchTestSuite(str(suite), str(test.testID)) is True
            assert (
                result is False
            ), f"entity at index: {index} must have already been patched"

        for index, suite in enumerate(
            [
                parent_suite.suiteID,
                *first_suites,
                parent_suite_2.suiteID,
                *second_suites,
            ]
        ):
            result = await RetriedBase.exists(suite_id=suite)
            assert await retried_later(suite)
            assert result is False, index

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

        for session in await SessionBase.filter(test_id=test.testID).all():
            await session.update_from_dict(dict(tests=9, passed=3, failed=3, skipped=3))
            await session.save()

        return test

    async def test_retried_label_for_retried_entities(
        self, sample_test_session, attach_config, create_suite
    ):
        session = await sample_test_session
        test = await session.test
        await attach_config(str(test.testID), 4)

        old_parent_suite = await create_suite(
            session.sessionID,
            started=datetime.now(),
            duration=timedelta(seconds=10),
            retried=0,
        )
        old_test_case = await create_suite(
            session.sessionID,
            standing=Status.FAILED,
            parent=old_parent_suite.suiteID,
            is_test=True,
            started=old_parent_suite.started,
            duration=timedelta(seconds=10),
            retried=0,
        )
        old_setup_case = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=old_test_case.suiteID,
            hook=SuiteType.SETUP,
            started=old_parent_suite.started,
            duration=timedelta(seconds=10),
            retried=0,
        )
        old_teardown_case = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=old_test_case.suiteID,
            hook=SuiteType.TEARDOWN,
            started=old_parent_suite.started,
            duration=timedelta(seconds=10),
            retried=0,
        )

        parent_suite = await create_suite(
            session.sessionID,
            started=old_test_case.started + timedelta(seconds=11),
            duration=timedelta(seconds=10),
            retried=1,
        )
        test_case = await create_suite(
            session.sessionID,
            standing=Status.PASSED,
            parent=parent_suite.suiteID,
            is_test=True,
            started=parent_suite.started,
            duration=timedelta(seconds=6),
            retried=1,
        )

        await register_patch_suite(old_parent_suite.suiteID, test.testID)
        await register_patch_suite(parent_suite.suiteID, test.testID)

        await session.update_from_dict(dict(passed=1, failed=0, skipped=0, tests=1))
        await session.save()

        assert await patchTestSuite(old_parent_suite.suiteID, test.testID)
        assert await patchTestSuite(parent_suite.suiteID, test.testID)

        assert await retried_later(old_parent_suite.suiteID)
        assert await retried_later(old_test_case.suiteID)
        assert await retried_later(old_setup_case.suiteID)
        assert await retried_later(old_teardown_case.suiteID)

        assert not await retried_later(parent_suite.suiteID)
        assert not await retried_later(test_case.suiteID)


@mark.usefixtures("sample_test_session")
class TestPatchSuiteScheduler:
    async def test_patch_job_simple(
        self, sample_test_session, create_suite, create_tests
    ):
        tester = TestPatchSuiteJob()
        suite_id, parent_id = await tester.test_rollup_values(
            sample_test_session,
            create_suite,
            create_tests,
            return_created=True,
        )
        await patch_jobs()

        await tester.test_rollup_values(
            sample_test_session,
            create_suite,
            create_tests,
            suite_id,
            parent_id,
        )

    async def test_empty_suite(self, sample_test_session, create_suite):
        tester = TestPatchSuiteJob()
        parent_id, test_id = await tester.test_empty_suite(
            sample_test_session, create_suite, return_created=True
        )
        await patch_jobs()

        await tester.test_empty_suite(
            sample_test_session, create_suite, parent_id, test_id
        )

    async def test_processing_parent_suite_with_pending_child_suite(
        self, sample_test_session, create_suite
    ):
        session = await sample_test_session

        parent_suite = await create_suite(session.sessionID)
        await create_suite(session.sessionID, parent=parent_suite.suiteID)
        await register_patch_suite(parent_suite.suiteID, session.test_id)
        assert (
            parent_suite.standing == Status.YET_TO_CALCULATE
        ), "suite has to be in yet to calculate state"
        await patch_jobs()

        # there is a child suite present but not registered
        # it might happen because the test run was interrupted in between

        # expected result, the processing of the parent suite will be skipped
        # AND marks the test run as failed as its child suite was not registered.

        records = await TestLogBase.filter(
            test_id=session.test_id,
            type=LogType.ERROR,
            generatedByGroup=LogGeneratedBy.SCHEDULER,
        ).all()
        assert len(records) == 1
        error_log = records[0]
        assert error_log.feed["parent_suite"] == str(parent_suite.suiteID)
        assert error_log.feed["job"] == JobType.MODIFY_SUITE
        assert "as the child suite was not registered" in error_log.message

    async def test_patching_suite_with_processing_child_suite(
        self, sample_test_session, create_suite
    ):
        session = await sample_test_session

        parent_suite = await create_suite(session.sessionID)
        child_suite = await create_suite(
            session.sessionID, parent=parent_suite.suiteID, standing=Status.PROCESSING
        )
        await register_patch_suite(parent_suite.suiteID, session.test_id)
        assert child_suite.standing == Status.PROCESSING
        await patch_jobs()

        # there is a child suite present, but still in processing state
        # it might happen because the test run was interrupted in between

        # expected result, the processing of the parent suite will be skipped
        # AND marks the test run as failed as its child suite was not registered.

        records = await TestLogBase.filter(
            test_id=session.test_id, type=LogType.ERROR
        ).all()
        assert len(records) == 1
        error_log = records[0]
        assert error_log.feed["parent_suite"] == str(parent_suite.suiteID)
        assert error_log.feed["job"] == JobType.MODIFY_SUITE
        assert "as the child suite was not registered" in error_log.message

    async def test_multiple_incomplete_suite(self, sample_test_session, create_suite):
        session = await sample_test_session

        parent_suite = await create_suite(session.sessionID)
        await create_suite(session.sessionID, parent=parent_suite.suiteID)
        await register_patch_suite(parent_suite.suiteID, session.test_id)

        parent_suite_2 = await create_suite(session.sessionID)
        await create_suite(session.sessionID, parent=parent_suite_2.suiteID)
        await register_patch_suite(parent_suite_2.suiteID, session.test_id)

        await patch_jobs()

        # there is a child suite present but not registered
        # it might happen because the test run was interrupted in between

        # expected result, the processing of the parent suite will be skipped
        # AND marks the test run as failed as its child suite was not registered.

        records = await TestLogBase.filter(
            test_id=session.test_id, type=LogType.ERROR
        ).all()
        assert len(records) == 2

        # coz we don't know which suite would be patched first, as they are independent,
        # so we find the index through condition
        order = records[1].feed["parent_suite"] == str(parent_suite.suiteID)

        error_log = records[int(order)]
        assert error_log.feed["parent_suite"] == str(parent_suite.suiteID)
        assert error_log.feed["job"] == JobType.MODIFY_SUITE
        assert "as the child suite was not registered" in error_log.message

        error_log = records[int(not order)]
        assert error_log.feed["parent_suite"] == str(parent_suite_2.suiteID)
        assert error_log.feed["job"] == JobType.MODIFY_SUITE
        assert "as the child suite was not registered" in error_log.message

    async def test_incomplete_processing_entities(
        self, sample_test_session, create_suite, create_tests
    ):
        session = await sample_test_session
        top_parent = await create_suite(session.sessionID)
        parent_suite = await create_suite(session.sessionID, parent=top_parent.suiteID)
        tests = await create_tests(session.sessionID, parent=parent_suite.suiteID)
        tests[0].standing = Status.PROCESSING
        await tests[0].save()

        for _ in (top_parent, parent_suite):
            await register_patch_suite(_.suiteID, session.test_id)

        await patch_jobs()

        # this is expected to throw error, since we have tests which were not updated,
        # and we have parent suite which was registered to be patched
        # possible error is in a reporter (it missed it), check TestLogBase for more info.

        records = await TestLogBase.filter(
            test_id=session.test_id, type=LogType.ERROR
        ).all()
        assert len(records) == 1

        error_log = records[0]
        assert error_log.feed["suiteID"] == str(parent_suite.suiteID)
        assert error_log.feed["job"] == JobType.MODIFY_SUITE
        assert "Which are not yet updated" in error_log.message

    async def test_patch_dependent_retried_suites(
        self, sample_test_session, create_suite, attach_config
    ):
        session = await sample_test_session

        await attach_config(session.test_id, file_retries=1)

        parent_suite = await create_suite(
            session.sessionID, retried=0, name="sample-test"
        )

        parent_suite_2 = await create_suite(
            session.sessionID, retried=1, name="sample-test", started=parent_suite.ended
        )

        # imagine if the parent suite_2 is processed at the same time as parent_suite
        # they belong to a different tree but parent_suite_2 is dependent on parent_suite_1 since
        await register_patch_suite(parent_suite_2.suiteID, session.test_id)
        await register_patch_suite(parent_suite.suiteID, session.test_id)

        await patch_jobs()
        note = await TestLogBase.filter(
            type=LogType.ERROR, test_id=session.test_id
        ).first()

        if note:
            print(note.feed, note.message)

        assert not note
        assert (
            await SuiteBase.filter(suiteID=parent_suite.suiteID).first()
        ).standing == "RETRIED"
        assert await retried_later(parent_suite.suiteID)
        assert (
            await SuiteBase.filter(suiteID=parent_suite_2.suiteID).first()
        ).standing == "PASSED"
        assert not await retried_later(parent_suite_2.suiteID)

    async def test_patch_command(
        self, sample_test_session, create_suite, create_tests, root_dir
    ):
        session = await sample_test_session
        test_id = session.test_id
        session_id = str(session.sessionID)

        parent_suite = await create_suite(session_id)
        parent_id = str(parent_suite.suiteID)

        suite = await create_suite(session_id, "suite-1", parent_id)
        suite_id = str(suite.suiteID)

        await create_tests(session_id, suite_id)

        child_task = await register_patch_suite(suite_id, test_id)
        parent_task = await register_patch_suite(parent_id, test_id)

        assert not child_task.processed
        assert not parent_task.processed

        result = run(f'handshake patch "{root_dir}"', shell=True)
        assert result.returncode == 0

        assert (await TaskBase.filter(ticketID=child_task.ticketID).first()).processed
        assert (await TaskBase.filter(ticketID=parent_task.ticketID).first()).processed

        # high level check to prove that it is processed successfully.
        child_suite = await SuiteBase.filter(suiteID=suite_id).first()
        assert child_suite.tests == 9

        child_rollup_suite = await RollupBase.filter(suite_id=suite_id).first()
        assert child_rollup_suite.tests == 9

        parent_rollup_suite = await RollupBase.filter(suite_id=parent_id).first()
        assert parent_rollup_suite.tests == 9

    async def test_patch_suite_dates(
        self, create_suite, create_tests, sample_test_session
    ):
        top_parent_suite = await create_suite(sample_test_session.sessionID)
        parent_suite = await create_suite(
            sample_test_session.sessionID, parent=top_parent_suite.suiteID
        )
        tests = await create_tests(sample_test_session.sessionID, parent_suite.suiteID)

        before_params = dict(
            started=top_parent_suite.started,
            ended=top_parent_suite.ended,
            duration=top_parent_suite.duration,
        )
        parent_suite.started = None
        parent_suite.ended = None
        # parent suite's start and end datetime were not provided
        await parent_suite.save()
        await register_patch_suite(parent_suite.suiteID, sample_test_session.test_id)
        await patch_jobs()

        expected_start_time = tests[0].started
        expected_end_time = tests[-1].ended

        values = (
            await SuiteBase.filter(suiteID=parent_suite.suiteID)
            .first()
            .values("started", "ended", "duration")
        )

        unchanged_values = (
            await SuiteBase.filter(suiteID=top_parent_suite.suiteID)
            .first()
            .values("started", "ended", "duration")
        )

        assert expected_start_time == values["started"]
        assert expected_end_time == values["ended"]
        assert (
            values["duration"]
            == (expected_end_time - expected_start_time).total_seconds() * 1e3
        )

        assert before_params == unchanged_values
