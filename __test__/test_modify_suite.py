from pytest import mark, fixture
from graspit.services.DBService.models import TaskBase, SuiteBase, RunBase, JobBase, SessionBase
from graspit.services.SchedularService.constants import JobType
from graspit.services.SchedularService.modifySuites import handleSuiteStatus
from graspit.services.DBService.models.types import SuiteType, Status
from datetime import datetime


@mark.usefixtures("sample_test_session")
class TestHandleSuiteStatus:
    async def test_one_depth_independent_suites(self, sample_test_session):
        # testing the test run with just three suites
        # first one is skipped
        # second one is failed (with 2 direct test cases 1 - passed 1 - failed)
        # third one is passed (with 3 direct test cases 2 - passed 1 - skipped)

        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test

        suites = []
        tasks = []

        for suiteIndex in range(3):
            suite = await SuiteBase.create(
                started=datetime.now(),
                title=f"sample-suite-{suiteIndex + 1}", session_id=session_id,
                suiteType=SuiteType.SUITE,
                file="", parent="", standing=Status.YET_TO_CALCULATE
            )
            suites.append(suite)
            tasks.append(
                await TaskBase.create(
                    ticketID=suite.suiteID,
                    type=JobType.MODIFY_SUITE,
                    test_id=test.testID, picked=True
                )
            )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[0].suiteID,
            title="sample-test-1-1", session_id=session_id,
            file='', suiteType=SuiteType.TEST,
            standing=Status.SKIPPED
        )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[1].suiteID,
            title="sample-test-2-1", session_id=session_id,
            file="", suiteType=SuiteType.TEST,
            standing=Status.PASSED
        )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[1].suiteID,
            title="sample-test-2-2", session_id=session_id,
            file="", suiteType=SuiteType.TEST,
            standing=Status.FAILED
        )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[2].suiteID,
            title="sample-test-3-1", session_id=session_id,
            file="", suiteType=SuiteType.TEST,
            standing=Status.PASSED
        )
        await SuiteBase.create(
            started=datetime.now(), parent=suites[2].suiteID,
            title="sample-test-3-2", session_id=session_id,
            file="", suiteType=SuiteType.TEST,
            standing=Status.PASSED
        )
        await SuiteBase.create(
            started=datetime.now(), parent=suites[2].suiteID,
            title="sample-test-3-3", session_id=session_id,
            file="", suiteType=SuiteType.TEST,
            standing=Status.SKIPPED
        )

        for suite in suites:
            await handleSuiteStatus(
                suite.suiteID, session.test
            )

        first_suite = await SuiteBase.filter(suiteID=suites[0].suiteID).first()
        assert first_suite.standing == Status.SKIPPED
        assert first_suite.ended == suites[0].ended, f"{JobType.MODIFY_SUITE} job does not touch end date"
        assert first_suite.skipped == 1
        assert first_suite.passed == 0
        assert first_suite.failed == 0
        assert first_suite.tests == 1

        second_suite = await SuiteBase.filter(suiteID=suites[1].suiteID).first()
        assert second_suite.started == suites[1].started, "as well as the start date"
        assert second_suite.skipped == 0
        assert second_suite.passed == 1
        assert second_suite.failed == 1
        assert second_suite.tests == 2

        third_suite = await SuiteBase.filter(suiteID=suites[2].suiteID).first()
        assert third_suite.duration == suites[2].duration, "and duration"
        assert third_suite.skipped == 1
        assert third_suite.passed == 2
        assert third_suite.failed == 0
        assert third_suite.tests == 3

        for task in suites:
            assert not await TaskBase.exists(ticketID=task.suiteID), "Ticket should be deleted"
