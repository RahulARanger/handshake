from pytest import mark
from graspit.services.DBService.models import TaskBase, SuiteBase, RunBase, SessionBase
from graspit.services.SchedularService.constants import JobType
from graspit.services.SchedularService.modifySuites import patchTestSuite
from graspit.services.SchedularService.completeTestRun import patchTestRun
from graspit.services.DBService.models.types import SuiteType, Status
from datetime import datetime, timedelta
from subprocess import call


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
