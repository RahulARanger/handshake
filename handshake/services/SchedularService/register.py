from loguru import logger
from handshake.services.DBService.models.dynamic_base import TaskBase, JobType
from uuid import uuid4, UUID
from typing import Union
from handshake.services.DBService.models.static_base import (
    TestConfigBase,
    AttachmentType,
)


async def register_patch_suite(suiteID: str, testID: str) -> TaskBase:
    return await TaskBase.create(
        ticketID=suiteID, test_id=testID, type=JobType.MODIFY_SUITE
    )


async def register_patch_test_run(testID: str) -> TaskBase:
    return await TaskBase.create(
        type=JobType.MODIFY_TEST_RUN, test_id=testID, ticketID=testID
    )


async def mark_for_prune_task(test_id: str):
    logger.warning("Requested to prune some tasks")
    await TaskBase.create(
        ticketID=str(uuid4()), type=JobType.PRUNE_TASKS, test_id=test_id
    )


async def skip_test_run(
    description: str, test_id: Union[str, UUID], reason: str, **extra
) -> False:
    logger.error(reason)
    await TestConfigBase.create(
        test_id=str(test_id),
        attachmentValue=dict(reason=reason, test_id=str(test_id), **extra),
        type=AttachmentType.ERROR,
        description=description,
    )
    await mark_for_prune_task(test_id)
    return False
