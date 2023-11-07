from pytest import mark
from graspit.services.DBService.models import TaskBase, SuiteBase, RunBase, SessionBase
from graspit.services.SchedularService.constants import JobType
from graspit.services.SchedularService.modifySuites import patchTestSuite
from graspit.services.SchedularService.completeTestRun import patchTestRun
from graspit.services.DBService.models.types import SuiteType, Status
from datetime import datetime, timedelta
from subprocess import call


@mark.usefixtures("sample_test_session")
class TestHandleSuiteStatus:
    async def test_dependent_suites(self, sample_test_session):
        # we would have suite - 1 and suite - 2
        # suite - 2 is child of the suite - 1
        # suite - 2 is under processing but suite - 1 will now be processed so, in that case

        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test
        suites = []
        tasks = []

        for suiteIndex in range(2):
            suite = await SuiteBase.create(
                started=datetime.now(),
                title=f"sample-suite-{suiteIndex + 1}",
                session_id=session_id,
                suiteType=SuiteType.SUITE,
                file="",
                parent="",
                standing=Status.YET_TO_CALCULATE,
            )
            suites.append(suite)
            tasks.append(
                await TaskBase.create(
                    ticketID=suite.suiteID,
                    type=JobType.MODIFY_SUITE,
                    test_id=test.testID,
                    picked=True,
                )
            )

        child_suite = suites[1]
        parent_suite = suites[0]
        await child_suite.update_from_dict(dict(parent=parent_suite.suiteID))
        await child_suite.save()

        before_parent_tasks = tasks[0]
        await before_parent_tasks.update_from_dict(dict(picked=True))
        await before_parent_tasks.save()

        await patchTestSuite(parent_suite.suiteID, session.test)

        parent_task = await TaskBase.filter(ticketID=parent_suite.suiteID).first()
        assert not parent_task.picked, "Task still exists and is ready to get picked"

        await patchTestSuite(child_suite.suiteID, session.test)
        await patchTestSuite(parent_suite.suiteID, session.test)
        assert not await TaskBase.exists(ticketID=parent_suite.suiteID)

    async def test_rollup_errors(self, sample_test_session):
        # we have test suites nested till 3rd level with 1 failed test case in its each level
        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test
        suites = []
        tasks = []

        flat_errors = [dict(type="a"), dict(type="b"), dict(type="c")]

        for suiteIndex in range(3):
            suite = await SuiteBase.create(
                started=datetime.now(),
                title=f"sample-suite-{suiteIndex + 1}",
                session_id=session_id,
                suiteType=SuiteType.SUITE,
                file="",
                parent="" if suiteIndex < 1 else suites[suiteIndex - 1].suiteID,
                standing=Status.YET_TO_CALCULATE,
            )
            suites.append(suite)
            tasks.append(
                await TaskBase.create(
                    ticketID=suite.suiteID,
                    type=JobType.MODIFY_SUITE,
                    test_id=test.testID,
                    picked=True,
                )
            )

        for testIndex in range(3):
            await SuiteBase.create(
                started=datetime.now(),
                title=f"sample-test-{testIndex + 1}",
                session_id=session_id,
                suiteType=SuiteType.TEST,
                file="",
                parent=suites[testIndex].suiteID,
                standing=Status.FAILED,
                errors=[flat_errors[testIndex]],
            )

        for suiteIndex in reversed(range(3)):
            await patchTestSuite(suites[suiteIndex].suiteID, session.test)

            parent_suite = await SuiteBase.filter(
                suiteID=suites[suiteIndex].suiteID
            ).first()
            expected = [*parent_suite.errors]
            for error in flat_errors[suiteIndex:]:
                index = expected.index(error)  # raises ValueError if not found
                del expected[index]


@mark.usefixtures("sample_test_session")
class TestCompleteTestRun:
    async def test_simple_run(self, sample_test_session):
        session = await sample_test_session
        test = await session.test
        await TestHandleSuiteStatus().test_dependent_suites(sample_test_session)

        session = await SessionBase.filter(sessionID=session.sessionID).first()
        await session.update_from_dict(dict(ended=test.started + timedelta(seconds=30)))
        await session.save()

        await TaskBase.create(
            ticketID=test.testID,
            type=JobType.MODIFY_TEST_RUN,
            test_id=test.testID,
            picked=True,
        )
        await patchTestRun(test.testID, test.testID)

        test_run = await RunBase.filter(testID=test.testID).first()
        # status of each of its tests (not the suites)
        assert test_run.suiteSummary == dict(count=2, passed=2, failed=0, skipped=0)

        assert session.passed == 0
        # we assume the details are available from the session side but since we do not have such information
        # in our test data we get 0
        assert test_run.passed == 0
        assert test_run.failed == 0
        assert test_run.skipped == 0
        assert test_run.standing == Status.PASSED

    async def test_calc_entities_status(self, sample_test_session):
        session = await sample_test_session
        test = await session.test

        await TestHandleSuiteStatus().test_one_depth_independent_suites(
            sample_test_session
        )
        _second_session = SessionBase.create(
            started=datetime.now(), test_id=test.testID
        )
        await TestHandleSuiteStatus().test_one_depth_independent_suites(_second_session)

        session, second_session = await SessionBase.filter(test_id=test.testID).all()

        session = await SessionBase.filter(sessionID=session.sessionID).first()
        await session.update_from_dict(
            dict(
                ended=test.started + timedelta(seconds=30),
                skipped=2,
                passed=3,
                failed=1,
                tests=6,
            )
        )
        await second_session.update_from_dict(
            dict(
                ended=test.started + timedelta(seconds=45),
                skipped=2,
                passed=3,
                failed=1,
                tests=6,
            )
        )

        await session.save()
        await second_session.save()

        await TaskBase.create(
            ticketID=test.testID,
            type=JobType.MODIFY_TEST_RUN,
            test_id=test.testID,
            picked=True,
        )
        await patchTestRun(test.testID, test.testID)

        test_run = await RunBase.filter(testID=test.testID).first()
        assert test_run.suiteSummary == dict(count=6, passed=2, skipped=2, failed=2)

        assert test_run.passed == 6
        assert test_run.failed == 2
        assert test_run.skipped == 4
        assert test_run.standing == Status.FAILED

        assert test_run.ended == second_session.ended
        assert test_run.started == session.started
        assert (
            test_run.duration != 45e3
        ), "we do not include the duration starting from the test run"
        assert (
            test_run.duration
            == (second_session.ended - session.started).total_seconds() * 1e3
        ), "but from the first session"

    async def test_cli_patch_command(self, sample_test_session, db_path):
        session = await sample_test_session
        test = await session.test

        await TestHandleSuiteStatus().test_dependent_suites(sample_test_session)

        session = await SessionBase.filter(sessionID=session.sessionID).first()
        await session.update_from_dict(dict(ended=test.started + timedelta(seconds=30)))
        await session.save()

        await TaskBase.create(
            ticketID=test.testID,
            type=JobType.MODIFY_TEST_RUN,
            test_id=test.testID,
            picked=True,
        )

        call(f'graspit patch "{db_path.parent}"', shell=True)

        test_run = await RunBase.filter(testID=test.testID).first()
        # status of each of its tests (not the suites)
        assert test_run.suiteSummary == dict(count=2, passed=2, failed=0, skipped=0)
        assert test_run.standing == Status.PASSED
