from pytest import mark
from handshake.services.DBService.models import ConfigBase, TaskBase, RunBase
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.SchedularService.start import Scheduler
from handshake.services.SchedularService.completeTestRun import patchTestRun
from subprocess import run
from handshake.services.SchedularService.register import (
    register_patch_suite,
    register_patch_test_run,
)


@mark.usefixtures()
class TestPickTasks:
    async def test_if_previously_picked_tasks_are_picked(
        self, db_path, sample_test_session, create_suite
    ):
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
        await Scheduler(db_path.parent).init_jobs()

        updated_task = await TaskBase.filter(ticketID=task.ticketID).first()
        assert not (updated_task.picked or updated_task.processed)

    async def test_if_previously_skipped_tasks_are_picked(
        self, db_path, sample_test_session, create_suite
    ):
        """
        tests if the patch command picks the tasks that are skipped previously
        :param sample_test_session: test session
        :param create_suite: helper to create a test suite
        :return:
        """
        session = await sample_test_session
        suite = await create_suite(session.sessionID)
        test = await session.test
        task = await register_patch_suite(suite.suiteID, test.testID)
        task.picked = True
        task.skip = True
        # assumption
        assert not task.processed
        await task.save()
        # now assume the scheduler stopped

        # so in the next run it should plan to pick this
        await Scheduler(db_path.parent).init_jobs()

        updated_task = await TaskBase.filter(ticketID=task.ticketID).first()
        assert not (updated_task.picked or updated_task.processed)

    async def test_reset_test_run(
        self, sample_test_session, create_suite, root_dir, db_path
    ):
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
        test: RunBase = await session.test
        task = await register_patch_test_run(test.testID)
        task.picked = True
        await task.save()

        await patchTestRun(test.testID)
        task = await TaskBase.filter(ticketID=test.testID).first()
        # it is now processed
        assert task.processed
        # note: we do not change the status of picked once it gets processed
        assert task.picked

        note = task.dropped

        # assumption that in migration we turned 'reset_test_run' on
        record = await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()
        record.value = True
        await record.save()

        result = run(f'handshake export "{root_dir}"', shell=True)
        assert result.returncode == 0

        # the first thing it would do it would make the flag: reset_test_run as false
        record = await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()
        assert not record.value

        # next: the task associated with it will now be marked processed and picked
        ticket = await TaskBase.filter(ticketID=test.testID).first()
        updated = ticket.dropped

        # notice its timestamp changes (last modified on)
        assert ticket.dropped != note, "dropped timestamp is updated"
        assert ticket.processed and ticket.picked

        # we can reset manually through -r as well

        result = run(f'handshake export "{root_dir}" -r', shell=True)
        assert result.returncode == 0
        record = await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()
        assert not record.value

        ticket = await TaskBase.filter(ticketID=test.testID).first()
        assert ticket.dropped != updated, "dropped timestamp is updated"
        assert ticket.processed and ticket.picked
