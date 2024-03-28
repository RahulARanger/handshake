from pytest import mark
from handshake.services.DBService.models import (
    ConfigBase,
    TaskBase,
)
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.SchedularService.center import pick_previous_tasks
from handshake.services.SchedularService.completeTestRun import patchTestRun
from subprocess import run
from handshake.services.SchedularService.register import (
    register_patch_suite,
    register_patch_test_run,
)


@mark.sanity
@mark.usefixtures()
class TestPickTasks:
    async def test_picked_previous_tasks(self, sample_test_session, create_suite):
        """
        tests if the patch command picks the tasks that are pending and not yet picked
        :param sample_test_session: test session
        :param create_suite: helper to create a test suite
        :return:
        """
        session = await sample_test_session
        suite = await create_suite(session.sessionID)
        test = await session.test
        task = await register_patch_suite(suite.suiteID, test.testID)
        task.picked = True
        # assumption
        assert not task.processed
        await task.save()
        # now assume the scheduler stopped

        # so in the next run it should plan to pick this
        await pick_previous_tasks()

        updated_task = await TaskBase.filter(ticketID=task.ticketID).first()
        assert not (updated_task.picked or updated_task.processed)

    async def test_reset_test_run(self, sample_test_session, create_suite, root_dir):
        """
        we might have to sometimes add a migration script to reset all test runs
        when requested, it would make all the tasks which were completed to be rescheduled for the
        next patch.
        :param sample_test_session: test session
        :param create_suite: helper to create a suite
        :param root_dir: root directory
        :return:
        """
        session = await sample_test_session
        test = await session.test
        await register_patch_test_run(test.testID)
        await patchTestRun(test.testID, test.testID)
        note = (await TaskBase.filter(ticketID=test.testID).first()).dropped

        # assumption that in migration we turned this on
        record = await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()
        record.value = True
        await record.save()

        result = run(f'handshake patch "{root_dir}"', shell=True)
        assert result.returncode == 0
        record = await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()
        assert not record.value

        ticket = await TaskBase.filter(ticketID=test.testID).first()
        assert ticket.dropped != note, "dropped timestamp is updated"
        assert ticket.processed and ticket.picked
