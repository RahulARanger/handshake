import uuid
from src.services.DBService.models.task_base import TaskBase
from src.services.DBService.models.result_base import RunBase, SuiteBase, SessionBase
from src.services.DBService.models.types import SuiteType, Status
from src.services.SchedularService.modifySuites import handleSuiteStatus
from __test__.SchedulerService.dummy_scheduler import DummyScheduler
from src.services.SchedularService.constants import JobType
from datetime import datetime
from pytest import mark, fixture


@fixture(autouse=True)
async def prepare_data():
    session_id = str(uuid.uuid4().hex)
    suites = [
        str(uuid.uuid4().hex) for _ in range(10)
    ]
    test_run = await RunBase.create(projectName=JobType.MODIFY_SUITE)

    session = await SessionBase.create(sessionID=session_id, started=datetime.now(), test_id=test_run.testID)
    tasks = []
    suite_records = []
    test_records_map = {}

    for index, suite in enumerate(suites):
        if index == 1:
            extras = dict(failed=1, standing=Status.FAILED)
        elif index == 2:
            extras = dict(skipped=1, standing=Status.SKIPPED)
        else:
            extras = dict(passed=1, standing=Status.PASSED)

        suite_record = await SuiteBase.create(
            file="", started=datetime.now(), suiteID=suite,
            title="sample-suite-1", session_id=session.sessionID, suiteType=SuiteType.SUITE,
            parent=suites[index - 1] if index else "", standing=Status.YET_TO_CALCULATE
        )
        test_records_map[suite_record.suiteID] = []
        for test in range(100):
            test_records_map[suite_record.suiteID].append(await SuiteBase.create(
                title=f'sample-test-{test}', file="", session_id=session.sessionID, started=datetime.now(),
                suiteID=f"{test}-{suite_record.suiteID}", suiteType=SuiteType.TEST, parent=suite_record.suiteID,
                tests=1, **extras
            ))

        suite_records.append(suite_record)
        tasks.append(await TaskBase.create(
            ticketID=suite_record.suiteID, type=JobType.MODIFY_SUITE, test_id=test_run.testID, picked=True
        ))

    yield test_run

    await test_run.delete()


@mark.usefixtures("prepare_data")
class TestModifyTestSuites:
    dummy = DummyScheduler()

    async def test_parent_suite_task(self, prepare_data):
        # in case if the parent task was picked before its children
        # then we must not process the parent task (to avoid invalid data)
        assert await TaskBase.filter(test_id=prepare_data.testID).count() == 10
        # latest parent
        latest_parent = await TaskBase.filter(test_id=prepare_data.testID).order_by("dropped").first()
        before = latest_parent.dropped
        await handleSuiteStatus(latest_parent.ticketID, prepare_data.testID)

        latest_parent = await TaskBase.filter(ticketID=latest_parent.ticketID).first()
        assert latest_parent.dropped != before, "Modified date must be changed"
        assert not latest_parent.picked, "parent suite must not have been picked"

    async def test_normal_process(self, prepare_data):
        tasks = await TaskBase.filter(test_id=prepare_data.testID).order_by("-dropped").all()

        for index, task in enumerate(tasks):
            await handleSuiteStatus(task.ticketID, prepare_data.testID, self.dummy)
            assert not await TaskBase.filter(ticketID=task.ticketID).exists(), "child task is not processed as expected"
            suite = await SuiteBase.filter(suiteID=task.ticketID).first()

            tests = await SuiteBase.filter(parent=suite.suiteID).count()
            assert suite.tests == tests

            if index == len(tasks) - 2:
                assert suite.standing == Status.FAILED
                assert suite.passed == tests
                assert suite.failed == 0
                assert suite.skipped == 0
            elif index == len(tasks) - 1:
                assert suite.standing == Status.SKIPPED
                assert suite.passed == 0
                assert suite.failed == tests
                assert suite.skipped == 0
            else:
                assert suite.standing == Status.PASSED
                assert suite.passed == tests
                assert suite.failed == 0
                assert suite.skipped == 0
