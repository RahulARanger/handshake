from pytest import mark
from handshake.services.DBService.models import (
    SuiteBase,
    RollupBase,
    SessionBase,
    RetriedBase,
    RunBase,
    TaskBase,
    TestLogBase,
)
from handshake.services.SchedularService.start import Scheduler
from handshake.services.DBService.models.enums import Status, LogType
from handshake.services.SchedularService.register import (
    register_patch_suite,
    register_patch_test_run,
)


@mark.usefixtures("sample_test_session")
async def test_simple_prun(db_path, sample_test_session, create_suite):
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
        test_id=session.test_id, type=LogType.ERROR
    ).all()
    assert len(records) == 2

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
