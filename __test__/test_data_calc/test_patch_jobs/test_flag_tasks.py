from pytest import mark
from handshake.services.DBService.models import RunBase, TaskBase, TestLogBase
from handshake.services.SchedularService.start import Scheduler, patch_jobs
from handshake.services.SchedularService.register import (
    mark_for_prune_task,
    JobType,
)
from handshake.services.DBService.models.enums import Status, LogType, LogGeneratedBy
from handshake.services.SchedularService.register import (
    register_patch_suite,
    register_patch_test_run,
)


@mark.usefixtures("sample_test_session")
class TestPruneTasks:
    async def test_delete_prune_task_if_sent(self, sample_test_session):
        session = await sample_test_session
        await mark_for_prune_task(session.test_id)
        assert await TaskBase.filter(type=JobType.PRUNE_TASKS).exists()
        await patch_jobs()
        assert not await TaskBase.filter(type=JobType.PRUNE_TASKS).exists()

    async def test_simple_prune(self, db_path, sample_test_session, create_suite):
        session = await sample_test_session
        test = session.test_id

        parent_suite = await create_suite(session.sessionID)
        await create_suite(session.sessionID, parent=parent_suite.suiteID)
        await register_patch_suite(parent_suite.suiteID, session.test_id)

        parent_suite_2 = await create_suite(session.sessionID)
        await create_suite(session.sessionID, parent=parent_suite_2.suiteID)
        await register_patch_suite(parent_suite_2.suiteID, session.test_id)

        await register_patch_test_run(test)

        await Scheduler(db_path.parent).start()

        # there is a child suite present but not registered
        # it might happen because the test run was interrupted in between

        # expected result, the processing of the parent suite will be skipped
        # AND marks the test run as failed as its child suite was not registered.

        records = await TestLogBase.filter(
            test_id=session.test_id,
            type=LogType.ERROR,
            generatedByGroup=LogGeneratedBy.SCHEDULER,
        ).all()
        assert len(records) == 2
        assert records[0].generatedBy == "patcher-for-next-test-run-patch"
        assert records[1].generatedBy == "patcher-for-next-test-run-patch"

        patch_task = await TaskBase.filter(ticketID=test).first()
        assert patch_task.picked
        assert patch_task.processed

        patch_task = await TaskBase.filter(ticketID=parent_suite.suiteID).first()
        assert patch_task.picked
        assert patch_task.processed

        patch_task = await TaskBase.filter(ticketID=parent_suite_2.suiteID).first()
        assert patch_task.picked
        assert patch_task.processed

        assert (await RunBase.filter(testID=test).first()).standing == Status.PENDING
