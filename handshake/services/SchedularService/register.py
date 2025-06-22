from loguru import logger
from handshake.services.DBService.models.dynamic_base import TaskBase, JobType
from handshake.services.DBService.models.result_base import RunBase, RunStatus
from uuid import uuid4, UUID
from typing import Union, List
from handshake.services.DBService.models.attachmentBase import (
    TestLogBase,
    LogType,
    LogGeneratedBy,
)


async def register_patch_suite(suiteID: str, testID: str, connection=None):
    _, created = await TaskBase.get_or_create(
        ticketID=suiteID, test_id=testID, type=JobType.MODIFY_SUITE, using_db=connection
    )
    if created:
        return _
    return False


async def register_patch_test_run(testID: str, connection=None) -> TaskBase:
    _, created = await TaskBase.get_or_create(
        type=JobType.MODIFY_TEST_RUN,
        test_id=testID,
        ticketID=testID,
        using_db=connection,
    )
    __, ___ = await TaskBase.get_or_create(
        type=JobType.LOAD_META_FILE,
        test_id=testID,
        ticketID=str(uuid4()),
        using_db=connection,
    )
    return _


async def mark_as_interrupted(test_id: str):
    record = await RunBase.filter(testID=test_id).first()
    record.status = RunStatus.INTERRUPTED
    await record.save()


async def register_bulk_patch_suites(
    testID: str,
    suites: List[str],
    connection=None,
) -> List[TaskBase]:
    tasks = await TaskBase.bulk_create(
        [
            TaskBase(ticketID=suite, test_id=testID, type=JobType.MODIFY_SUITE)
            for suite in suites
        ],
        100,
        using_db=connection,
    )
    return tasks


async def register_bulk_excel_export(
    testIDs: List[str],
    connection=None,
) -> List[TaskBase]:
    tasks = await TaskBase.bulk_create(
        [
            TaskBase(ticketID=str(uuid4()), test_id=test, type=JobType.EXPORT_EXCEL)
            for test in testIDs
        ],
        100,
        using_db=connection,
    )
    return tasks


async def _mark_custom_task(reason: str, job_type: JobType, test_id: str):
    logger.warning(reason)
    await TaskBase.create(ticketID=str(uuid4()), type=job_type, test_id=test_id)


async def mark_for_prune_task(test_id: str):
    # someone called this explicitly, hence it's a warning
    await _mark_custom_task(
        "Requested to prune some tasks", JobType.PRUNE_TASKS, test_id
    )


async def cancel_patch_for_test_run(
    test_id: Union[str, UUID],
    reason: str,
    was_interrupted: bool,
    generated_by: str,
    **extra,
) -> False:
    logger.error(reason)
    await TestLogBase.create(
        test_id=str(test_id),
        title="Cancelled patch for a test run",
        message=reason,
        type=LogType.ERROR,
        feed=extra,
        generatedByGroup=LogGeneratedBy.SCHEDULER,
        generatedBy=generated_by,
    )
    await mark_for_prune_task(test_id)
    if was_interrupted:
        await mark_as_interrupted(test_id)

    return False


async def warn_about_test_run(
    test_id: Union[str, UUID, List[UUID]],
    about: str,
    generated_by: str,
    bulk=False,
    **extra,
) -> True:
    logger.warning(about)
    if not bulk:
        await TestLogBase.create(
            test_id=str(test_id),
            title="A Warning was Raised for this test run",
            message=about,
            type=LogType.WARN,
            feed=extra,
            generatedByGroup=LogGeneratedBy.SCHEDULER,
            generatedBy=generated_by,
        )
    else:
        await TestLogBase.bulk_create(
            [
                TestLogBase(
                    test_id=str(_),
                    title="A Warning was Raised for this test run",
                    message=about,
                    type=LogType.WARN,
                    feed=extra,
                    generatedByGroup=LogGeneratedBy.SCHEDULER,
                    generatedBy=generated_by,
                )
                for _ in test_id
            ]
        )
    return True
