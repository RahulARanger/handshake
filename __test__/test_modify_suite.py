from pytest import mark, fixture
from graspit.services.DBService.models import TaskBase, SuiteBase, RunBase, JobBase, SessionBase
from graspit.services.SchedularService.constants import JobType
from graspit.services.SchedularService.modifySuites import handleSuiteStatus
from graspit.services.DBService.models.types import SuiteType, Status
from datetime import datetime


@mark.usefixtures("sample_test_session")
class TestHandleSuiteStatus:
    async def test_one_depth(self, sample_test_session):
        # testing the test run with just three suites
        # first one is skipped
        # second one is failed (with 2 direct test cases 1 - passed 1 - failed)
        # third one is passed (with 3 direct test cases 2 - passed 1 - skipped)

        session = await sample_test_session
        session_id = session.sessionID

        suites = []
        tasks = []

        for suiteIndex in range(3):
            suite = await SuiteBase.create(
                started=datetime.now(),
                title="sample-suite-1", session_id=session_id,
                suiteType=SuiteType.SUITE,
                parent="", standing=Status.YET_TO_CALCULATE
            )
            suites.append(suite)
            tasks.append(
                await TaskBase.create(
                    ticketID=suite.suiteID,
                    type=JobType.MODIFY_SUITE,
                    test_id=session.test, picked=True
                )
            )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[0].suiteID,
            title="sample-test-1-1", session_id=session_id,
            suiteType=SuiteType.TEST,
            standing=Status.SKIPPED
        )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[1].suiteID,
            title="sample-test-2-1", session_id=session_id,
            suiteType=SuiteType.TEST,
            standing=Status.PASSED
        )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[1].suiteID,
            title="sample-test-2-1", session_id=session_id,
            suiteType=SuiteType.TEST,
            standing=Status.FAILED
        )

        await SuiteBase.create(
            started=datetime.now(), parent=suites[2].suiteID,
            title="sample-test-3-1", session_id=session_id,
            suiteType=SuiteType.TEST,
            standing=Status.FAILED
        )
        await SuiteBase.create(
            started=datetime.now(), parent=suites[2].suiteID,
            title="sample-test-3-1", session_id=session_id,
            suiteType=SuiteType.TEST,
            standing=Status.FAILED
        )
        await SuiteBase.create(
            started=datetime.now(), parent=suites[2].suiteID,
            title="sample-test-3-1", session_id=session_id,
            suiteType=SuiteType.TEST,
            standing=Status.FAILED
        )

        for suite in suites:
            await handleSuiteStatus(
                suite.suiteID, session.test
            )
            print("check", suite.suiteID)
